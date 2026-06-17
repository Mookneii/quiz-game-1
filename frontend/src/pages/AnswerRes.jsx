// Import the navigation bar component displayed at the top of the page
import Navbar_res from "../components/Navbar_res";

// React hooks for state management and side effects
import React, { useEffect, useState } from 'react';

// React Router hooks for accessing page data and navigation
import { useLocation, useNavigate } from 'react-router-dom';

// Icons used in the result UI
import {
	CheckCircle2,
	Flame,
	Target,
	XCircle,
	Trophy,
	Zap
} from 'lucide-react';

// Function that creates a WebSocket/STOMP client connection
import { createStompClient } from '../api/websocket';


// Local storage keys used to save quiz results between page refreshes
const STORAGE_KEY = 'quiz-answer-result';
const TOTAL_POINTS_KEY = 'quiz-total-points';


// Default result object used when no data is available
const defaultResult = {
	isCorrect: false,
	pointsEarned: 0,
	streak: 0,
	totalPoints: 0,
	currentQuestion: 1,
	totalQuestions: 1,
};

/**
 * Reads previously saved quiz results from localStorage.
 * Returns null if nothing is stored or if parsing fails.
 */
const readStoredResult = () => {
	if (typeof window === 'undefined') {
		return null;
	}

	const storedResult = window.localStorage.getItem(STORAGE_KEY);

	if (!storedResult) {
		return null;
	}

	try {
		return JSON.parse(storedResult);
	} catch {
		return null;
	}
};

