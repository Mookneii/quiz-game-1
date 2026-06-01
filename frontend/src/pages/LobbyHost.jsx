import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

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

const mockPlayers = [
	{
		id: 'beun',
		name: 'Beun',
		avatar: createAvatar('Beun', '#ff7a59', '#ff4d8d'),
	},
	{
		id: 'plorkjork',
		name: 'PlorkJork',
		avatar: createAvatar('PlorkJork', '#46c2ff', '#7c4dff'),
	},
	{
		id: 'jobkok',
		name: 'JobKok',
		avatar: createAvatar('JobKok', '#9ca3af', '#475569'),
	},
	{
		id: 'jbarber',
		name: 'JBarber',
		avatar: createAvatar('JBarber', '#f59e0b', '#f97316'),
	},
	{
		id: 'goodboy',
		name: 'GoodBoy',
		avatar: createAvatar('GoodBoy', '#f8b4d9', '#8b5cf6'),
	},
]

function LobbyHost() {
	const navigate = useNavigate()
	const location = useLocation()
	const params = useParams()
	const locationState = location.state || {}

	const gamePin =
		params.pin ||
		locationState.pin ||
		locationState.roomCode ||
		'123456'

	const currentUser = {
		id: locationState.hostId || 'host-user',
		name: locationState.hostName || 'Berk',
		avatar: createAvatar(
			locationState.hostName || 'Berk',
			'#2dd4bf',
			'#14b8a6'
		),
	}

	const [players, setPlayers] = useState(mockPlayers)

	useEffect(() => {
		setPlayers((previousPlayers) => {
			const alreadyJoined = previousPlayers.some(
				(player) => player.id === currentUser.id
			)

			return alreadyJoined
				? previousPlayers
				: [currentUser, ...previousPlayers]
		})
	}, [currentUser.id])

	return (
		<div className="min-h-screen bg-white text-slate-900">
			<div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-4 sm:px-8 lg:px-10">
				<header className="flex items-center justify-between gap-4">
					<Link to="/" className="flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white shadow-sm shadow-emerald-200">
							Q
						</div>
						<span className="text-2xl font-extrabold tracking-tight text-emerald-500">
							QuizUp
						</span>
					</Link>

					<div className="rounded-full bg-linear-to-r from-violet-100 to-fuchsia-100 px-5 py-2 text-sm font-semibold text-emerald-500 shadow-sm shadow-slate-200">
						Game PIN: {gamePin}
					</div>
				</header>

				<main className="flex flex-1 flex-col justify-center pb-24 pt-10">
					<div className="max-w-5xl">
						<h1 className="text-[clamp(2.75rem,5vw,4.25rem)] font-extrabold tracking-tight text-slate-900">
							You're the Host!
						</h1>

						<p className="mt-3 text-lg text-slate-500">
							Waiting for players to join...
						</p>
					</div>

					<div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
						<section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
							<div className="flex items-center justify-between px-2 pb-5 pt-1">
								<h2 className="text-2xl font-bold text-slate-900">Players</h2>
								<span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-emerald-500">
									{players.length} joined
								</span>
							</div>

							<div className="space-y-3">
								{players.map((player) => {
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
													src={player.avatar}
													alt={`${player.name} avatar`}
													className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
												/>

												<div className="min-w-0">
													<p className="truncate text-base font-semibold text-slate-800">
														{player.name}
													</p>
												</div>
											</div>

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

						<aside className="flex flex-col items-center">
							<div className="w-full overflow-hidden rounded-[22px] bg-linear-to-b from-[#d98cff] via-[#bf7bff] to-[#9448ef] shadow-[0_18px_36px_rgba(138,75,255,0.18)]">
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

								<div className="bg-[#f7efff] px-4 py-5 text-center">
									<p className="text-lg font-bold text-emerald-500">
										Getting Ready
									</p>
									<p className="mt-2 text-sm text-emerald-500/80">
										Players are joining the lobby
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={() => navigate('/host-live-game')}
								className="mt-8 inline-flex w-44 items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(16,185,129,0.28)]"
							>
								Start
							</button>
						</aside>
					</div>
				</main>

				<footer className="fixed inset-x-0 bottom-5 px-5 sm:px-8 lg:px-10">
					<div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
						<div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm font-medium text-amber-700 shadow-sm backdrop-blur">
							<span className="mr-2">💡</span>
							Tip: Prepare your players! The game is about to begin.
						</div>

						<div className="rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.14)]">
							Waiting for players...
						</div>
					</div>
				</footer>
			</div>
		</div>
	)
}

export default LobbyHost
