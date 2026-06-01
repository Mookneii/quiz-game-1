import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Circle, Diamond, Square, Heart, CheckCircle2, XCircle, Target, Flame, Trophy } from "lucide-react";
import Navbar_res from "../components/Navbar_res";
import { createStompClient } from "../api/websocket";

const optionStyles = [
	{ id: "A", icon: Circle, color: "bg-[#ec3251]", border: "border-[#ff677f]" },
	{ id: "B", icon: Diamond, color: "bg-[#2da2cc]", border: "border-[#58baf2]" },
	{ id: "C", icon: Square, color: "bg-[#ecb906]", border: "border-[#f5cb3f]" },
	{ id: "D", icon: Heart, color: "bg-[#2bc560]", border: "border-[#57da84]" },
];

export default function GameRoom() {
	const location = useLocation();
	const navigate = useNavigate();
	const locationState = location.state || {};

	const pin = locationState.pin || "123456";
	const playerId = locationState.playerId || 1;
	const nickname = locationState.nickname || "Player";

	const [currentQuestion, setCurrentQuestion] = useState(null);
	const [questionIndex, setQuestionIndex] = useState(0);
	const [totalQuestions, setTotalQuestions] = useState(0);
	const [selectedChoiceId, setSelectedChoiceId] = useState(null);
	const [answered, setAnswered] = useState(false);
	const [timeLeft, setTimeLeft] = useState(20);
	const [totalScore, setTotalScore] = useState(0);
	const [streak, setStreak] = useState(0);
	const [feedback, setFeedback] = useState(null);

	// Connect to WebSocket
	useEffect(() => {
		const client = createStompClient();
		client.onConnect = () => {
			client.subscribe(`/topic/room/${pin}`, (message) => {
				const event = JSON.parse(message.body);
				console.log("Player WebSocket event received:", event);

				if (event.type === 'QUESTION_STARTED') {
					setCurrentQuestion(event.payload.questionDTO);
					setQuestionIndex(event.payload.questionIndex);
					setTotalQuestions(event.payload.totalQuestions);
					setSelectedChoiceId(null);
					setAnswered(false);
					setFeedback(null);
					setTimeLeft(event.payload.questionDTO.timeLimit || 20);
				} else if (event.type === 'GAME_FINISHED') {
					navigate(`/leaderboard`, { state: { pin } });
				}
			});
		};
		client.activate();

		return () => {
			client.deactivate();
		};
	}, [pin, navigate]);

	// Countdown Timer
	useEffect(() => {
		if (timeLeft <= 0 || answered || !currentQuestion) {
			if (timeLeft === 0 && !answered) {
				// Auto-submit incorrect answer
				handleAutoSubmit();
			}
			return;
		}

		const timer = setTimeout(() => {
			setTimeLeft((prev) => prev - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [timeLeft, answered, currentQuestion]);

	const handleAutoSubmit = async () => {
		setFeedback({
			correct: false,
			points: 0,
			totalScore: totalScore,
		});
		setStreak(0);
		setAnswered(true);
	};

	const handleAnswerSubmit = async (choiceId) => {
		if (answered) return;
		setSelectedChoiceId(choiceId);
		setAnswered(true);

		const timeLimit = currentQuestion.timeLimit || 20;
		const timeTakenMs = (timeLimit - timeLeft) * 1000;

		try {
			const response = await fetch("http://localhost:8080/api/games/answer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					roomCode: pin,
					playerId: playerId,
					questionId: currentQuestion.id,
					choiceId: choiceId,
					timeTakenMs: timeTakenMs,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to submit answer");
			}

			const data = await response.json();
			console.log("Answer response:", data);

			setTotalScore(data.totalScore);
			if (data.correct) {
				setStreak((prev) => prev + 1);
			} else {
				setStreak(0);
			}

			setFeedback({
				correct: data.correct,
				points: data.points,
				totalScore: data.totalScore,
			});
		} catch (err) {
			console.error("Error submitting answer:", err);
			setFeedback({
				correct: false,
				points: 0,
				totalScore: totalScore,
			});
			setStreak(0);
		}
	};

	const progressPercentage = totalQuestions > 0 ? Math.min(100, Math.max(0, ((questionIndex + 1) / totalQuestions) * 100)) : 0;

	return (
		<div className="min-h-screen bg-[#f3f4f6] text-slate-900 flex flex-col font-sans">
			<Navbar_res pin={pin} score={totalScore} />
			
			<main className="flex-1 bg-[#1db987] px-4 pb-10 pt-8 sm:px-8 sm:pb-14 flex items-center justify-center">
				<div className="w-full max-w-5xl">
					{!currentQuestion ? (
						<div className="rounded-3xl bg-[#19b682] p-12 text-center shadow-[0_14px_40px_rgba(7,102,72,0.32)] text-white">
							<span className="text-7xl animate-pulse inline-block mb-6">🎮</span>
							<h2 className="text-4xl font-black mb-4">Lobby Joined</h2>
							<p className="text-emerald-100 text-lg">
								Waiting for host to trigger the first question...
							</p>
						</div>
					) : !answered ? (
						<div className="rounded-3xl bg-[#19b682] p-4 shadow-[0_14px_40px_rgba(7,102,72,0.32)] sm:p-6">
							<section className="flex flex-col items-center gap-5 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
								<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[#f9ca31] text-5xl font-black text-[#f9ca31]">
									{timeLeft}
								</div>
								<h2 className="max-w-3xl text-center text-3xl font-black text-white sm:text-4xl">
									{currentQuestion.questionText}
								</h2>
								<div className="hidden h-24 w-24 sm:block" />
							</section>

							<section className="mt-9 grid gap-5 sm:grid-cols-2">
								{currentQuestion.choices?.map((choice, index) => {
									const style = optionStyles[index % 4];
									const LeadingIcon = style.icon;

									return (
										<button
											key={choice.id}
											type="button"
											onClick={() => handleAnswerSubmit(choice.id)}
											className={`group relative rounded-3xl border-4 p-6 text-left text-white transition duration-200 ${style.color} ${style.border} hover:-translate-y-0.5 hover:brightness-105`}
										>
											<div className="mb-4 flex items-center justify-between">
												<div className="flex items-center gap-3 text-xl font-bold">
													<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25">
														<LeadingIcon className="h-5 w-5" />
													</span>
													<span className="text-2xl">{style.id}</span>
												</div>
											</div>
											<div className="text-2xl font-extrabold leading-tight">{choice.choiceText}</div>
										</button>
									);
								})}
							</section>
						</div>
					) : (
						<div className="rounded-[2rem] bg-linear-to-b from-[#0d6b46] to-[#0f8a61] px-6 py-10 text-center shadow-[0_20px_70px_rgba(15,138,97,0.22)] sm:px-8 lg:px-10 text-white">
							<div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e8fcef] shadow-[0_0_0_16px_rgba(232,252,239,0.16)]">
								<div className={`flex h-20 w-20 items-center justify-center rounded-full ${feedback?.correct ? 'bg-amber-400' : 'bg-[#e05a47]'}`}>
									{feedback?.correct ? (
										<CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.4} />
									) : (
										<XCircle className="h-12 w-12 text-white" strokeWidth={2.4} />
									)}
								</div>
							</div>

							<div className={`mt-8 text-4xl font-black sm:text-5xl ${feedback?.correct ? 'text-amber-400' : 'text-red-500'}`}>
								{feedback?.correct ? 'Correct!' : 'Wrong!'}
							</div>
							<div className="mt-4 text-base font-semibold text-[#dff7e8] sm:text-lg">
								You earned {feedback?.correct ? '+' : ''}{feedback?.points || 0} points
							</div>

							<div className="mt-8 grid gap-4 grid-cols-3 text-slate-800">
								<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
									<div className="mb-4 flex items-center gap-2 text-emerald-600 font-semibold uppercase text-xs tracking-wider">
										<Target className="h-4 w-4" /> Earned
									</div>
									<div className="text-3xl font-black text-slate-900">+{feedback?.points || 0}</div>
								</div>

								<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
									<div className="mb-4 flex items-center gap-2 text-orange-600 font-semibold uppercase text-xs tracking-wider">
										<Flame className="h-4 w-4" /> Streak
									</div>
									<div className="text-3xl font-black text-slate-900">{streak}</div>
								</div>

								<div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
									<div className="mb-4 flex items-center gap-2 text-indigo-600 font-semibold uppercase text-xs tracking-wider">
										<Trophy className="h-4 w-4" /> Total
									</div>
									<div className="text-3xl font-black text-slate-900">{totalScore}</div>
								</div>
							</div>

							<div className="mt-8 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 text-slate-800">
								<div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-500">
									<span>Progress</span>
									<span>Question {questionIndex + 1} of {totalQuestions}</span>
								</div>
								<div className="h-3 rounded-full bg-slate-200 overflow-hidden">
									<div
										className="h-full rounded-full bg-linear-to-r from-emerald-500 via-lime-400 to-sky-500"
										style={{ width: `${progressPercentage}%` }}
									/>
								</div>
							</div>
							
							<div className="mt-8 text-emerald-100 text-sm animate-pulse">
								Waiting for host to trigger the next question...
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
