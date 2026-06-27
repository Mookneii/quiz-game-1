// src/types/game.ts
export interface Game {
  id: string;
  players: string[];
  status: string;
}

export interface GameResult {
  player: string;
  score: number;
}

export interface GameHistory {
  gameResultId: number;
  roomId: number;
  quizTitle: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  finishedAt: string;
  roomCode: string;
}

export interface GameHistoryDetail {
  gameResultId: number;
  roomId: number;
  quizTitle: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  finishedAt: string;
  roomCode: string;
  answers: AnswerResult[];
}

export interface AnswerResult {
  questionText: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

