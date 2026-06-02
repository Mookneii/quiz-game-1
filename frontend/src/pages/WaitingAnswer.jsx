import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createStompClient } from '../api/websocket'

function WaitingAnswer() {
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state || {}

  const gamePin = locationState.pin
  const playerId = locationState.playerId
  const nickname = locationState.nickname
  // The choice index the player selected (0–3) used for icon display
  const selectedIndex = locationState.selectedIndex ?? null

  // We hold the answer result received from the server until QUESTION_STARTED
  // fires (or the timer runs out), then we navigate to /results.
  const answerResultRef = useRef(null)
  const [answerResult, setAnswerResult] = useState(null)
  const [dots, setDots] = useState(1)

  // Animated dots for the waiting text
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    answerResultRef.current = answerResult
  }, [answerResult])

  useEffect(() => {
    if (!gamePin) return

    const client = createStompClient()

    client.onConnect = () => {
      client.subscribe(`/topic/room/${gamePin}`, (message) => {
        try {
          const event = JSON.parse(message.body)
          const payload = event.data ?? event.payload ?? {}

          if (event.type === 'ANSWER_RESULT' && payload.playerId === playerId) {
            setAnswerResult(payload)
            answerResultRef.current = payload
          }

          if (event.type === 'QUESTION_STARTED') {
            // Host clicked next — show AnswerRes with the result (may or may not
            // have arrived yet), then auto-navigate to the new question.
            const result = answerResultRef.current
            navigate('/results', {
              replace: true,
              state: {
                pin: gamePin,
                playerId,
                nickname,
                result: result ?? {},
                nextQuestion: payload,
              },
            })
          }

          if (event.type === 'GAME_FINISHED') {
            navigate('/leaderboard', { state: { pin: gamePin } })
          }
        } catch (_) {
          // Ignore malformed messages
        }
      })
    }

    client.activate()
    return () => client.deactivate()
  }, [gamePin, playerId, nickname, navigate])

  const SHAPE_COLORS = [
    { bg: 'bg-red-500', shape: '▲', label: 'A' },
    { bg: 'bg-blue-500', shape: '♦', label: 'B' },
    { bg: 'bg-yellow-500', shape: '●', label: 'C' },
    { bg: 'bg-green-500', shape: '■', label: 'D' },
  ]

  const selected = selectedIndex !== null ? SHAPE_COLORS[selectedIndex % 4] : null

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-10 px-6">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-4">
        <div className="font-extrabold text-xl text-emerald-400">QuizUp</div>
        <div className="bg-white/10 rounded-full px-4 py-2 text-sm font-semibold text-white/70">
          PIN: {gamePin}
        </div>
        <div className="bg-white/10 rounded-full px-4 py-2 text-sm font-semibold text-emerald-400">
          {nickname}
        </div>
      </div>

      {/* Selected answer badge */}
      {selected && (
        <div
          className={`
            flex items-center gap-4 px-8 py-5 rounded-3xl shadow-2xl text-white
            ${selected.bg}
          `}
        >
          <span className="text-5xl opacity-80">{selected.shape}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Your answer</p>
            <p className="text-2xl font-black">Option {selected.label}</p>
          </div>
        </div>
      )}

      {/* Pulsing spinner */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring pulse */}
        <div className="absolute h-40 w-40 rounded-full border-4 border-emerald-500/30 animate-ping" />
        <div className="absolute h-28 w-28 rounded-full border-4 border-emerald-500/50 animate-ping [animation-delay:0.3s]" />
        {/* Inner spinner */}
        <div className="h-20 w-20 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
        <div className="absolute text-3xl">✓</div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-3xl font-black text-white">
          Answer submitted!
        </p>
        <p className="mt-3 text-lg text-white/60">
          Waiting for results{'.'.repeat(dots)}
        </p>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm text-white/40 font-medium">
          Results will appear automatically when the host advances
        </div>
      </div>
    </div>
  )
}

export default WaitingAnswer