const AnswerRes = () => {

	// Access navigation state passed from previous page
	const location = useLocation();

	// Hook used to programmatically navigate to another page
	const navigate = useNavigate();

	// Retrieve state data passed through navigation
	const locationState = location.state || {};

	const gamePin = locationState.pin;
	const playerId = locationState.playerId;
	const nickname = locationState.nickname;

	// Result data received from the server
	const serverResult = locationState.result || {};

	/**
	 * Merge:
	 * 1. Default values
	 * 2. Saved localStorage values
	 * 3. Latest server values
	 *
	 * Server values always take priority.
	 */
	const result = {
		...defaultResult,
		...(readStoredResult() ?? {}),

		isCorrect:
			serverResult.correct ?? defaultResult.isCorrect,

		pointsEarned:
			serverResult.points ?? defaultResult.pointsEarned,

		streak:
			serverResult.streak ?? defaultResult.streak,

		totalPoints:
			serverResult.totalScore ?? defaultResult.totalPoints,

		currentQuestion:
			serverResult.questionIndex !== undefined
				? serverResult.questionIndex + 1
				: defaultResult.currentQuestion,

		totalQuestions:
			serverResult.totalQuestions ?? defaultResult.totalQuestions,
	};

	// Convert result into a true/false value
	const isCorrect = Boolean(result.isCorrect);

	/**
	 * Automatic navigation to next question.
	 *
	 * If nextQuestion data already exists in navigation state,
	 * wait 2 seconds and then redirect to the game page.
	 */
	useEffect(() => {
		if (locationState.nextQuestion) {

			const timer = setTimeout(() => {

				const nextQ = locationState.nextQuestion;

				navigate('/game', {
					replace: true,
					state: {
						pin: gamePin,
						playerId,
						nickname,

						question:
							nextQ.question ||
							nextQ.questionDTO ||
							null,

						questionIndex:
							nextQ.questionIndex ?? null,

						totalQuestions:
							nextQ.totalQuestions ?? null,
					}
				});

			}, 2000);

			// Cleanup timer when component unmounts
			return () => clearTimeout(timer);
		}
	}, [
		locationState.nextQuestion,
		navigate,
		gamePin,
		playerId,
		nickname
	]);

	/**
	 * Establish WebSocket connection.
	 *
	 * This allows the player to receive:
	 * - New questions
	 * - Game finished events
	 */
	useEffect(() => {

		// Don't connect if no game PIN exists
		if (!gamePin) return;

		// Create STOMP client
		const client = createStompClient();

		// Triggered after successful connection
		client.onConnect = () => {

			// Subscribe to room events
			client.subscribe(`/topic/room/${gamePin}`, (message) => {

				try {

					const event = JSON.parse(message.body);

					// Extract payload safely
					const payload =
						event.data ??
						event.payload ??
						{};

					/**
					 * QUESTION_STARTED
					 * Navigate to the next quiz question.
					 */
					if (event.type === 'QUESTION_STARTED') {

						navigate('/game', {
							replace: true,
							state: {
								pin: gamePin,
								playerId,
								nickname,

								question:
									payload.question ||
									payload.questionDTO ||
									null,

								questionIndex:
									payload.questionIndex ?? null,

								totalQuestions:
									payload.totalQuestions ?? null,
							}
						});
					}

					/**
					 * GAME_FINISHED
					 * Redirect to leaderboard page.
					 */
					else if (event.type === 'GAME_FINISHED') {

						navigate('/leaderboard', {
							state: { pin: gamePin }
						});
					}

				} catch (error) {
					console.error(error);
				}
			});
		};

		// Start WebSocket connection
		client.activate();

		// Disconnect when component unmounts
		return () => {
			client.deactivate();
		};

	}, [
		gamePin,
		navigate,
		playerId,
		nickname
	]);

	// Convert values to numbers for safe calculations
	const currentQuestion =
		Number(result.currentQuestion) || 1;

	const totalQuestions =
		Number(result.totalQuestions) || 1;

	const pointsEarned =
		Number(result.pointsEarned) || 0;

	const streak =
		Number(result.streak) || 0;

	const totalPoints =
		Number(result.totalPoints) || 0;

	/**
	 * Calculate quiz progress percentage.
	 * Example:
	 * Question 3 of 10 = 30%
	 */
	const progressPercentage = Math.min(
		100,
		Math.max(
			0,
			(currentQuestion / totalQuestions) * 100
		)
	);

	/**
	 * Save latest result data to localStorage.
	 *
	 * This prevents losing score information if
	 * the user refreshes the browser.
	 */
	useEffect(() => {

		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(result)
		);

		window.localStorage.setItem(
			TOTAL_POINTS_KEY,
			String(totalPoints)
		);

	}, [result, totalPoints]);

	return (
		<div className="min-h-screen bg-slate-50 text-gray-900">

			{/* Navigation bar */}
			<Navbar_res />

			<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">

				{/* Main result card */}
				<div className="w-full rounded-[2rem] bg-linear-to-b from-[#0d6b46] to-[#0f8a61] px-6 py-10 text-center shadow-[0_20px_70px_rgba(15,138,97,0.22)] sm:px-8 lg:px-10">

					{/* Correct/Wrong indicator */}
					<div className="rounded-[2rem] bg-linear-to-b from-[#0d6b46] to-[#0f8a61] px-6 py-10 text-center shadow-[0_20px_70px_rgba(15,138,97,0.22)] sm:px-8 lg:px-10">

						{/* Circular icon container */}
						<div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e8fcef] shadow-[0_0_0_16px_rgba(232,252,239,0.16)]">

							{/* Inner circle changes color depending on answer */}
							<div
								className={`flex h-20 w-20 items-center justify-center rounded-full ${
									isCorrect
										? 'bg-amber-400'
										: 'bg-[#e05a47]'
								}`}
							>

								{/* Show checkmark if correct, X if wrong */}
								{isCorrect ? (
									<CheckCircle2
										className="h-12 w-12 text-white"
										strokeWidth={2.4}
									/>
								) : (
									<XCircle
										className="h-12 w-12 text-white"
										strokeWidth={2.4}
									/>
								)}
							</div>
						</div>

						{/* Result title */}
						<div
							className={`mt-8 text-4xl font-black sm:text-5xl ${
								isCorrect
									? 'text-amber-400'
									: 'text-red-500'
							}`}
						>
							{isCorrect ? 'Correct!' : 'Wrong!'}
						</div>

						{/* Points earned message */}
						<div className="mt-4 text-base font-semibold text-[#dff7e8] sm:text-lg">
							You earned {isCorrect ? '+' : ''}
							{pointsEarned} points
						</div>
					</div>

					{/* Statistics cards */}
					<div className="mt-6 grid gap-4 sm:grid-cols-3">

						{/* Points earned */}
						<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
							<div className="mb-6 flex items-center gap-2 text-emerald-600 font-semibold uppercase text-xs tracking-[0.2em]">
								<Target className="h-4 w-4" />
								Earned
							</div>
							<div className="text-4xl font-black">
								+{pointsEarned}
							</div>
						</div>

						{/* Current streak */}
						<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
							<div className="mb-6 flex items-center gap-2 text-orange-600 font-semibold uppercase text-xs tracking-[0.2em]">
								<Flame className="h-4 w-4" />
								Streak
							</div>
							<div className="text-4xl font-black">
								{streak}
							</div>
						</div>

						{/* Total score */}
						<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
							<div className="mb-6 flex items-center gap-2 text-indigo-600 font-semibold uppercase text-xs tracking-[0.2em]">
								<Trophy className="h-4 w-4" />
								Total
							</div>
							<div className="text-4xl font-black">
								{totalPoints}
							</div>
						</div>
					</div>

					{/* Quiz progress bar */}
					<div className="mt-6 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">

						<div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-500">
							<span>Progress</span>
							<span>
								{currentQuestion} of {totalQuestions}
							</span>
						</div>

						{/* Progress bar */}
						<div className="h-3 rounded-full bg-slate-200">
							<div
								className="h-full rounded-full bg-linear-to-r from-emerald-500 via-lime-400 to-sky-500"
								style={{
									width: `${progressPercentage}%`
								}}
							/>
						</div>

					</div>
				</div>
			</div>
		</div>
	);
};

export default AnswerRes;