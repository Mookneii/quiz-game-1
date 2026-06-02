import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createStompClient } from '../api/websocket'
import api from '../api/http'

const SHAPES = [
  { bg: 'bg-red-500',    hover: 'hover:bg-red-600',    active: 'bg-red-700',    shape: '▲', label: 'A' },
  { bg: 'bg-blue-500',   hover: 'hover:bg-blue-600',   active: 'bg-blue-700',   shape: '♦', label: 'B' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', active: 'bg-yellow-700', shape: '●', label: 'C' },
  { bg: 'bg-green-500',  hover: 'hover:bg-green-600',  active: 'bg-green-700',  shape: '■', label: 'D' },
]

function GameRoom() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const locationState = location.state || {}

  const gamePin    = params.pin || locationState.pin || '123456'
  const playerId   = locationState.playerId
  const nickname   = locationState.nickname || 'Player'

  // ─── Question state ────────────────────────────────────────────────────────
  // question comes in via location.state on the first render, and via WebSocket
  // for every subsequent question. We initialise directly so it displays immediately.
  const [question,       setQuestion]       = useState(locationState.question || null)
  const [questionIndex,  setQuestionIndex]  = useState(locationState.questionIndex  ?? null)
  const [totalQuestions, setTotalQuestions] = useState(locationState.totalQuestions ?? null)

  // ─── Timer ────────────────────────────────────────────────────────────────
  // timeLeft is initialised from the question's timeLimit the moment we have one.
  const [timeLeft, setTimeLeft] = useState(
    locationState.question?.timeLimit ?? null
  )
  const [isTimeUp, setIsTimeUp] = useState(false)

  // Track when this question started so we can calculate timeTakenMs
  const startTimeRef = useRef(Date.now())

  // ─── Answer state ─────────────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState(null) // index 0-3

  // ─────────────────────────────────────────────────────────────────────────
  // WebSocket — subscribe once per gamePin
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gamePin) return

    const client = createStompClient()

    client.onConnect = () => {
      client.subscribe(`/topic/room/${gamePin}`, (message) => {
        try {
          const event   = JSON.parse(message.body)
          const payload = event.data ?? event.payload ?? {}

          if (event.type === 'QUESTION_STARTED') {
            // A new question started (this happens when host clicks Next while
            // the player is still on THIS screen — i.e. they haven't answered yet).
            // Reset everything and show the new question.
            const newQ = payload.question || payload.questionDTO || null
            setQuestion(newQ)
            setQuestionIndex(payload.questionIndex  ?? null)
            setTotalQuestions(payload.totalQuestions ?? null)
            setSelectedIndex(null)
            setIsTimeUp(false)
            setTimeLeft(newQ?.timeLimit ?? null)
            startTimeRef.current = Date.now()
          }

          if (event.type === 'GAME_FINISHED') {
            navigate('/leaderboard', { state: { pin: gamePin } })
          }
        } catch (err) {
          console.error('GameRoom WS error:', err)
        }
      })
    }

    client.activate()
    return () => client.deactivate()
  }, [gamePin, navigate])

  // ─────────────────────────────────────────────────────────────────────────
  // Timer countdown — starts whenever timeLeft is a non-null positive number
  // and the player hasn't answered yet.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || isTimeUp || selectedIndex !== null) return

    if (timeLeft <= 0) {
      setIsTimeUp(true)
      handleAutoSubmit()
      return
    }

    const id = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, isTimeUp, selectedIndex])

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-submit when time runs out (no answer selected)
  // ─────────────────────────────────────────────────────────────────────────
  const handleAutoSubmit = async () => {
    if (!question || selectedIndex !== null) return
    try {
      await api.post('/api/games/answer', {
        roomCode:    gamePin,
        playerId,
        questionId:  question.id,
        choiceId:    -1,
        timeTakenMs: (question.timeLimit || 0) * 1000,
      })
    } catch (err) {
      console.error('Auto-submit error:', err)
    }
    // After auto-submit → navigate to WaitingAnswer so the player still sees
    // the waiting screen and receives AnswerRes when host clicks Next.
    navigate('/waiting', {
      replace: true,
      state: { pin: gamePin, playerId, nickname, selectedIndex: null },
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Player picks a choice
  // ─────────────────────────────────────────────────────────────────────────
  const handleChoice = async (choiceId, index) => {
    if (selectedIndex !== null || isTimeUp) return
    setSelectedIndex(index)

    const timeTakenMs = Date.now() - startTimeRef.current

    try {
      await api.post('/api/games/answer', {
        roomCode: gamePin,
        playerId,
        questionId: question.id,
        choiceId,
        timeTakenMs,
      })
      // ✅ Navigate immediately to the Kahoot-style waiting screen
      navigate('/waiting', {
        replace: true,
        state: { pin: gamePin, playerId, nickname, selectedIndex: index },
      })
    } catch (err) {
      console.error('Answer submit error:', err)
      setSelectedIndex(null) // revert on failure
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────────
  const choices = question?.choices || []

  // Timer colour: green → yellow → red as time shrinks
  const timerColor =
    timeLeft === null
      ? 'bg-slate-700'
      : timeLeft > (question?.timeLimit ?? 30) * 0.5
      ? 'bg-emerald-500'
      : timeLeft > (question?.timeLimit ?? 30) * 0.25
      ? 'bg-yellow-500'
      : 'bg-red-500'

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-800 shadow-lg">
        <div className="font-extrabold text-xl text-emerald-400">QuizUp</div>
        <div className="flex gap-3 items-center">
          {/* Question counter */}
          {questionIndex !== null && totalQuestions !== null && (
            <div className="bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-white/70 uppercase tracking-widest">
              Q {questionIndex + 1} / {totalQuestions}
            </div>
          )}
          <div className="bg-white/10 rounded-full px-4 py-2 text-sm font-semibold text-white/70">
            PIN: {gamePin}
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2 text-sm font-bold text-emerald-400">
            {nickname}
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8 w-full max-w-5xl mx-auto">

        {!question ? (
          /* No question yet */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-2xl font-black text-white/60">Waiting for next question...</p>
          </div>
        ) : (
          <>
            {/* ── Question + Timer row ─────────────────────────────────── */}
            <div className="w-full flex items-start justify-between gap-6">
              {/* Question text */}
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  {question.questionText}
                </h1>
              </div>

              {/* Timer circle */}
              {timeLeft !== null && (
                <div
                  className={`
                    shrink-0 flex items-center justify-center
                    h-20 w-20 rounded-full text-white text-4xl font-black
                    shadow-xl transition-colors duration-500
                    ${timerColor}
                  `}
                >
                  {timeLeft}
                </div>
              )}
            </div>

            {/* ── Choices grid ─────────────────────────────────────────── */}
            <div className="w-full grid grid-cols-2 gap-4" style={{ minHeight: '320px' }}>
              {choices.map((c, i) => {
                const s = SHAPES[i % 4]
                return (
                  <button
                    key={c.id || i}
                    onClick={() => handleChoice(c.id, i)}
                    disabled={selectedIndex !== null || isTimeUp}
                    className={`
                      relative overflow-hidden rounded-2xl flex items-center justify-center
                      shadow-lg transition-all duration-150 active:scale-95
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${s.bg} ${s.hover}
                    `}
                  >
                    {/* Background shape watermark */}
                    <span className="text-white opacity-15 text-[9rem] absolute pointer-events-none select-none">
                      {s.shape}
                    </span>
                    {/* Option label pill */}
                    <span className="absolute top-3 left-3 bg-black/20 rounded-full w-8 h-8 flex items-center justify-center text-white font-black text-sm">
                      {s.label}
                    </span>
                    {/* Choice text */}
                    <span className="text-white text-2xl font-bold z-10 px-8 text-center break-words leading-snug">
                      {c.choiceText}
                    </span>
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
