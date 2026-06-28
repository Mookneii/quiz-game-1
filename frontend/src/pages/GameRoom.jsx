import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createStompClient } from '../api/websocket'
import api from '../api/http'

/**
 * UI configuration for the 4 answer choices.
 * Each choice has:
 * - color styling
 * - hover/active effects
 * - shape icon
 * - label (A, B, C, D)
 */
const SHAPES = [
  { bg: 'bg-red-500',    hover: 'hover:bg-red-600',    active: 'bg-red-700',    shape: '▲', label: 'A' },
  { bg: 'bg-blue-500',   hover: 'hover:bg-blue-600',   active: 'bg-blue-700',   shape: '♦', label: 'B' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', active: 'bg-yellow-700', shape: '●', label: 'C' },
  { bg: 'bg-green-500',  hover: 'hover:bg-green-600',  active: 'bg-green-700',  shape: '■', label: 'D' },
]

function GameRoom() {

  // ─────────────────────────────────────────────────────────────
  // Router hooks
  // ─────────────────────────────────────────────────────────────
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()

  // Data passed from previous screen (join page / waiting page)
  const locationState = location.state || {}

  // Game identification
  const gamePin  = params.pin || locationState.pin || '123456'
  const playerId = locationState.playerId
  const nickname = locationState.nickname || 'Player'

  // ─────────────────────────────────────────────────────────────
  // QUESTION STATE
  // ─────────────────────────────────────────────────────────────

  /**
   * Current question data displayed on screen.
   * Initially comes from navigation state,
   * later updated via WebSocket events.
   */
  const [question, setQuestion] = useState(
    locationState.question || null
  )

  // Index of current question (Q1, Q2, etc.)
  const [questionIndex, setQuestionIndex] = useState(
    locationState.questionIndex ?? null
  )

  // Total number of questions in the game
  const [totalQuestions, setTotalQuestions] = useState(
    locationState.totalQuestions ?? null
  )

  // ─────────────────────────────────────────────────────────────
  // TIMER STATE
  // ─────────────────────────────────────────────────────────────

  /**
   * Countdown timer for current question.
   * Initialized from backend question timeLimit.
   */
  const [timeLeft, setTimeLeft] = useState(
    locationState.question?.timeLimit ?? null
  )

  // Whether time has expired
  const [isTimeUp, setIsTimeUp] = useState(false)

  // Used to calculate response time (ms)
  const startTimeRef = useRef(Date.now())
  const endTimeRef = useRef(
    locationState.question?.timeLimit ? Date.now() + locationState.question.timeLimit * 1000 : 0
  )

  // ─────────────────────────────────────────────────────────────
  // ANSWER STATE
  // ─────────────────────────────────────────────────────────────

  // Index of selected answer (0–3)
  const [selectedIndex, setSelectedIndex] = useState(null)

  // ─────────────────────────────────────────────────────────────
  // WEBSOCKET CONNECTION (REAL-TIME GAME UPDATES)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {

    // Do not connect if no game exists
    if (!gamePin) return

    const client = createStompClient()

    client.onConnect = () => {

      // Subscribe to this game room channel
      client.subscribe(`/topic/room/${gamePin}`, (message) => {

        try {
          const event = JSON.parse(message.body)

          // Safe fallback for payload structure
          const payload = event.data ?? event.payload ?? {}

          // ─────────────────────────────────────────────
          // NEW QUESTION STARTED
          // ─────────────────────────────────────────────
          if (event.type === 'QUESTION_STARTED') {

            const newQ = payload.question || payload.questionDTO || null

            // Reset UI for new question
            setQuestion(newQ)
            setQuestionIndex(payload.questionIndex ?? null)
            setTotalQuestions(payload.totalQuestions ?? null)
            setSelectedIndex(null)
            setIsTimeUp(false)
            setTimeLeft(newQ?.timeLimit ?? null)

            // Reset timer reference
            startTimeRef.current = Date.now()
            endTimeRef.current = Date.now() + (newQ?.timeLimit || 0) * 1000
          }

          // ─────────────────────────────────────────────
          // GAME FINISHED
          // ─────────────────────────────────────────────
          else if (event.type === 'GAME_FINISHED') {
            if (stompClientRef.current) {
              stompClientRef.current.deactivate()
            }
            navigate('/leaderboard', { state: { pin: gamePin, playerId: playerId } })
          } 

        } catch (err) {
          console.error('GameRoom WS error:', err)
        }
      })

      // Fetch room status to catch if GAME_FINISHED was sent while we were connecting
      try {
        fetch(`http://${window.location.hostname}:8080/api/rooms/${gamePin}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.status === 'FINISHED') {
              navigate('/leaderboard', { state: { pin: gamePin, playerId } })
            }
          })
          .catch(err => console.error("Failed to fetch room status on reconnect", err))
      } catch (e) {}
    }

    client.activate()

    // Cleanup connection on unmount
    return () => client.deactivate()

  }, [gamePin, navigate])

  // ─────────────────────────────────────────────────────────────
  // TIMER LOGIC (COUNTDOWN)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {

    // Stop timer if invalid state or already answered
    if (timeLeft === null || isTimeUp || selectedIndex !== null) return

    // If time runs out → auto submit
    if (timeLeft <= 0) {
      setIsTimeUp(true)
      handleAutoSubmit()
      return
    }

    // Countdown based on real-time clock to avoid drift
    const id = setInterval(() => {
      setTimeLeft(() => {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
        return remaining
      })
    }, 1000)

    return () => clearInterval(id)

  }, [timeLeft, isTimeUp, selectedIndex])

  // ─────────────────────────────────────────────────────────────
  // AUTO-SUBMIT (WHEN TIME RUNS OUT)
  // ─────────────────────────────────────────────────────────────

  const handleAutoSubmit = async () => {

    // Prevent duplicate submission
    if (!question || selectedIndex !== null) return

    // Navigate to waiting screen, carrying the result
    navigate('/waiting', {
      replace: true,
      state: {
        pin: gamePin,
        playerId,
        nickname,
        selectedIndex: null,
        questionId: question.id,
        choiceId: -1,
        timeTakenMs: (question.timeLimit || 0) * 1000,
        answerResult: null,
      },
    })
  }

  // ─────────────────────────────────────────────────────────────
  // USER SELECTS AN ANSWER
  // ─────────────────────────────────────────────────────────────

  const handleChoice = async (choiceId, index) => {

    // Prevent multiple clicks or answering after timeout
    if (selectedIndex !== null || isTimeUp) return

    setSelectedIndex(index)

    // Calculate response time
    const timeTakenMs = Date.now() - startTimeRef.current

    // Go to waiting screen instantly, carry data so WaitingAnswer can submit it
    navigate('/waiting', {
      replace: true,
      state: {
        pin: gamePin,
        playerId,
        nickname,
        selectedIndex: index,
        questionId: question.id,
        choiceId,
        timeTakenMs,
        answerResult: null,
      },
    })
  }

  // ─────────────────────────────────────────────────────────────
  // DERIVED VALUES (SAFE FALLBACKS)
  // ─────────────────────────────────────────────────────────────

  const choices = question?.choices || []

  // Timer color changes based on remaining time
  const timerColor =
    timeLeft === null
      ? 'bg-slate-700'
      : timeLeft > (question?.timeLimit ?? 30) * 0.5
      ? 'bg-emerald-500'
      : timeLeft > (question?.timeLimit ?? 30) * 0.25
      ? 'bg-yellow-500'
      : 'bg-red-500'

  // ─────────────────────────────────────────────────────────────
  // UI RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">

      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4 bg-slate-800 shadow-lg flex-shrink-0">

        <div className="font-extrabold text-xl text-emerald-400">
          QuizUp
        </div>

        <div className="flex gap-3 items-center">

          {/* Question counter */}
          {questionIndex !== null && totalQuestions !== null && (
            <div className="bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-white/70 uppercase tracking-widest">
              Q {questionIndex + 1} / {totalQuestions}
            </div>
          )}

          {/* Total Score */}
          <div className="bg-white/10 rounded-full px-4 py-2 text-sm font-semibold text-white/70 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300 text-yellow-700 text-xs">★</span>
            {localStorage.getItem('quiz-total-points') || 0}
          </div>

          {/* Player name */}
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2 text-sm font-bold text-emerald-400">
            {nickname}
          </div>

        </div>
      </header>

      {/* MAIN GAME AREA */}
      <main className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 gap-3 sm:gap-8 w-full max-w-5xl mx-auto overflow-hidden">

        {/* If no question yet → waiting screen */}
        {!question ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-2xl font-black text-white/60">
              Waiting for next question...
            </p>
          </div>
        ) : (
          <>
            {/* QUESTION + TIMER */}
            <div className="w-full flex items-start justify-between gap-3 sm:gap-6 flex-shrink-0">

              <h1 className="flex-1 text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {question.questionText}
              </h1>

              {/* Countdown timer */}
              {timeLeft !== null && (
                <div className={`h-12 w-12 sm:h-20 sm:w-20 flex-shrink-0 rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl font-black ${timerColor}`}>
                  {timeLeft}
                </div>
              )}

            </div>

            {/* ANSWER OPTIONS */}
            <div className="w-full flex-1 grid grid-cols-2 gap-2 sm:gap-4 min-h-0">

              {choices.map((c, i) => {
                const s = SHAPES[i % 4]

                return (
                  <button
                    key={c.id || i}
                    onClick={() => handleChoice(c.id, i)}
                    disabled={selectedIndex !== null || isTimeUp}
                    className={`${s.bg} ${s.hover} rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-2xl p-3 sm:p-6`}
                  >
                    <span className="text-center leading-snug">{c.choiceText}</span>
                  </button>
                )
              })}

            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default GameRoom