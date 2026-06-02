import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createStompClient } from '../api/websocket'
import api from '../api/http'

const SHAPES = [
  { color: 'bg-red-500', hover: 'hover:bg-red-600', active: 'bg-red-700', shape: '▲' },
  { color: 'bg-blue-500', hover: 'hover:bg-blue-600', active: 'bg-blue-700', shape: '♦' },
  { color: 'bg-yellow-500', hover: 'hover:bg-yellow-600', active: 'bg-yellow-700', shape: '●' },
  { color: 'bg-green-500', hover: 'hover:bg-green-600', active: 'bg-green-700', shape: '■' }
];

function GameRoom() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const locationState = location.state || {}
  
  const gamePin = params.pin || locationState.pin || '123456'
  const playerId = locationState.playerId
  const nickname = locationState.nickname || 'Player'
  
  const [question, setQuestion] = useState(locationState.question || null)
  const [questionIndex, setQuestionIndex] = useState(locationState.questionIndex ?? null)
  const [totalQuestions, setTotalQuestions] = useState(locationState.totalQuestions ?? null)
  
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [timeLeft, setTimeLeft] = useState(question?.timeLimit ?? null)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const startTimeRef = useRef(Date.now())

  const [answerResult, setAnswerResult] = useState(null)
  
  const stateRef = useRef({ answerResult: null, timeLeft: null })
  useEffect(() => {
    stateRef.current = { answerResult, timeLeft }
  }, [answerResult, timeLeft])

  useEffect(() => {
    if (!gamePin) return

    const client = createStompClient()

    client.onConnect = () => {
      client.subscribe(`/topic/room/${gamePin}`, (message) => {
        try {
          const event = JSON.parse(message.body)
          const payload = event.data ?? event.payload ?? {}

          if (event.type === 'QUESTION_STARTED') {
            const { answerResult, timeLeft } = stateRef.current
            
            if (answerResult && timeLeft > 0) {
              // We answered, but host clicked next before timer ended.
              // Go to results for 2 seconds, then AnswerRes will bounce us back to GameRoom.
              navigate('/results', {
                replace: true,
                state: { pin: gamePin, playerId, nickname, result: answerResult, nextQuestion: payload }
              })
            } else {
              // Just start the new question directly
              const newQ = payload.question || payload.questionDTO || null;
              setQuestion(newQ)
              setQuestionIndex(payload.questionIndex ?? null)
              setTotalQuestions(payload.totalQuestions ?? null)
              setSelectedChoice(null)
              setAnswerResult(null)
              setTimeLeft(newQ?.timeLimit ?? null)
              setIsTimeUp(false)
              startTimeRef.current = Date.now()
            }
          } else if (event.type === 'ANSWER_RESULT' && payload.playerId === playerId) {
            setAnswerResult(payload)
          } else if (event.type === 'GAME_FINISHED') {
            navigate('/leaderboard', { state: { pin: gamePin } })
          }
        } catch (error) {
          console.error(error)
        }
      })
    }
    client.activate()
    return () => client.deactivate()
  }, [gamePin, playerId, navigate, nickname])

  useEffect(() => {
    if (timeLeft === null || isTimeUp) return;
    
    if (timeLeft <= 0) {
      setIsTimeUp(true)
      if (selectedChoice === null) {
        handleAutoSubmit()
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeLeft, isTimeUp, selectedChoice])

  useEffect(() => {
    if (isTimeUp && answerResult) {
      navigate('/results', {
        replace: true,
        state: { pin: gamePin, playerId, nickname, result: answerResult }
      });
    }
  }, [isTimeUp, answerResult, navigate, gamePin, playerId, nickname]);

  const handleAutoSubmit = async () => {
    if (!question || selectedChoice !== null) return;
    
    try {
      await api.post('/api/games/answer', {
        roomCode: gamePin,
        playerId,
        questionId: question.id,
        choiceId: -1, // No choice
        timeTakenMs: (question.timeLimit || 0) * 1000
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleChoice = async (choiceId, index) => {
    if (selectedChoice !== null || isTimeUp) return
    setSelectedChoice(index)
    
    const timeTakenMs = Date.now() - startTimeRef.current

    try {
      await api.post('/api/games/answer', {
        roomCode: gamePin,
        playerId,
        questionId: question.id,
        choiceId,
        timeTakenMs
      })
    } catch (err) {
      console.error(err)
      setSelectedChoice(null) // Revert on failure
    }
  }

  const choices = question?.choices || []
  
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl text-emerald-500">QuizUp</div>
        <div className="flex gap-4">
          <div className="font-semibold text-slate-700 px-4 py-2 bg-slate-100 rounded-full">PIN: {gamePin}</div>
          <div className="font-bold text-emerald-600 px-4 py-2 bg-emerald-50 rounded-full">{nickname}</div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto">
        {!question ? (
          <div className="text-3xl font-black text-slate-400">Waiting for next question...</div>
        ) : selectedChoice !== null ? (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="text-4xl font-black text-slate-700">Waiting for host to click next...</div>
            <div className="text-xl font-bold text-slate-500">You submitted your answer!</div>
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mt-8"></div>
          </div>
        ) : (
          <>
            <div className="w-full flex justify-between items-start mb-8">
              <div className="flex flex-col gap-2">
                <div className="text-2xl font-bold text-slate-500">
                  {questionIndex !== null ? `Question ${questionIndex + 1}` : ''}
                </div>
                {/* DISPLAY QUESTION TEXT */}
                <h1 className="text-4xl font-black text-slate-800 max-w-3xl">
                  {question.questionText}
                </h1>
              </div>
              {timeLeft !== null && (
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 text-white text-4xl font-black shadow-lg shrink-0 ml-4">
                  {timeLeft}
                </div>
              )}
            </div>

            <div className="w-full grid grid-cols-2 gap-4 h-96">
              {choices.map((c, i) => {
                const shapeStyle = SHAPES[i % 4];
                
                return (
                  <button
                    key={c.id || i}
                    onClick={() => handleChoice(c.id, i)}
                    disabled={selectedChoice !== null || isTimeUp}
                    className={`
                      relative overflow-hidden rounded-2xl flex items-center justify-center shadow-md transition-all
                      ${shapeStyle.color} hover:${shapeStyle.hover}
                    `}
                  >
                    <span className="text-white opacity-20 text-9xl absolute pointer-events-none">
                      {shapeStyle.shape}
                    </span>
                    <span className="text-white text-3xl font-bold z-10 px-8 text-center break-words shadow-sm">
                      {c.choiceText}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default GameRoom
