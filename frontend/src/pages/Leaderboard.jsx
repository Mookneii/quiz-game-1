import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import Navbar_res from '../components/Navbar_res';

const STORAGE_KEY = 'quiz-leaderboard'
const defaultResult = {
	isCorrect: true,
	pointsEarned: 10,
	streak: 3,
	totalPoints: 120,
	currentQuestion: 2,
	totalQuestions: 10,
};
const defaultEntries = [
	{ name: 'Jack', score: 12450 },
	{ name: 'Khabib', score: 11200 },
	{ name: 'Cupcake', score: 9850 },
	{ name: 'Platini', score: 8400 },
	{ name: "Ling'er", score: 7900 },
]

const Avatar = ({ name, rank }) => {
	const initials = (name || '')
		.split(/\s+/)
		.map((n) => n[0])
		.slice(0, 2)
		.join('')
		.toUpperCase()

	const bg =
		rank === 1
			? 'bg-yellow-300 text-yellow-900' // keep
			: rank === 2
				? 'bg-slate-300 text-slate-900' // keep
				: rank === 3
					? 'bg-amber-300 text-amber-900' // keep
					: 'bg-slate-100 text-slate-900' // keep

	return <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold ${bg}`}>{initials}</div>
}

const LeaderboardPage = () => {
	const location = useLocation()
	const locationState = location.state || {}
	const roomCode = locationState.pin || locationState.roomCode || '123456'

	const [entries, setEntries] = useState([])
	const [tab, setTab] = useState('rankings')

	useEffect(() => {
		const fetchResults = async () => {
			try {
				const response = await fetch(`http://localhost:8080/api/games/${roomCode}/results`)
				if (response.ok) {
					const data = await response.json()
					const mappedEntries = data.map((item) => ({
						name: item.nickname,
						score: item.totalScore,
						correctCount: item.correctCount,
					})).sort((a, b) => b.score - a.score)
					setEntries(mappedEntries)
				}
			} catch (err) {
				console.error("Error fetching leaderboard results:", err)
			}
		}
		fetchResults()
	}, [roomCode])

	return (
		<div className="min-h-screen bg-linear-to-br from-[#15a085] via-[#2fb6a8] to-[#2b8bf5] text-gray-900 bg-[#f8f8f8] font-sans">
			<Navbar_res/>
			<div className="mx-auto max-w-3xl">
				<header className="mb-4 flex items-center justify-center gap-10 bg-clip-padding backdrop-blur-sm rounded-xl border border-white/30 px-10 py-10">
					<div className="flex items-center gap-4">
						<div className="rounded-full bg-white/20 p-2">
							<Trophy className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(255,255,200,0.8)]" />
						</div>
						<div>
							<h1 className="text-3xl font-extrabold text-white">Game Over!</h1>
						</div>
					</div>

				</header>

				<main className="rounded-[2.6rem] bg-white p-6 shadow-[0_20px_70px_rgba(15,138,97,0.18)]">
					<div className="flex items-center justify-between">
						<div className="rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold">Rankings</div>
						<div className="flex items-center gap-2 bg-slate-50 rounded-full p-1">
							<button onClick={() => setTab('rankings')} className={`px-4 py-2 rounded-full text-sm ${tab === 'rankings' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>Rankings</button>
							<button onClick={() => setTab('review')} className={`px-4 py-2 rounded-full text-sm ${tab === 'review' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>Review</button>
						</div>
					</div>

					{tab === 'rankings' && (
						<div className="mt-6 space-y-4">
							{entries.map((e, i) => (
								<div
									key={i}
									className={`flex items-center justify-between rounded-xl border p-4 ${
										i === 0
											? 'border-yellow-200 bg-yellow-200' // keep
											: i === 1
												? 'border-slate-200 bg-slate-200' // keep
												: i === 2
													? 'border-amber-200 bg-amber-100'// keep
													: 'border-slate-300 bg-white'// keep
									}`}
								>
                                    <div className="flex items-center gap-4">
                                        <Avatar name={e.name} rank={i + 1} />
                                        <div>
                                            <div className="text-sm text-slate-500">#{i + 1}</div>
                                            <div className="font-semibold text-slate-900">{e.name}</div>
                                        </div>
                                    </div>

									<div className="text-right">
										<div className="text-lg font-extrabold tabular-nums">{e.score.toLocaleString()}</div>
										<div className="text-xs text-slate-500">PTS</div>
									</div>
								</div>
							))}
						</div>
					)}

									{tab === 'review' && (
										<ReviewSection roomCode={roomCode} />
									)}
				</main>
				<div className="mt-8 flex justify-center">
					<Link to="/" className="rounded-full border border-white/40 bg-white/10 px-8 py-3 text-sm font-semibold text-white/90 hover:bg-white/20">Back to Home</Link>
				</div>
			</div>
		</div>
	)
}

export default LeaderboardPage

// ReviewSection: loads quiz questions and answers from localStorage (common keys)
function ReviewSection({ roomCode }) {
	const [questions, setQuestions] = useState(null)
	const [answersMap, setAnswersMap] = useState({})

	useEffect(() => {
		const fetchQuizQuestions = async () => {
			try {
				const roomResponse = await fetch(`http://localhost:8080/api/rooms/${roomCode}`)
				if (!roomResponse.ok) return
				const roomData = await roomResponse.json()
				const quizId = roomData.quizId
				if (!quizId) return

				const quizResponse = await fetch(`http://localhost:8080/api/quizzes/${quizId}`)
				if (!quizResponse.ok) return
				const quizData = await quizResponse.json()

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

	if (!questions) return <div className="mt-6 p-6">Loading review...</div>

	return (
		<div className="mt-6 space-y-4">
			<h3 className="text-lg font-semibold">Review</h3>
			{questions.map((q, idx) => (
				<div key={q.id ?? idx} className="rounded-xl border border-slate-100 bg-white p-4">
					<div className="mb-2 text-sm text-slate-500">Question {idx + 1}</div>
					<div className="mb-3 font-semibold text-slate-900">{q.text || q.question || q.questionText}</div>

					{Array.isArray(q.choices) && q.choices.length > 0 ? (
						<ul className="space-y-2">
							{q.choices.map((c, i) => {
								const isCorrect = (q.answer && c === q.answer) || (typeof q.correctChoiceIndex === 'number' && i === q.correctChoiceIndex)
								const userAnswer = answersMap[q.id] ?? answersMap[idx]
								const isUser = userAnswer != null && (userAnswer === c || userAnswer === i)
								return (
									<li key={i} className={`rounded-md px-3 py-2 ${isCorrect ? 'bg-emerald-50 border border-emerald-100' : isUser ? 'bg-yellow-50 border border-yellow-100' : 'bg-slate-50'}`}>
										<div className="flex items-center justify-between">
											<div className="text-sm text-slate-800">{c}</div>
											<div className="text-xs text-slate-500">{isCorrect ? 'Correct' : isUser ? 'Your answer' : ''}</div>
										</div>
									</li>
								)
							})}
						</ul>
					) : (
						<div className="text-sm text-slate-700">Answer: <span className="font-semibold">{q.answer || q.correctAnswer || '—'}</span></div>
					)}
				</div>
			))}
		</div>
	)
}