// src/api/quiz.ts
import api from './http';
import type { AiQuizGenerationResponse, SaveQuizRequest } from '../types/quiz';

export const createQuiz = (data: SaveQuizRequest) =>
  api.post('/api/quizzes', data);

export const getQuiz = (quizId: string) =>
  api.get(`/api/quizzes/${quizId}`);

export const updateQuiz = (quizId: string, data: SaveQuizRequest) =>
  api.put(`/api/quizzes/${quizId}`, data);

export const deleteQuiz = (quizId: string) =>
  api.delete(`/api/quizzes/${quizId}`);

export const generateQuizFromDocument = (
  file: File,
  difficulty: string,
  questionType: string,
  numberOfQuestions: number,
  model?: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('difficulty', difficulty);
  formData.append('questionType', questionType);
  formData.append('numberOfQuestions', numberOfQuestions.toString());

  if (model && model.trim()) {
    formData.append('model', model.trim());
  }

  return api.post<AiQuizGenerationResponse>('/api/ai/generate-quiz', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
