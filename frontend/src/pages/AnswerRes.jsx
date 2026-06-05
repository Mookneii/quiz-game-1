import Navbar_res from "../components/Navbar_res";
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Flame, Target, XCircle, Trophy, Zap } from 'lucide-react';
import { createStompClient } from '../api/websocket';

const STORAGE_KEY = 'quiz-answer-result';
const TOTAL_POINTS_KEY = 'quiz-total-points';

const defaultResult = {
	isCorrect: false,
	pointsEarned: 0,
	streak: 0,
	totalPoints: 0,
	currentQuestion: 1,
	totalQuestions: 1,
};

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
	const location = useLocation();
	const navigate = useNavigate();
	
	const locationState = location.state || {};
	const gamePin = locationState.pin;
	const playerId = locationState.playerId;
	const nickname = locationState.nickname;
	const serverResult = locationState.result || {};

	const result = {
		...defaultResult,
		...(readStoredResult() ?? {}),
		isCorrect: serverResult.correct ?? defaultResult.isCorrect,
		pointsEarned: serverResult.points ?? defaultResult.pointsEarned,
		streak: serverResult.streak ?? defaultResult.streak,
		totalPoints: serverResult.totalScore ?? defaultResult.totalPoints,
		currentQuestion: serverResult.questionIndex !== undefined ? serverResult.questionIndex + 1 : defaultResult.currentQuestion,
		totalQuestions: serverResult.totalQuestions ?? defaultResult.totalQuestions,
	};
	
	const isCorrect = Boolean(result.isCorrect);

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
						question: nextQ.question || nextQ.questionDTO || null,
						questionIndex: nextQ.questionIndex ?? null,
						totalQuestions: nextQ.totalQuestions ?? null,
					}
				});
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [locationState.nextQuestion, navigate, gamePin, playerId, nickname]);

	useEffect(() => {
		if (!gamePin) return;

		const client = createStompClient();

		client.onConnect = () => {
			client.subscribe(`/topic/room/${gamePin}`, (message) => {
				try {
					const event = JSON.parse(message.body);
					const payload = event.data ?? event.payload ?? {};

					if (event.type === 'QUESTION_STARTED') {
						navigate('/game', {
							replace: true,
							state: {
								pin: gamePin,
								playerId,
								nickname,
								question: payload.question || payload.questionDTO || null,
								questionIndex: payload.questionIndex ?? null,
								totalQuestions: payload.totalQuestions ?? null,
							}
						});
					} else if (event.type === 'GAME_FINISHED') {
						navigate('/leaderboard', { state: { pin: gamePin } });
					}
				} catch (error) {
					console.error(error);
				}
			});
		};

		client.activate();

		return () => {
			client.deactivate();
		};
	}, [gamePin, navigate, playerId, nickname]);

	const currentQuestion = Number(result.currentQuestion) || 1;
	const totalQuestions = Number(result.totalQuestions) || 1;
	const pointsEarned = Number(result.pointsEarned) || 0;
	const streak = Number(result.streak) || 0;
	const totalPoints = Number(result.totalPoints) || 0;
	const progressPercentage = Math.min(
		100,
		Math.max(0, (currentQuestion / totalQuestions) * 100)
	);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
		window.localStorage.setItem(TOTAL_POINTS_KEY, String(totalPoints));
	}, [result, totalPoints]);

	return (
		<div className="min-h-screen bg-slate-50 text-gray-900">
			<Navbar_res/>
			<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
				<div className="w-full rounded-[2rem] bg-linear-to-b from-[#0d6b46] to-[#0f8a61] px-6 py-10 text-center shadow-[0_20px_70px_rgba(15,138,97,0.22)] sm:px-8 lg:px-10">

					<div className="rounded-[2rem] bg-linear-to-b from-[#0d6b46] to-[#0f8a61] px-6 py-10 text-center shadow-[0_20px_70px_rgba(15,138,97,0.22)] sm:px-8 lg:px-10">
						<div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e8fcef] shadow-[0_0_0_16px_rgba(232,252,239,0.16)]">
							<div className={`flex h-20 w-20 items-center justify-center rounded-full ${isCorrect ? 'bg-amber-400' : 'bg-[#e05a47]'}`}>
								{isCorrect ? (
									<CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.4} />
								) : (
									<XCircle className="h-12 w-12 text-white" strokeWidth={2.4} />
								)}
							</div>
						</div>

						<div className={`mt-8 text-4xl font-black sm:text-5xl ${isCorrect ? 'text-amber-400' : 'text-red-500'}`}>
							{isCorrect ? 'Correct!' : 'Wrong!'}
						</div>
						<div className="mt-4 text-base font-semibold text-[#dff7e8] sm:text-lg">
							You earned {isCorrect ? '+' : ''}{pointsEarned} points
						</div>
					</div>

					<div className="mt-6 grid gap-4 sm:grid-cols-3">
						<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
							<div className="mb-6 flex items-center gap-2 text-emerald-600 font-semibold uppercase text-xs tracking-[0.2em]">
								<Target className="h-4 w-4" /> Earned
							</div>
							<div className="text-4xl font-black tabular-nums leading-none text-slate-900">+{pointsEarned}</div>
						</div>

						<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
							<div className="mb-6 flex items-center gap-2 text-orange-600 font-semibold uppercase text-xs tracking-[0.2em]">
								<Flame className="h-4 w-4" /> Streak
							</div>
							<div className="text-4xl font-black tabular-nums leading-none text-slate-900">{streak}</div>
						</div>

						<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
							<div className="mb-6 flex items-center gap-2 text-indigo-600 font-semibold uppercase text-xs tracking-[0.2em]">
								<Trophy className="h-4 w-4" /> Total
							</div>
							<div className="text-4xl font-black tabular-nums leading-none text-slate-900">{totalPoints}</div>
						</div>
					</div>

					<div className="mt-6 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
						<div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-500">
							<span>Progress</span>
							<span>{currentQuestion} of {totalQuestions}</span>
						</div>
						<div className="h-3 rounded-full bg-slate-200">
							<div
								className="h-full rounded-full bg-linear-to-r from-emerald-500 via-lime-400 to-sky-500"
								style={{ width: `${progressPercentage}%` }}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AnswerRes;