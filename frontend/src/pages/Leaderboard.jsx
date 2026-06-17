import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import Navbar_res from '../components/Navbar_res'

/**
 * Local storage key (not heavily used in this version,
 * but kept for potential caching of leaderboard data)
 */
const STORAGE_KEY = 'quiz-leaderboard'

/**
 * Dummy default result (unused here, likely leftover from testing)
 */
const defaultResult = {
	isCorrect: true,
	pointsEarned: 10,
	streak: 3,
	totalPoints: 120,
	currentQuestion: 2,
	totalQuestions: 10,
}

/**
 * Fallback leaderboard data (only used if API fails or for testing)
 */
const defaultEntries = [
	{ name: 'Jack', score: 12450 },
	{ name: 'Khabib', score: 11200 },
	{ name: 'Cupcake', score: 9850 },
	{ name: 'Platini', score: 8400 },
	{ name: "Ling'er", score: 7900 },
]

/**
 * Avatar component:
 * Displays user initials inside a colored circle based on rank
 */
const Avatar = ({ name, rank }) => {

	// Extract initials (max 2 letters)
	const initials = (name || '')
		.split(/\s+/)
		.map((n) => n[0])
		.slice(0, 2)
		.join('')
		.toUpperCase()

	// Rank-based color styling
	const bg =
		rank === 1
			? 'bg-yellow-300 text-yellow-900'
			: rank === 2
				? 'bg-slate-300 text-slate-900'
				: rank === 3
					? 'bg-amber-300 text-amber-900'
					: 'bg-slate-100 text-slate-900'

	return (
		<div className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${bg}`}>
			{initials}
		</div>
	)
}

const LeaderboardPage = () => {

	// Router state (used to get room/game code)
	const location = useLocation()
	const locationState = location.state || {}

	// Room identifier (fallback to demo code if missing)
	const roomCode = locationState.pin || locationState.roomCode || '123456'

	// Leaderboard entries fetched from backend
	const [entries, setEntries] = useState([])

	// Tab state: "rankings" or "review"
	const [tab, setTab] = useState('rankings')

	/**
	 * Fetch leaderboard results when page loads
	 */
	useEffect(() => {
		const fetchResults = async () => {
			try {

				// Call backend leaderboard API
				const response = await fetch(
					`http://localhost:8080/api/games/${roomCode}/results`
				)

				if (response.ok) {
					const data = await response.json()

					// Map backend data into UI-friendly format
					const mappedEntries = data
						.map((item) => ({
							name: item.nickname,
							score: item.totalScore,
							correctCount: item.correctCount,
						}))
						// Sort highest score first
						.sort((a, b) => b.score - a.score)

					setEntries(mappedEntries)
				}
			} catch (err) {
				console.error("Error fetching leaderboard results:", err)
			}
		}

		fetchResults()
	}, [roomCode])

	return (
		<div className="min-h-screen bg-linear-to-br from-[#15a085] via-[#2fb6a8] to-[#2b8bf5] text-gray-900">

			{/* Top navbar */}
			<Navbar_res />

			<div className="mx-auto max-w-3xl">

				{/* Header section */}
				<header className="mb-4 flex items-center justify-center gap-10 rounded-xl border border-white/30 px-10 py-10 backdrop-blur-sm">

					<div className="flex items-center gap-4">

						{/* Trophy icon */}
						<div className="rounded-full bg-white/20 p-2">
							<Trophy className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(255,255,200,0.8)]" />
						</div>

						{/* Title */}
						<h1 className="text-3xl font-extrabold text-white">
							Game Over!
						</h1>

					</div>
				</header>

				{/* Main container */}
				<main className="rounded-[2.6rem] bg-white p-6 shadow-[0_20px_70px_rgba(15,138,97,0.18)]">

					{/* Tabs header */}
					<div className="flex items-center justify-between">

						<div className="rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold">
							Rankings
						</div>

						{/* Tab switcher */}
						<div className="flex items-center gap-2 rounded-full bg-slate-50 p-1">

							<button
								onClick={() => setTab('rankings')}
								className={`px-4 py-2 rounded-full text-sm ${
									tab === 'rankings'
										? 'bg-white text-slate-900'
										: 'text-slate-500'
								}`}
							>
								Rankings
							</button>

							<button
								onClick={() => setTab('review')}
								className={`px-4 py-2 rounded-full text-sm ${
									tab === 'review'
										? 'bg-white text-slate-900'
										: 'text-slate-500'
								}`}
							>
								Review
							</button>

						</div>
					</div>

					{/* ─────────────────────────────────────────────
					    LEADERBOARD TAB
					───────────────────────────────────────────── */}
					{tab === 'rankings' && (
						<div className="mt-6 space-y-4">

							{entries.map((e, i) => (
								<div
									key={i}
									className={`flex items-center justify-between rounded-xl border p-4 ${
										i === 0
											? 'border-yellow-200 bg-yellow-200'
											: i === 1
												? 'border-slate-200 bg-slate-200'
												: i === 2
													? 'border-amber-200 bg-amber-100'
													: 'border-slate-300 bg-white'
									}`}
								>

									{/* Left side: avatar + name */}
									<div className="flex items-center gap-4">
										<Avatar name={e.name} rank={i + 1} />

										<div>
											<div className="text-sm text-slate-500">
												#{i + 1}
											</div>
											<div className="font-semibold text-slate-900">
												{e.name}
											</div>
										</div>
									</div>

									{/* Right side: score */}
									<div className="text-right">
										<div className="text-lg font-extrabold tabular-nums">
											{e.score.toLocaleString()}
										</div>
										<div className="text-xs text-slate-500">
											PTS
										</div>
									</div>

								</div>
							))}
						</div>
					)}

					{/* ─────────────────────────────────────────────
					    REVIEW TAB
					───────────────────────────────────────────── */}
					{tab === 'review' && (
						<ReviewSection roomCode={roomCode} />
					)}

				</main>

				{/* Back button */}
				<div className="mt-8 flex justify-center">
					<Link
						to="/"
						className="rounded-full border border-white/40 bg-white/10 px-8 py-3 text-sm font-semibold text-white/90 hover:bg-white/20"
					>
						Back to Home
					</Link>
				</div>

			</div>
		</div>
	)
}

