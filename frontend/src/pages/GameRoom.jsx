import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import QuestionCard from '../components/game/QuestionCard'
import { createStompClient } from '../api/websocket'

function GameRoom() {
	const location = useLocation()
	const params = useParams()
	const locationState = location.state || {}
	const gamePin = params.pin || locationState.pin || '123456'
	const [selectedChoice, setSelectedChoice] = useState('')
	const [question, setQuestion] = useState(locationState.question || null)
	const [questionIndex, setQuestionIndex] = useState(locationState.questionIndex ?? null)
	const [totalQuestions, setTotalQuestions] = useState(locationState.totalQuestions ?? null)

	useEffect(() => {
		if (!gamePin) {
			return undefined
		}

		const client = createStompClient()

		client.onConnect = () => {
			client.subscribe(`/topic/room/${gamePin}`, (message) => {
				try {
					const event = JSON.parse(message.body)

					if (event.type === 'QUESTION_STARTED') {
						const payload = event.data ?? event.payload ?? {}
						setQuestion(payload.question || payload.questionDTO || null)
						setQuestionIndex(payload.questionIndex ?? null)
						setTotalQuestions(payload.totalQuestions ?? null)
						setSelectedChoice('')
					}
				} catch (error) {
					// Ignore malformed websocket messages so the question view stays usable.
				}
			})
		}

		client.activate()

		return () => {
			client.deactivate()
		}
	}, [gamePin])

	const choices = question?.choices?.map((choice) => choice.choiceText) || []
	const prompt = question?.questionText || 'Waiting for the host to trigger the first question...'

	return (
		<div className="min-h-screen bg-[#f3f4f6] text-slate-900">
			<main className="border-t-4 border-[#0d86f6] bg-[#1db987] px-4 pb-10 pt-8 sm:px-8 sm:pb-14">
				<div className="mx-auto max-w-5xl rounded-3xl bg-[#19b682] p-4 shadow-[0_14px_40px_rgba(7,102,72,0.32)] sm:p-6">
					<section className="flex flex-col items-center gap-5 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
						<div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-[#f9ca31] text-6xl font-black text-[#f9ca31]">
							{question?.timeLimit ?? '--'}
						</div>
						<h2 className="max-w-3xl text-center text-3xl font-black text-white sm:text-5xl">
							{prompt}
						</h2>
						<div className="hidden h-28 w-28 sm:block" />
					</section>

					<section className="mt-9">
						{question ? (
							<QuestionCard
								question={question.questionText}
								choices={choices}
								onSelect={setSelectedChoice}
								selected={selectedChoice}
							/>
						) : (
							<div className="rounded-3xl bg-white/20 px-6 py-10 text-center text-lg font-semibold text-white">
								Lobby joined. Waiting for host to trigger the first question...
							</div>
						)}
					</section>

					{question && questionIndex != null && totalQuestions != null ? (
						<p className="mt-6 text-center text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
							Question {questionIndex + 1} of {totalQuestions}
						</p>
					) : null}
				</div>
			</main>
		</div>
	)
}

export default GameRoom
