import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import Navbar_res from '../components/Navbar_res'

// ─── Avatar ───────────────────────────────────────────────────────────────────
// Shows a player's initials in a rank-coloured circle.

const RANK_STYLES = {
  1: 'bg-yellow-300 text-yellow-900',
  2: 'bg-slate-300  text-slate-900',
  3: 'bg-amber-300  text-amber-900',
}

function Avatar({ name, rank }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const colorClass = RANK_STYLES[rank] || 'bg-slate-100 text-slate-700'

  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}>
      {initials}
    </div>
  )
}

// ─── Rank medal emoji ──────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="w-5 text-center text-sm font-bold text-slate-400">#{rank}</span>
}

// ─── Row background per rank ───────────────────────────────────────────────────
const ROW_BG = {
  1: 'border-yellow-200 bg-yellow-50',
  2: 'border-slate-200  bg-slate-50',
  3: 'border-amber-200  bg-amber-50',
}

// ─── LeaderboardPage ──────────────────────────────────────────────────────────

const LeaderboardPage = () => {
  const location      = useLocation()
  const locationState = location.state || {}
  const roomCode      = locationState.pin || locationState.roomCode || '123456'

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('rankings')

  // Fetch leaderboard results and filter out host entries
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(
          `https://quizgame-backend-production-5fa0.up.railway.app/api/games/${roomCode}/results`
        )
        if (!res.ok) return

        const data = await res.json()

        // Log raw response so you can verify field names in the browser console
        console.log('Leaderboard raw API response:', data)

        const mapped = data
          // Filter out host entries (no nickname, or explicitly flagged as host)
          .filter((item) => item.nickname && !item.host)
          .map((item) => {
            // Try every common field name the backend might use for score
            const score =
              item.totalScore   ??
              item.total_score  ??
              item.score        ??
              item.points       ??
              item.totalPoints  ??
              item.total_points ??
              0

            const correctCount =
              item.correctCount   ??
              item.correct_count  ??
              item.correctAnswers ??
              0

            return { name: item.nickname, score, correctCount }
          })
          .sort((a, b) => b.score - a.score)

        setEntries(mapped)
      } catch (err) {
        console.error('Leaderboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [roomCode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#15a085] via-[#2fb6a8] to-[#2b8bf5] text-gray-900">
      <Navbar_res />

      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* ── Page heading ─────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="rounded-full bg-white/20 p-2.5">
            <Trophy className="h-7 w-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,220,100,0.8)]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Game Over!</h1>
        </div>

        {/* ── Main card ────────────────────────────────────────────────── */}
        <main className="rounded-3xl bg-white p-5 shadow-[0_20px_60px_rgba(15,138,97,0.2)] sm:p-6">

          {/* Tab switcher — single row, no duplicate label */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              {tab === 'rankings' ? 'Rankings' : 'Review'}
            </h2>

            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {['rankings', 'review'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                    tab === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Rankings tab ───────────────────────────────────────────── */}
          {tab === 'rankings' && (
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="py-8 text-center text-sm text-slate-400">Loading results…</p>
              ) : entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No results yet.</p>
              ) : (
                entries.map((entry, i) => {
                  const rank = i + 1
                  const rowBg = ROW_BG[rank] || 'border-slate-100 bg-white'

                  return (
                    <div
                      key={`${entry.name}-${i}`}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${rowBg}`}
                    >
                      {/* Rank medal */}
                      <RankBadge rank={rank} />

                      {/* Avatar */}
                      <Avatar name={entry.name} rank={rank} />

                      {/* Name */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{entry.name}</p>
                        {entry.correctCount > 0 && (
                          <p className="text-xs text-slate-400">{entry.correctCount} correct</p>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-lg font-extrabold tabular-nums text-slate-900">
                          {entry.score.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">pts</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Review tab ─────────────────────────────────────────────── */}
          {tab === 'review' && <ReviewSection roomCode={roomCode} />}
        </main>

        {/* Back to home */}
        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="rounded-full border border-white/40 bg-white/10 px-8 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/20"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage

// ─── ReviewSection ────────────────────────────────────────────────────────────
// Fetches quiz questions and shows each one with the correct answer highlighted.

function ReviewSection({ roomCode }) {
  const [questions, setQuestions] = useState(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // 1. Get room → quizId
        const roomRes = await fetch(
          `https://quizgame-backend-production-5fa0.up.railway.app/api/rooms/${roomCode}`
        )
        if (!roomRes.ok) return
        const { quizId } = await roomRes.json()
        if (!quizId) return

        // 2. Get quiz → questions
        const quizRes = await fetch(
          `https://quizgame-backend-production-5fa0.up.railway.app/api/quizzes/${quizId}`
        )
        if (!quizRes.ok) return
        const { questions: qs = [] } = await quizRes.json()

        // 3. Normalize into a simple shape
        setQuestions(
          qs.map((q, idx) => ({
            id:      q.id ?? idx,
            text:    q.questionText,
            choices: (q.choices || []).map((c) => ({
              text:      c.choiceText,
              isCorrect: !!c.isCorrect,
            })),
          }))
        )
      } catch (err) {
        console.error('Review fetch error:', err)
      }
    }

    fetchQuestions()
  }, [roomCode])

  if (!questions) {
    return <p className="mt-6 text-center text-sm text-slate-400">Loading review…</p>
  }

  if (questions.length === 0) {
    return <p className="mt-6 text-center text-sm text-slate-400">No questions to review.</p>
  }

  return (
    <div className="mt-4 space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          {/* Question header */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Question {idx + 1}
          </p>
          <p className="mb-3 font-semibold text-slate-900">{q.text}</p>

          {/* Choices */}
          <ul className="space-y-2">
            {q.choices.map((c, i) => (
              <li
                key={i}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  c.isCorrect
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-transparent bg-white text-slate-700'
                }`}
              >
                <span>{c.text}</span>
                {c.isCorrect && (
                  <span className="ml-2 shrink-0 text-xs font-bold text-emerald-600">✓ Correct</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}