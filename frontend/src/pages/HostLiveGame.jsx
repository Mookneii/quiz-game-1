import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api/http'
import { createStompClient } from '../api/websocket'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const createAvatar = (name, fromColor, toColor) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${fromColor}" />
          <stop offset="100%" stop-color="${toColor}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#g)" />
      <circle cx="48" cy="38" r="18" fill="rgba(255,255,255,0.92)" />
      <path d="M22 84c5-15 16-23 26-23s21 8 26 23" fill="rgba(255,255,255,0.92)" />
      <text x="48" y="56" text-anchor="middle" font-size="22" font-family="Arial, sans-serif"
        font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const AVATAR_FROM = '#667eea'
const AVATAR_TO   = '#764ba2'

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlayerRow({ player }) {
  const name = player.nickname || player.name || 'User'
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={createAvatar(name, AVATAR_FROM, AVATAR_TO)}
          alt={`${name} avatar`}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
      </div>
      <span className="ml-2 shrink-0 text-xs font-bold text-blue-500">
        {(player.score || 0).toLocaleString()}
      </span>
    </div>
  )
}

const CHOICE_COLORS = [
  'bg-violet-100 border-violet-200 text-violet-800',
  'bg-blue-100   border-blue-200   text-blue-800',
  'bg-emerald-100 border-emerald-200 text-emerald-800',
  'bg-amber-100  border-amber-200  text-amber-800',
]

