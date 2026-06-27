// src/api/game.ts
import api from './http';
import type { GameHistory, GameHistoryDetail } from '../types/game';

export const startGame = (roomId: string) =>
  api.post(`/api/game/start`, { roomId });

export const submitAnswer = (gameId: string, answer: string) =>
  api.post(`/api/game/${gameId}/answer`, { answer });

// Game History APIs
export const getUserGameHistory = (): Promise<GameHistory[]> =>
  api.get(`/api/game-history`);

export const getGameHistoryDetail = (gameResultId: number): Promise<GameHistoryDetail> =>
  api.get(`/api/game-history/${gameResultId}`);

export const deleteGameHistory = (gameResultId: number) =>
  api.delete(`/api/game-history/${gameResultId}`);

export const deleteAllGameHistory = () =>
  api.delete(`/api/game-history`);
