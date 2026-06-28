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
  const [myPlayerId, setMyPlayerId] = useState(locationState.playerId || null)

  // Fetch leaderboard results and filter out host entries
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(
          `https://quizgame-backend-production-5fa0.up.railway.app/api/games/${roomCode}/results?t=${Date.now()}`
        )
        if (!res.ok) return

        const data = await res.json()

        // Log raw response so you can verify field names in the browser console
        console.log('Leaderboard raw API response:', data)

        // Try to identify the current player if we don't have the ID from navigation
        if (!myPlayerId) {
          try {
            const rawUser = localStorage.getItem("user");
            if (rawUser && rawUser !== "undefined") {
              const parsedUser = JSON.parse(rawUser);
              const myResult = data.find(
                (item) => item.nickname === parsedUser.fullName
              );
              if (myResult) setMyPlayerId(myResult.playerId);
            }
          } catch (e) {
            console.error("Failed to parse user for myPlayerId", e);
          }
        }

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
          {tab === 'review' && <ReviewSection roomCode={roomCode} myPlayerId={myPlayerId} />}
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

function ReviewSection({ roomCode, myPlayerId }) {
  const [questions, setQuestions] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [visibleCount, setVisibleCount] = useState(10)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const cacheKey = `review_${roomCode}_${myPlayerId || 'host'}`
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          setQuestions(parsed.questions)
          setUserAnswers(parsed.userAnswers || {})
          return
        }

        const url = new URL(`https://quizgame-backend-production-5fa0.up.railway.app/api/games/${roomCode}/review`)
        url.searchParams.append('t', Date.now())
        if (myPlayerId) {
          url.searchParams.append('playerId', myPlayerId)
        }

        const res = await fetch(url.toString())
        if (!res.ok) return

        const data = await res.json()
        
        // Cache the result so switching tabs/reloading is instant
        sessionStorage.setItem(cacheKey, JSON.stringify(data))

        setQuestions(data.questions)
        setUserAnswers(data.userAnswers || {})
      } catch (err) {
        console.error('Review fetch error:', err)
      }
    }

    fetchQuestions()
  }, [roomCode, myPlayerId])

  if (!questions) {
    return <p className="mt-6 text-center text-sm text-slate-400">Loading review…</p>
  }

  if (questions.length === 0) {
    return <p className="mt-6 text-center text-sm text-slate-400">No questions to review.</p>
  }

  const visibleQuestions = questions.slice(0, visibleCount);

  return (
    <div className="mt-4 space-y-4">
      {visibleQuestions.map((q, idx) => (
        <div key={q.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" style={{ contentVisibility: 'auto', containIntrinsicSize: '200px' }}>
          {/* Question header */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Question {idx + 1}
          </p>
          <p className="mb-3 font-semibold text-slate-900">{q.text}</p>

          {/* Choices */}
          <ul className="space-y-2">
            {q.choices.map((c, i) => {
              let bgClass = 'border border-transparent bg-white text-slate-700';
              const isCorrectAnswer = c.isCorrect;
              const isUserAnswer = String(c.id) === String(userAnswers[q.id]);

              if (isCorrectAnswer && isUserAnswer) {
                bgClass = 'border border-emerald-200 bg-emerald-50 text-emerald-800';
              } else if (isCorrectAnswer) {
                bgClass = 'border border-blue-200 bg-blue-50 text-blue-800';
              } else if (isUserAnswer) {
                bgClass = 'border border-red-200 bg-red-50 text-red-800';
              }

              return (
                <li
                  key={i}
                  className={`flex flex-col gap-2 rounded-xl px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between ${bgClass}`}
                >
                  <span>{c.text}</span>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {isCorrectAnswer && isUserAnswer && (
                      <>
                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">✓ Correct</span>
                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Your Answer</span>
                      </>
                    )}
                    {isCorrectAnswer && !isUserAnswer && (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">✓ Correct Answer</span>
                    )}
                    {isUserAnswer && !isCorrectAnswer && (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">✗ Your Answer</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      
      {visibleCount < questions.length && (
        <button
          onClick={() => setVisibleCount(v => v + 10)}
          className="w-full py-3 mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
        >
          Load More Questions
        </button>
      )}
    </div>
  )
}