function ChoiceCard({ choice, index }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${CHOICE_COLORS[index % 4]}`}>
      {choice.choiceText}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function HostLiveGame() {
  const navigate = useNavigate()
  const location = useLocation()
  const params   = useParams()

  const gamePin = (() => {
    const s = location.state || {}
    return params.pin || s.pin || s.roomCode || '------'
  })()

  // ── State ──────────────────────────────────────────────────────────────────
  const [isExitModalOpen,     setIsExitModalOpen]     = useState(false)
  // Mobile-only: toggle the player drawer
  const [isPlayerDrawerOpen,  setIsPlayerDrawerOpen]  = useState(false)
  const [connectionStatus,    setConnectionStatus]    = useState('connecting')
  const [players,             setPlayers]             = useState([])
  const [currentQuestion,     setCurrentQuestion]     = useState(null)
  const [questionIndex,       setQuestionIndex]       = useState(0)
  const [totalQuestions,      setTotalQuestions]      = useState(0)
  const [answeredPlayers,     setAnsweredPlayers]     = useState([])
  const [nextQuestionLoading, setNextQuestionLoading] = useState(false)
  const [questionError,       setQuestionError]       = useState('')

  const firstQuestionRequestedRef = useRef(false)

  // ── Derived values ─────────────────────────────────────────────────────────
  const nonHostPlayers  = players.filter((p) => !p.host)
  const totalPlayers    = nonHostPlayers.length
  const answeredCount   = answeredPlayers.length
  const answeredPercent = totalPlayers > 0 ? Math.round((answeredCount / totalPlayers) * 100) : 0
  const progressPercent = totalQuestions > 0 ? Math.round(((questionIndex + 1) / totalQuestions) * 100) : 0
  const isLastQuestion  = questionIndex + 1 >= totalQuestions && totalQuestions > 0

  // ── WebSocket + initial fetch ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    let client

    const initializeRoom = async () => {
      try {
        const res = await fetch(
          `https://quizgame-backend-production-5fa0.up.railway.app/api/rooms/${gamePin}`
        )
        if (!res.ok || cancelled) return

        const data = await res.json()
        setPlayers(data.players || [])

        if (data.quizId) {
          const quizRes = await fetch(
            `https://quizgame-backend-production-5fa0.up.railway.app/api/quizzes/${data.quizId}`
          )
          if (quizRes.ok) {
            const quizData = await quizRes.json()
            if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
              if (!cancelled) setQuestionError('This quiz has no questions yet.')
              return
            }
          }
        }

        client = createStompClient()

        client.onConnect = () => {
          setConnectionStatus('connected')

          client.subscribe(`/topic/room/${gamePin}`, (message) => {
            try {
              const event   = JSON.parse(message.body)
              const payload = event.data ?? event.payload ?? {}

              if (event.type === 'QUESTION_STARTED') {
                setCurrentQuestion(payload.question || payload.questionDTO || null)
                setQuestionIndex(payload.questionIndex ?? 0)
                setTotalQuestions(payload.totalQuestions ?? 0)
                setAnsweredPlayers([])
              } else if (event.type === 'ANSWER_RESULT') {
                setAnsweredPlayers((prev) =>
                  prev.includes(payload.playerId) ? prev : [...prev, payload.playerId]
                )
              } else if (event.type === 'LEADERBOARD_UPDATE') {
                setPlayers(payload || [])
              } else if (event.type === 'GAME_FINISHED') {
                navigate('/leaderboard', { state: { pin: gamePin } })
              }
            } catch { /* ignore malformed messages */ }
          })

          if (!firstQuestionRequestedRef.current) {
            firstQuestionRequestedRef.current = true
            api.post('/api/games/next', { roomCode: gamePin, questionIndex: 0 })
              .catch((err) => {
                setQuestionError(err?.response?.data?.message || 'Unable to load the first question.')
                firstQuestionRequestedRef.current = false
              })
          }
        }

        client.onWebSocketClose = () => setConnectionStatus('disconnected')
        client.activate()
      } catch (err) {
        console.error('Error initializing room:', err)
      }
    }

    initializeRoom()
    return () => { cancelled = true; client?.deactivate() }
  }, [gamePin, navigate])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleNextQuestion = async () => {
    try {
      setNextQuestionLoading(true)
      await api.post('/api/games/next', { roomCode: gamePin, questionIndex: questionIndex + 1 })
    } catch { /* keep current question visible */ }
    finally { setNextQuestionLoading(false) }
  }

  const handleEndGame = async () => {
    try { await api.post('/api/games/end', { roomCode: gamePin }) }
    catch (err) { console.error('Failed to end game', err) }
    navigate('/leaderboard', { state: { pin: gamePin } })
  }

  const handleConfirmExit = async () => {
    setIsExitModalOpen(false)
    try { await api.post('/api/games/end', { roomCode: gamePin }) }
    catch (err) { console.error('Failed to end game', err) }
    navigate('/host')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-emerald-500">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      {/*
        Mobile  : [Exit] ····· [PIN] ····· [Players btn]   — one compact row
        Desktop : same three columns but with more breathing room
      */}
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3">

        {/* Exit button */}
        <button
          type="button"
          onClick={() => setIsExitModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span>←</span>
          <span className="hidden sm:inline">Exit Game</span>
          <span className="sm:hidden">Exit</span>
        </button>

        {/* Game PIN — always centered */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-white/70 sm:text-[10px]">
            Game PIN
          </span>
          <div className="rounded-lg bg-white/20 px-4 py-1 text-lg font-black tracking-[0.15em] text-white backdrop-blur-sm sm:rounded-xl sm:px-6 sm:py-1.5 sm:text-2xl">
            {gamePin}
          </div>
        </div>

        {/*
          Mobile  : a compact "👥 N" button that opens the player drawer
          Desktop : the full player pill with avatars
        */}
        {/* Mobile player count button */}
        <button
          type="button"
          onClick={() => setIsPlayerDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm sm:hidden"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          {totalPlayers}
        </button>

        {/* Desktop player pill */}
        <div className="hidden items-center gap-3 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm sm:flex">
          <div className="flex -space-x-2">
            {nonHostPlayers.slice(0, 3).map((p) => (
              <img
                key={p.id}
                src={createAvatar(p.nickname || p.name || 'User', AVATAR_FROM, AVATAR_TO)}
                alt=""
                className="h-7 w-7 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/90" />
            {totalPlayers} Players
          </span>
        </div>
      </header>

      {/*
        ── Body ──────────────────────────────────────────────────────────────
        Mobile  : main panel fills the full width (sidebar is in a drawer)
        Desktop : sidebar (fixed 200 px) + main panel side by side
      */}
      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 sm:px-5 sm:pb-5">

        {/* ── Desktop-only sidebar ──────────────────────────────────────── */}
        <aside className="hidden w-48 shrink-0 flex-col rounded-2xl bg-slate-50 p-3 shadow-lg sm:flex xl:w-56">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span>📊</span>
              <h2 className="text-sm font-black text-slate-800">Players</h2>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${
              connectionStatus === 'connected' ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {connectionStatus === 'connected' ? 'Live' : 'Connecting…'}
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {nonHostPlayers.length === 0
              ? <p className="px-1 text-xs text-slate-400">No players yet.</p>
              : nonHostPlayers.map((p) => <PlayerRow key={p.id} player={p} />)
            }
          </div>

          <p className="mt-3 text-center text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            {currentQuestion ? 'In progress' : 'Waiting…'}
          </p>
        </aside>

        {/* ── Main question panel ───────────────────────────────────────── */}
        <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50 to-indigo-100 p-4 shadow-lg sm:p-6">

          {/* Question badge + progress */}
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-600">
              <span className={`h-1.5 w-1.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-violet-400'
              }`} />
              {currentQuestion && totalQuestions > 0
                ? `Q ${questionIndex + 1} / ${totalQuestions}`
                : 'Preparing…'}
            </div>

            {totalQuestions > 0 && (
              <div className="h-1 w-36 overflow-hidden rounded-full bg-slate-200 sm:w-48">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Question text + choices — scrollable if too tall on small screens */}
          <div className="mt-3 flex-1 overflow-y-auto">
            <h1 className="text-xl font-black leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
              {questionError
                ? questionError
                : currentQuestion
                ? currentQuestion.questionText
                : 'Preparing first question…'}
            </h1>

            {!questionError && currentQuestion && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {currentQuestion.choices?.map((choice, i) => (
                  <ChoiceCard key={choice.id ?? i} choice={choice} index={i} />
                ))}
              </div>
            )}

            {questionError && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {questionError}
              </div>
            )}
          </div>

          {/* ── Bottom action row ─────────────────────────────────────── */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">

            {/* Answer progress bar */}
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold text-slate-700 sm:text-sm">
                <span className="font-black text-slate-900">{answeredCount}</span>
                <span className="text-slate-500"> / {totalPlayers} answered</span>
                <span className="ml-2 font-bold text-blue-600">{answeredPercent}%</span>
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${answeredPercent}%` }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex shrink-0 items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleEndGame}
                className="h-9 rounded-xl border-2 border-red-400 bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-red-500 transition hover:bg-red-50 sm:h-10 sm:px-5 sm:text-sm"
              >
                End
              </button>

              {!isLastQuestion && (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={!currentQuestion || nextQuestionLoading}
                  className="h-9 rounded-xl bg-blue-500 px-4 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-5 sm:text-sm"
                >
                  {nextQuestionLoading ? 'Loading…' : 'Next →'}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── Mobile player drawer ───────────────────────────────────────────── */}
      {/*
        Slides up from the bottom on mobile when the player-count button is tapped.
        Hidden entirely on sm+ (the sidebar handles it there).
      */}
      {isPlayerDrawerOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsPlayerDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative z-10 max-h-[70vh] rounded-t-3xl bg-white px-4 pb-8 pt-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800">
                Players ({totalPlayers})
              </h2>
              <button
                type="button"
                onClick={() => setIsPlayerDrawerOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto space-y-2" style={{ maxHeight: 'calc(70vh - 80px)' }}>
              {nonHostPlayers.length === 0
                ? <p className="text-sm text-slate-400">No players yet.</p>
                : nonHostPlayers.map((p) => <PlayerRow key={p.id} player={p} />)
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Exit confirmation modal ────────────────────────────────────────── */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">End the game for everyone?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              This will end the session for all players and take you back to the host dashboard.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HostLiveGame