export default LeaderboardPage


// ─────────────────────────────────────────────────────────────
// REVIEW SECTION COMPONENT
// ─────────────────────────────────────────────────────────────

function ReviewSection({ roomCode }) {

	// Stores quiz questions from backend
	const [questions, setQuestions] = useState(null)

	// Stores user answers (currently not populated here)
	const [answersMap, setAnswersMap] = useState({})

	/**
	 * Fetch quiz questions for review
	 * Flow:
	 * 1. Get room info → find quizId
	 * 2. Fetch quiz by quizId
	 * 3. Extract questions + correct answers
	 */
	useEffect(() => {
		const fetchQuizQuestions = async () => {
			try {

				// Step 1: get room details
				const roomResponse = await fetch(
					`http://localhost:8080/api/rooms/${roomCode}`
				)

				if (!roomResponse.ok) return
				const roomData = await roomResponse.json()

				const quizId = roomData.quizId
				if (!quizId) return

				// Step 2: get quiz details
				const quizResponse = await fetch(
					`http://localhost:8080/api/quizzes/${quizId}`
				)

				if (!quizResponse.ok) return
				const quizData = await quizResponse.json()

				// Step 3: normalize questions
				const mappedQuestions = (quizData.questions || []).map((q, idx) => {

					const correctChoice = q.choices?.find(c => c.isCorrect)
					const correctText = correctChoice ? correctChoice.choiceText : ""

					return {
						id: q.id || idx,
						text: q.questionText,
						choices: q.choices?.map(c => c.choiceText) || [],
						answer: correctText,
					}
				})

				setQuestions(mappedQuestions)

			} catch (err) {
				console.error("Error fetching review questions:", err)
			}
		}

		fetchQuizQuestions()
	}, [roomCode])

	// Loading state
	if (!questions) {
		return <div className="mt-6 p-6">Loading review...</div>
	}

	return (
		<div className="mt-6 space-y-4">

			<h3 className="text-lg font-semibold">Review</h3>

			{questions.map((q, idx) => (
				<div
					key={q.id ?? idx}
					className="rounded-xl border border-slate-100 bg-white p-4"
				>

					{/* Question number */}
					<div className="mb-2 text-sm text-slate-500">
						Question {idx + 1}
					</div>

					{/* Question text */}
					<div className="mb-3 font-semibold text-slate-900">
						{q.text}
					</div>

					{/* Choices or fallback answer */}
					{Array.isArray(q.choices) && q.choices.length > 0 ? (
						<ul className="space-y-2">

							{q.choices.map((c, i) => {

								// Check correct answer
								const isCorrect =
									(q.answer && c === q.answer) ||
									(typeof q.correctChoiceIndex === 'number' && i === q.correctChoiceIndex)

								// Check user's answer (if stored)
								const userAnswer =
									answersMap[q.id] ?? answersMap[idx]

								const isUser =
									userAnswer != null &&
									(userAnswer === c || userAnswer === i)

								return (
									<li
										key={i}
										className={`rounded-md px-3 py-2 ${
											isCorrect
												? 'bg-emerald-50 border border-emerald-100'
												: isUser
													? 'bg-yellow-50 border border-yellow-100'
													: 'bg-slate-50'
										}`}
									>
										<div className="flex items-center justify-between">

											{/* Choice text */}
											<div className="text-sm text-slate-800">
												{c}
											</div>

											{/* Labels: correct / your answer */}
											<div className="text-xs text-slate-500">
												{isCorrect
													? 'Correct'
													: isUser
														? 'Your answer'
														: ''}
											</div>

										</div>
									</li>
								)
							})}
						</ul>

					) : (
						// Fallback if no multiple choices
						<div className="text-sm text-slate-700">
							Answer: <span className="font-semibold">
								{q.answer || q.correctAnswer || '—'}
							</span>
						</div>
					)}
				</div>
			))}
		</div>
	)
}