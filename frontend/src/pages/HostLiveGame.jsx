import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api/http'
import { createStompClient } from '../api/websocket'

// Creates a circular SVG avatar image using the player's initials and a gradient color.
// 'name' is used to extract initials; 'from' and 'to' are the gradient start/end colors.
// Returns a data URL string that can be used directly as an <img> src.
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

// removed sidebarPlayers array

// Main component that renders the host's live game screen.
// Handles real-time updates via WebSocket, shows the current question,
// tracks how many players have answered, and lets the host advance or end the game.
function HostLiveGame() {
	const navigate = useNavigate()
	const location = useLocation()
	const params = useParams()

	// Controls whether the "Exit Game" confirmation modal is visible
	const [isExitModalOpen, setIsExitModalOpen] = useState(false)

	// Tracks WebSocket connection state: 'connecting' | 'connected' | 'disconnected'
	const [connectionStatus, setConnectionStatus] = useState('connecting')

	// The current question object received from the server via WebSocket
	const [liveQuestion, setLiveQuestion] = useState(null)

	// Index (0-based) of the current live question
	const [liveQuestionIndex, setLiveQuestionIndex] = useState(null)

	// Total number of questions in the quiz
	const [liveTotalQuestions, setLiveTotalQuestions] = useState(null)

	// True while waiting for the server to respond to a "next question" request
	const [nextQuestionLoading, setNextQuestionLoading] = useState(false)

	// Resolves the game PIN from URL params or navigation state
	const gamePin = (() => {
		const locationState = location.state || {}
		return params.pin || locationState.pin || locationState.roomCode || '482910'
	})()

	// List of all players currently in the room (including host)
	const [players, setPlayers] = useState([])

	// The question currently being displayed
	const [currentQuestion, setCurrentQuestion] = useState(null)

	// 0-based index of the question currently being displayed
	const [questionIndex, setQuestionIndex] = useState(0)

	// Total number of questions (used for progress display)
	const [totalQuestions, setTotalQuestions] = useState(0)

	// Array of player IDs who have already submitted an answer for the current question
	const [answeredPlayers, setAnsweredPlayers] = useState([])

	// Ref flag to ensure the first question is only requested once after connecting
	const firstQuestionRequestedRef = useRef(false)

	// Error message shown when a question cannot be loaded
	const [questionError, setQuestionError] = useState('')

	// Derived values for the answer progress bar
	const totalPlayers = players.filter(p => !p.host).length
	const answeredCount = answeredPlayers.length
	const answeredPercent = totalPlayers > 0 ? Math.round((answeredCount / totalPlayers) * 100) : 0

	// True when the host is on the final question (hides the "Next Question" button)
	const isLastQuestion = questionIndex != null && totalQuestions != null && questionIndex + 1 >= totalQuestions

	// Percentage of questions completed (used for the top progress bar)
	const progressPercent = totalQuestions > 0 ? Math.round(((questionIndex + 1) / totalQuestions) * 100) : 0

	// On mount: fetches room/quiz data, opens a WebSocket connection,
	// subscribes to room events, and automatically requests the first question.
	// Cleans up the WebSocket connection when the component unmounts.
	useEffect(() => {
		let cancelled = false
		let client

		// Fetches room details and quiz validation, then sets up the WebSocket subscription
		const initializeRoom = async () => {
			try {
				const response = await fetch(`http://${window.location.hostname}:8080/api/rooms/${gamePin}`)
				if (!response.ok) {
					return
				}

				const data = await response.json()
				if (cancelled) {
					return
				}

				// Populate the player sidebar with everyone currently in the room
				setPlayers(data.players || [])

				// Validate that the linked quiz actually has questions before connecting
				if (data.quizId) {
					const quizResponse = await fetch(
						`http://${window.location.hostname}:8080/api/quizzes/${data.quizId}`
					)
					if (quizResponse.ok) {
						const quizData = await quizResponse.json()
						if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
							if (!cancelled) {
								setQuestionError('This quiz has no questions yet. Add at least one question before hosting.')
							}
							return
						}
					}
				}

				// Create and connect the STOMP WebSocket client
				client = createStompClient()
				client.onConnect = () => {
					setConnectionStatus('connected')

					// Subscribe to the room's topic to receive live game events
					client.subscribe(`/topic/room/${gamePin}`, (message) => {
						let event
						try {
							event = JSON.parse(message.body)
						} catch (error) {
							// Ignore messages that can't be parsed
							return
						}
						console.log('Host WebSocket event received:', event)
						const payload = event.data ?? event.payload ?? {}

						if (event.type === 'QUESTION_STARTED') {
							// A new question has started — update the displayed question and reset answered list
							setCurrentQuestion(payload.question || payload.questionDTO || null)
							setQuestionIndex(payload.questionIndex ?? 0)
							setTotalQuestions(payload.totalQuestions ?? 0)
							setAnsweredPlayers([])
						} else if (event.type === 'ANSWER_RESULT') {
							// A player submitted an answer — add them to the answered list (no duplicates)
							const result = payload
							setAnsweredPlayers((prev) => {
								if (prev.includes(result.playerId)) return prev
								return [...prev, result.playerId]
							})
						} else if (event.type === 'LEADERBOARD_UPDATE') {
							// Scores have been updated — refresh the player list with new scores
							setPlayers(payload || [])
						} else if (event.type === 'GAME_FINISHED') {
							// The game is over — navigate to the leaderboard
							navigate(`/leaderboard`, { state: { pin: gamePin } })
						}
					})

					// Request the first question only once after connecting
					if (!firstQuestionRequestedRef.current) {
						firstQuestionRequestedRef.current = true
						api.post('/api/games/next', {
							roomCode: gamePin,
							questionIndex: 0,
						}).catch((error) => {
							setQuestionError(
								error?.response?.data?.message ||
								'Unable to load the first question for this quiz.'
							)
							firstQuestionRequestedRef.current = false
						})
					}
				}

				// Mark connection as lost if the WebSocket closes unexpectedly
				client.onWebSocketClose = () => {
					setConnectionStatus('disconnected')
				}
				client.activate()
			} catch (err) {
				console.error('Error fetching room details:', err)
			}
		}

		initializeRoom()

		// Cleanup: mark as cancelled and disconnect WebSocket on unmount
		return () => {
			cancelled = true
			client?.deactivate()
		}
	}, [gamePin, navigate])

	// Called when the host confirms they want to exit mid-game.
	// Sends an end-game request to the server and redirects to the host dashboard.
	const handleConfirmExit = async () => {
		setIsExitModalOpen(false)
		try {
			await api.post('/api/games/end', { roomCode: gamePin })
		} catch (error) {
			console.error('Failed to end game', error)
		}
		navigate('/host')
	}

	// Called when the host clicks the "End" button during the game.
	// Ends the game on the server and redirects to the leaderboard.
	const handleEndGame = async () => {
		try {
			await api.post('/api/games/end', { roomCode: gamePin })
		} catch (error) {
			console.error('Failed to end game', error)
		}
		navigate('/leaderboard', { state: { pin: gamePin } })
	}

	// Called when the host clicks "Next Question".
	// Posts the next question index to the server so all players receive the new question.
	const handleNextQuestion = async () => {
		if (questionIndex == null) {
			return
		}

		try {
			setNextQuestionLoading(true)
			await api.post('/api/games/next', {
				roomCode: gamePin,
				questionIndex: questionIndex + 1,
			})
		} catch (error) {
			// Leave the current question visible when advancing fails.
		} finally {
			setNextQuestionLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-[#22c55e] text-slate-900">
			<div className="mx-auto flex min-h-screen max-w-400 flex-col px-4 py-4 sm:px-6 lg:px-8">
				<header className="grid grid-cols-3 items-center gap-4">
					{/* Exit Game button — opens the confirmation modal */}
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

					{/* Center: displays the Game PIN so the host can share it */}
					<div className="flex flex-col items-center justify-center text-center">
						<span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80">
							Game PIN
						</span>
						<div className="rounded-2xl bg-white/18 px-8 py-3 text-3xl font-black tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
							{gamePin}
						</div>
					</div>

					{/* Right: shows avatars of up to 3 players and the total player count */}
					<div className="flex justify-end">
						<div className="flex items-center gap-4 rounded-full bg-white/15 px-4 py-2 text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
							<div className="flex -space-x-2">
								{players.filter(p => !p.host).slice(0, 3).map((player) => (
									<img
										key={player.nickname || player.name || player.id}
										src={createAvatar(player.nickname || player.name || 'User', '#667eea', '#764ba2')}
										alt={`${player.nickname || player.name} avatar`}
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
					{/* Left sidebar: scrollable list of all players and their current scores */}
					<aside className="flex flex-col rounded-[28px] bg-[#f3f4f6] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
						<div className="mb-4 flex items-center justify-between px-2 pt-1">
							<div className="flex items-center gap-2">
								<span className="text-xl">📊</span>
								<h2 className="text-2xl font-black text-slate-900">Players</h2>
							</div>
							{/* Shows "Live" when the WebSocket is connected, otherwise "Connecting" */}
							<span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
								{connectionStatus === 'connected' ? 'Live' : 'Connecting'}
							</span>
						</div>

						<div className="space-y-3">
							{players.filter(p => !p.host).map((player) => (
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
									{/* Player's current score */}
									<span className="text-sm font-bold text-blue-500">
										{(player.score || 0).toLocaleString()}
									</span>
								</div>
							))}
						</div>
						<div className="mt-auto pt-8 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
							{currentQuestion ? 'Question in progress' : 'Waiting for question to start'}
						</div>
					</aside>

					{/* Main panel: displays the current question text, answer choices,
					    a progress bar for how many players answered, and the Next/End buttons */}
					<section className="flex min-h-155 flex-col rounded-[34px] bg-linear-to-br from-[#f3f4f6] via-[#eef0ff] to-[#cbd5ff] p-8 shadow-[0_18px_42px_rgba(0,0,0,0.14)] lg:p-10">
						<div className="flex flex-col gap-2">
							{/* Badge showing question number and connection status dot */}
							<div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-200/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-600 shadow-sm">
								<span
									className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-violet-500'}`}
								/>
								{currentQuestion && questionIndex != null && totalQuestions != null
									? `Question ${questionIndex + 1} of ${totalQuestions}`
									: 'Preparing first question...'}
							</div>

							{/* Question Progress Bar — shows how far through the quiz the host is */}
							{totalQuestions > 0 && (
								<div className="h-1.5 w-64 overflow-hidden rounded-full bg-slate-200">
									<div
										className="h-full rounded-full bg-emerald-500 transition-all duration-500"
										style={{ width: `${progressPercent}%` }}
									/>
								</div>
							)}
						</div>

						{/* Question text area — shows error, question text, or a loading placeholder */}
						<div className="mt-12 max-w-4xl">
							<h1 className="max-w-4xl text-[clamp(2.8rem,5.6vw,5.5rem)] font-black leading-[0.98] tracking-tight text-slate-900">
								{questionError ? questionError : currentQuestion ? currentQuestion.questionText : 'Preparing first question...'}
							</h1>
						</div>

						{questionError ? (
							// Error state: quiz has no questions or question failed to load
							<div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-8 text-lg font-semibold text-amber-800 shadow-sm">
								{questionError}
							</div>
						) : currentQuestion ? (
							// Active question: renders the answer choices as read-only cards
							<div className="mt-8 grid gap-4 sm:grid-cols-2">
								{currentQuestion.choices?.map((choice, index) => (
									<div
										key={choice.id ?? choice.choiceText ?? index}
										className="rounded-3xl border border-white/70 bg-white/70 px-5 py-4 text-xl font-bold text-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
									>
										{choice.choiceText}
									</div>
								))}
							</div>
						) : (
							// Loading state: waiting for the first question to arrive
							<div className="mt-8 rounded-[28px] border border-white/60 bg-white/40 px-6 py-8 text-lg font-semibold text-slate-700 shadow-sm backdrop-blur">
								{nextQuestionLoading ? 'Requesting the first question...' : 'Waiting for the host-triggered question...'}
							</div>
						)}

						{/* Bottom row: answer progress bar on the left, Next/End buttons on the right */}
						<div className="mt-auto flex items-end justify-between gap-4 pb-5 pt-10">
							{/* Progress bar showing how many players have answered */}
							<div className="max-w-2xl flex-1">
								<div className="mb-3 text-lg font-semibold text-slate-800">
									{answeredCount} <span className="text-slate-600">/{totalPlayers} players answered</span>
								</div>
								<div className="h-3 w-full overflow-hidden rounded-full bg-white/35 shadow-inner">
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

						<div className="mt-8 flex items-center justify-between gap-4">
							{/* Settings button (placeholder — not yet wired up) */}
							<button
								type="button"
								className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-2xl font-black text-slate-500 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
								aria-label="Settings"
							>
								⚙
							</button>

							<div className="ml-auto flex items-center gap-4">
								{/* End button: ends the game immediately and goes to the leaderboard */}
								<button
									type="button"
									onClick={handleEndGame}
									className="inline-flex h-14 min-w-36 items-center justify-center rounded-2xl border-2 border-red-400 bg-white px-8 text-sm font-extrabold uppercase tracking-[0.2em] text-red-500 shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition hover:bg-red-50"
								>
									End
								</button>

								{/* Next Question button — hidden when the host is on the last question */}
								{!isLastQuestion && (
									<button
										type="button"
										onClick={handleNextQuestion}
										disabled={!currentQuestion || nextQuestionLoading}
										className="inline-flex h-14 min-w-52 items-center justify-center rounded-2xl bg-blue-500 px-8 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
									>
										{nextQuestionLoading ? 'Loading...' : 'Next Question >'}
									</button>
								)}
							</div>
						</div>
					</section>
				</main>
			</div>

			{/* Exit confirmation modal — asks the host to confirm before ending the game for everyone */}
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
							{/* Cancel — closes the modal without doing anything */}
							<button
								type="button"
								onClick={() => setIsExitModalOpen(false)}
								className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
							>
								Cancel
							</button>
							{/* Confirm Exit — calls handleConfirmExit to end the game and redirect */}
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
