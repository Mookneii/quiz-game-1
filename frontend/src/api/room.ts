// src/api/room.ts
import api from './http';

export const createRoom = (data: { hostName: string; quizId?: number; hostId?: number }) =>
  api.post('/api/rooms', data);

export const joinRoom = (data: { roomCode: string; nickname: string }) =>
  api.post('/api/rooms/join', data);

export const getRoomDetails = (roomCode: string) =>
  api.get(`/api/rooms/${roomCode}`);

