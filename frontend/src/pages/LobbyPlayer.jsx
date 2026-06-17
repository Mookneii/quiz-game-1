import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { createStompClient } from '../api/websocket'
import { getRoomDetails } from '../api/room'

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
			<circle cx="48" cy="38" r="18" fill="rgba(255,255,255,0.9)" />
			<path d="M22 84c5-15 16-23 26-23s21 8 26 23" fill="rgba(255,255,255,0.9)" />
			<text x="48" y="56" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${initials}</text>
		</svg>
	`.trim()

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}


// Main component for the player's waiting lobby.
// Shows all joined players in real time and waits for the host to start the game.
// Automatically navigates to the game screen when a QUESTION_STARTED event is received.
function LobbyPlayer() {
	const navigate = useNavigate()
	const location = useLocation()
	const params = useParams()
	const locationState = location.state || {}

	// True once the host has started the game (updates the button text and disables it)
	const [gameStarted, setGameStarted] = useState(false)

	// hostId is forwarded by JoinGame/LobbyHost so we can filter the host out
	// of the player list even if the server record doesn't carry `host: true`.
	const hostId = locationState.hostId || null

	// Resolve the game PIN from URL params or navigation state (fallback: '123456')
	const gamePin =
		params.pin ||
		locationState.pin ||
		locationState.roomCode ||
		'123456'

	// Real numeric player ID from the join API response
	const realPlayerId = locationState.playerId ?? null

	// Build the current player's info from navigation state
	const currentUser = {
		id: realPlayerId ?? 'current-user',
		name: locationState.nickname || 'Berk',
		avatar: createAvatar(
			locationState.nickname || 'Berk',
			'#2dd4bf',
			'#14b8a6'
		),
	}

	// Live list of all players currently in the room (updated via REST + WebSocket)
	const [players, setPlayers] = useState([])

	// On mount: fetches the initial player list from the REST API.
	// Runs once when the game PIN becomes available.
	useEffect(() => {
		if (gamePin) {
			getRoomDetails(gamePin)
				.then((res) => {
					if (res.data?.players) {
						// Populate the player list with the current room members
						setPlayers(res.data.players)
					}
				})
				.catch((err) => console.error("Failed to load players", err))
		}
	}, [gamePin])

	// On mount: opens a WebSocket connection and subscribes to the room topic
	// to receive real-time events:
	//   - PLAYER_JOINED  → update the player list
	//   - GAME_STARTED   → update the button state
	//   - QUESTION_STARTED → navigate to the game screen with the first question
	// Cleans up the WebSocket on unmount.
	useEffect(() => {
		if (!gamePin) {
			return undefined
		}

		// Create and connect the STOMP WebSocket client
		const client = createStompClient()

		client.onConnect = () => {
			// Subscribe to all events broadcast to this room
			client.subscribe(`/topic/room/${gamePin}`, (message) => {
				try {
					const event = JSON.parse(message.body)
					const payload = event.data ?? event.payload ?? {}

					if (event.type === 'PLAYER_JOINED') {
						// A new player joined — replace the list with the server's updated array
						if (payload.players) {
							setPlayers(payload.players)
						}
					}

					if (event.type === 'GAME_STARTED') {
						// Host clicked Start — update the button to show "Preparing first question..."
						setGameStarted(true)
					}

					if (event.type === 'QUESTION_STARTED') {
						// First question is live — navigate to the game screen immediately
						navigate('/game', {
							replace: true,
							state: {
								pin: gamePin,
								playerId: currentUser.id,
								nickname: currentUser.name,
								question: payload.question || payload.questionDTO || null,
								questionIndex: payload.questionIndex ?? null,
								totalQuestions: payload.totalQuestions ?? null,
							},
						})
					}
				} catch (error) {
					// Ignore malformed events and keep the lobby usable.
				}
			})
		}

		client.activate()

		// Disconnect WebSocket when the component unmounts
		return () => {
			client.deactivate()
		}
	}, [currentUser.id, currentUser.name, gamePin, navigate])

	return (
		<div className="min-h-screen bg-white text-slate-900">
			<div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-4 sm:px-8 lg:px-10">
				{/* Top header: QuizUp logo on the left, Game PIN badge on the right */}
				<header className="flex items-center justify-between gap-4">
					<Link to="/" className="flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white shadow-sm shadow-emerald-200">
							Q
						</div>
						<span className="text-2xl font-extrabold tracking-tight text-emerald-500">
							QuizUp
						</span>
					</Link>

					{/* Displays the game PIN so the player knows they're in the right room */}
					<div className="rounded-full bg-linear-to-r from-violet-100 to-fuchsia-100 px-5 py-2 text-sm font-semibold text-emerald-500 shadow-sm shadow-slate-200">
						Game PIN: {gamePin}
					</div>
				</header>

				<main className="flex flex-1 flex-col justify-center pb-24 pt-10">
					<div className="max-w-5xl">
						<h1 className="text-[clamp(2.75rem,5vw,4.25rem)] font-extrabold tracking-tight text-slate-900">
							You're in!
						</h1>

						<p className="mt-3 text-lg text-slate-500">
							Waiting for the host to start the game...
						</p>
					</div>

					<div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
						{/* Player list section — shows all joined players, excluding the host */}
						<section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
							<div className="flex items-center justify-between px-2 pb-5 pt-1">
								<h2 className="text-2xl font-bold text-slate-900">Players</h2>
								{/* Badge showing the number of non-host players in the lobby */}
								<span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-emerald-500">
									{players.filter(p => !p.host && p.id !== hostId).length} joined
								</span>
							</div>

							<div className="space-y-3">
								{/* Render a card for each non-host player; highlight the current user */}
								{players.filter(p => !p.host && p.id !== hostId).map((player) => {
									const isCurrentUser = player.id === currentUser.id

									return (
										<div
											key={player.id}
											className={`flex items-center justify-between rounded-2xl px-4 py-3 transition ${
												isCurrentUser
													? 'border border-violet-200 bg-violet-50/70 shadow-[0_8px_20px_rgba(168,85,247,0.08)]'
													: 'border border-transparent bg-slate-50/80'
											}`}
										>
											<div className="flex min-w-0 items-center gap-4">
												<img
													src={createAvatar(player.nickname || player.name || 'User', '#ff7a59', '#ff4d8d')}
													alt={`${player.nickname || player.name} avatar`}
													className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
												/>

												<div className="min-w-0">
													<p className="truncate text-base font-semibold text-slate-800">
														{player.nickname || player.name}
													</p>
												</div>
											</div>

											{/* "You" badge shown next to the current user's entry */}
											{isCurrentUser ? (
												<span className="ml-4 shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
													You
												</span>
											) : null}
										</div>
									)
								})}
							</div>
						</section>

						{/* Right sidebar: decorative "Getting Ready" card and a status button */}
						<aside className="flex flex-col items-center">
							<div className="w-full overflow-hidden rounded-[22px] bg-linear-to-b from-[#d98cff] via-[#bf7bff] to-[#9448ef] shadow-[0_18px_36px_rgba(138,75,255,0.18)]">
								{/* Decorative illustration area (piano-key shapes) */}
								<div className="relative h-73 overflow-hidden">
									<div className="absolute left-1/2 top-10 h-36 w-56 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
									<div className="absolute left-1/2 top-16 grid -translate-x-1/2 grid-cols-5 gap-2.5">
										{Array.from({ length: 10 }).map((_, index) => (
											<div key={index} className="flex flex-col items-center">
												<div className="h-10 w-5 rounded-t-md rounded-b-sm bg-white/80 shadow-[0_6px_0_rgba(96,57,175,0.45)]" />
												<div className="h-4 w-7 rounded-b-md bg-white/70 shadow-[0_8px_0_rgba(96,57,175,0.25)]" />
											</div>
										))}
									</div>
									<div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#8f42ee]/70 to-transparent" />
									<div className="absolute inset-x-0 bottom-8 mx-auto h-2 w-44 rounded-full bg-white/10 blur-sm" />
								</div>

								{/* Status text below the illustration */}
								<div className="bg-[#f7efff] px-4 py-5 text-center">
									<p className="text-lg font-bold text-emerald-500">
										Getting Ready
									</p>
									<p className="mt-2 text-sm text-emerald-500/80">
										Players are joining the lobby
									</p>
								</div>
							</div>

							{/* Status button — disabled for the player; text changes when the game starts */}
							<button
								type="button"
								disabled={gameStarted}
								className="mt-8 inline-flex w-44 items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(16,185,129,0.28)]"
							>
								{gameStarted ? 'Preparing first question...' : 'Waiting for the host...'}
							</button>
						</aside>
					</div>
				</main>

				{/* Fixed footer tip and status label */}
				<footer className="fixed inset-x-0 bottom-5 px-5 sm:px-8 lg:px-10">
					<div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
						<div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm font-medium text-amber-700 shadow-sm backdrop-blur">
							<span className="mr-2">💡</span>
							Tip: Get ready! The game is about to begin.
						</div>

						<div className="rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.14)]">
							Waiting for host...
						</div>
					</div>
				</footer>
			</div>
		</div>
	)
}

export default LobbyPlayer
