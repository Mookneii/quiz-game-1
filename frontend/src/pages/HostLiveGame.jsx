import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

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

	const totalPlayers = 24
	const answeredCount = 18
	const answeredPercent = Math.round((answeredCount / totalPlayers) * 100)

	const handleConfirmExit = () => {
		setIsExitModalOpen(false)
		navigate('/')
	}

	const handleEndGame = () => {
		navigate('/leaderboard')
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
							{sidebarPlayers.map((player) => (
								<div
									key={player.name}
									className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
								>
									<div className="flex min-w-0 items-center gap-3">
										<img
											src={player.avatar}
											alt={`${player.name} avatar`}
											className="h-10 w-10 rounded-full object-cover"
										/>
										<p className="truncate text-base font-semibold text-slate-900">
											{player.name}
										</p>
									</div>
									<span className="text-sm font-bold text-blue-500">
										{player.score.toLocaleString()}
									</span>
								</div>
							))}
						</div>
						<div className="mt-auto pt-8 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">
							Waiting for question to start
						</div>
					</aside>

					<section className="flex min-h-[620px] flex-col rounded-[34px] bg-linear-to-br from-[#f3f4f6] via-[#eef0ff] to-[#cbd5ff] p-8 shadow-[0_18px_42px_rgba(0,0,0,0.14)] lg:p-10">
						<div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-200/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-600 shadow-sm">
							<span className="h-2 w-2 rounded-full bg-violet-500" />
							Question 2 of 10
						</div>

						<div className="mt-12 max-w-4xl">
							<h1 className="max-w-4xl text-[clamp(2.8rem,5.6vw,5.5rem)] font-black leading-[0.98] tracking-tight text-slate-900">
								Which planet is known as the
								<span className="block text-emerald-500">Red Planet?</span>
							</h1>
						</div>

						<div className="mt-auto flex items-end justify-between gap-4 pb-5 pt-10">
							<div className="max-w-2xl flex-1">
								<div className="mb-3 text-lg font-semibold text-white/70">
									18 <span className="text-white/45">/24 players answered</span>
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
