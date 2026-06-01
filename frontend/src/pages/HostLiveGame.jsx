import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createStompClient } from '../api/websocket'

const createAvatar = (name, from, to) => {
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
					<stop offset="0%" stop-color="${from}" />
					<stop offset="100%" stop-color="${to}" />
				</linearGradient>
			</defs>
			<rect width="96" height="96" rx="48" fill="url(#g)" />
			<circle cx="48" cy="38" r="18" fill="rgba(255,255,255,0.92)" />
			<path d="M22 84c5-15 16-23 26-23s21 8 26 23" fill="rgba(255,255,255,0.92)" />
			<text x="48" y="56" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${initials}</text>
		</svg>
	`.trim()

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const sidebarPlayers = [
	{ name: 'Alex', score: 1250, avatar: createAvatar('Alex', '#667eea', '#764ba2') },
	{ name: 'Jordan', score: 1100, avatar: createAvatar('Jordan', '#cc2b5e', '#753a88') },
	{ name: 'Taylor', score: 950, avatar: createAvatar('Taylor', '#2193b0', '#6dd5ed') },
	{ name: 'Sam', score: 880, avatar: createAvatar('Sam', '#1d976c', '#93f9b9') },
	{ name: 'Morgan', score: 720, avatar: createAvatar('Morgan', '#f12711', '#f5af19') },
]

function HostLiveGame() {
	const navigate = useNavigate()
	const location = useLocation()
	const params = useParams()
	const [isExitModalOpen, setIsExitModalOpen] = useState(false)

	const gamePin = useMemo(() => {
		const locationState = location.state || {}
		return params.pin || locationState.pin || locationState.roomCode || '482910'
	}, [location.state, params.pin])

	const [players, setPlayers] = useState([])
	const [currentQuestion, setCurrentQuestion] = useState(null)
	const [questionIndex, setQuestionIndex] = useState(0)
	const [totalQuestions, setTotalQuestions] = useState(0)
	const [answeredPlayers, setAnsweredPlayers] = useState([])

	const totalPlayers = players.length
	const answeredCount = answeredPlayers.length
	const answeredPercent = totalPlayers > 0 ? Math.round((answeredCount / totalPlayers) * 100) : 0

	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				const response = await fetch(`http://localhost:8080/api/rooms/${gamePin}`)
				if (response.ok) {
					const data = await response.json()
					setPlayers(data.players || [])
				}
			} catch (err) {
				console.error("Error fetching room details:", err)
			}
		}
		fetchInitialData()

		const client = createStompClient()
		client.onConnect = () => {
			client.subscribe(`/topic/room/${gamePin}`, (message) => {
				const event = JSON.parse(message.body)
				console.log("Host WebSocket event received:", event)

				if (event.type === 'QUESTION_STARTED') {
					setCurrentQuestion(event.payload.questionDTO)
					setQuestionIndex(event.payload.questionIndex)
					setTotalQuestions(event.payload.totalQuestions)
					setAnsweredPlayers([])
				} else if (event.type === 'ANSWER_RESULT') {
					const result = event.payload
					setAnsweredPlayers((prev) => {
						if (prev.includes(result.playerId)) return prev
						return [...prev, result.playerId]
					})
				} else if (event.type === 'LEADERBOARD_UPDATE') {
					setPlayers(event.payload || [])
				} else if (event.type === 'GAME_FINISHED') {
					navigate(`/leaderboard`, { state: { pin: gamePin } })
				}
			})

			// Trigger the first question on startup after a brief delay to allow player subscriptions
			setTimeout(() => {
				fetch(`http://localhost:8080/api/games/next`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ roomCode: gamePin, questionIndex: 0 }),
				}).catch(err => console.error("Error triggering first question:", err))
			}, 1500)
		}
		client.activate()

		return () => {
			client.deactivate()
		}
	}, [gamePin, navigate])

	const handleConfirmExit = () => {
		setIsExitModalOpen(false)
		navigate('/')
	}

	const handleNextQuestion = async () => {
		try {
			const nextIdx = questionIndex + 1
			if (nextIdx >= totalQuestions) {
				handleEndGame()
				return
			}
			const response = await fetch(`http://localhost:8080/api/games/next`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomCode: gamePin, questionIndex: nextIdx }),
			})
			if (!response.ok) {
				throw new Error("Failed to load next question")
			}
		} catch (err) {
			alert("Error loading next question: " + err.message)
		}
	}

	const handleEndGame = async () => {
		try {
			const response = await fetch(`http://localhost:8080/api/games/end`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomCode: gamePin }),
			})
			if (!response.ok) {
				throw new Error("Failed to end game")
			}
			navigate(`/leaderboard`, { state: { pin: gamePin } })
		} catch (err) {
			alert("Error ending game: " + err.message)
		}
	}

	return (
		<div className="min-h-screen bg-[#22c55e] text-slate-900">
			<div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
				<header className="grid grid-cols-3 items-center gap-4">
					<button
						type="button"
						onClick={() => setIsExitModalOpen(true)}
						className="inline-flex w-fit items-center gap-3 rounded-full bg-white/15 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm transition hover:bg-white/20"
					>
						<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg leading-none">
							←
						</span>
						Exit Game
					</button>

					<div className="flex flex-col items-center justify-center text-center">
						<span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80">
							Game PIN
						</span>
						<div className="rounded-2xl bg-white/18 px-8 py-3 text-3xl font-black tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
							{gamePin}
						</div>
					</div>

					<div className="flex justify-end">
						<div className="flex items-center gap-4 rounded-full bg-white/15 px-4 py-2 text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
							<div className="flex -space-x-2">
								{sidebarPlayers.slice(0, 3).map((player) => (
									<img
										key={player.name}
										src={player.avatar}
										alt={`${player.name} avatar`}
										className="h-8 w-8 rounded-full border-2 border-white object-cover"
									/>
								))}
							</div>
							<div className="flex items-center gap-2 text-sm font-semibold">
								<span className="inline-block h-2.5 w-2.5 rounded-full bg-white/90" />
								{totalPlayers} Players
							</div>
						</div>
					</div>
				</header>

				<main className="mt-4 grid flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-5">
					<aside className="flex flex-col rounded-[28px] bg-[#f3f4f6] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
						<div className="mb-4 flex items-center justify-between px-2 pt-1">
							<div className="flex items-center gap-2">
								<span className="text-xl">📊</span>
								<h2 className="text-2xl font-black text-slate-900">Players</h2>
							</div>
							<span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
								Live
							</span>
						</div>

						<div className="space-y-3">
							{players.map((player) => (
								<div
									key={player.id}
									className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
								>
									<div className="flex min-w-0 items-center gap-3">
										<img
											src={createAvatar(player.nickname || player.name || 'User', '#667eea', '#764ba2')}
											alt={`${player.nickname || player.name} avatar`}
											className="h-10 w-10 rounded-full object-cover"
										/>
										<p className="truncate text-base font-semibold text-slate-900">
											{player.nickname || player.name}
										</p>
									</div>
									<span className="text-sm font-bold text-blue-500">
										{(player.score || 0).toLocaleString()}
									</span>
								</div>
							))}
						</div>
						<div className="mt-auto pt-8 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">
							Waiting for question to start
						</div>
					</aside>

					<section className="flex min-h-[620px] flex-col rounded-[34px] bg-linear-to-br from-[#f3f4f6] via-[#eef0ff] to-[#cbd5ff] p-8 shadow-[0_18px_42px_rgba(0,0,0,0.14)] lg:p-10">
						{currentQuestion ? (
							<>
								<div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-200/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-600 shadow-sm">
									<span className="h-2 w-2 rounded-full bg-violet-500" />
									Question {questionIndex + 1} of {totalQuestions}
								</div>

								<div className="mt-12 max-w-4xl flex-1">
									<h1 className="max-w-4xl text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight text-slate-900">
										{currentQuestion.questionText}
									</h1>

									<div className="mt-8 grid grid-cols-2 gap-4">
										{currentQuestion.choices?.map((choice, idx) => (
											<div
												key={choice.id || idx}
												className="bg-white border rounded-2xl p-5 font-bold text-slate-700 text-lg shadow-sm flex items-center gap-3"
											>
												<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-extrabold">
													{String.fromCharCode(65 + idx)}
												</span>
												{choice.choiceText}
											</div>
										))}
									</div>
								</div>

								<div className="mt-auto flex items-end justify-between gap-4 pb-5 pt-10">
									<div className="max-w-2xl flex-1">
										<div className="mb-3 text-lg font-semibold text-slate-600">
											{answeredCount} <span className="text-slate-400">/{totalPlayers} players answered</span>
										</div>
										<div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
											<div
												className="h-full rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500"
												style={{ width: `${answeredPercent}%` }}
											/>
										</div>
									</div>
									<div className="pb-1 text-lg font-black text-blue-600">
										{answeredPercent}%
									</div>
								</div>
							</>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center text-center">
								<span className="text-6xl animate-bounce">⚡</span>
								<h2 className="text-3xl font-black text-slate-700 mt-5">
									Preparing first question...
								</h2>
							</div>
						)}

						<div className="mt-8 flex items-center justify-between gap-4">
							<button
								type="button"
								className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-2xl font-black text-slate-500 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
								aria-label="Settings"
							>
								⚙
							</button>

							<div className="ml-auto flex items-center gap-4">
								<button
									type="button"
									onClick={handleEndGame}
									className="inline-flex h-14 min-w-36 items-center justify-center rounded-2xl border-2 border-red-400 bg-white px-8 text-sm font-extrabold uppercase tracking-[0.2em] text-red-500 shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition hover:bg-red-50"
								>
									End
								</button>

								<button
									type="button"
									onClick={handleNextQuestion}
									className="inline-flex h-14 min-w-52 items-center justify-center rounded-2xl bg-blue-500 px-8 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition hover:bg-blue-600"
								>
									Next Question &gt;
								</button>
							</div>
						</div>
					</section>
				</main>
			</div>

			{isExitModalOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
						<h2 className="text-2xl font-black text-slate-900">
							End the game for everyone?
						</h2>
						<p className="mt-3 text-sm leading-6 text-slate-500">
							Are you sure you want to end the game for everyone? This will take all players back to the lobby flow.
						</p>

						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={() => setIsExitModalOpen(false)}
								className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleConfirmExit}
								className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
							>
								Confirm Exit
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	)
}

export default HostLiveGame
