// src/api/websocket.ts
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://quizgame-backend-production-5fa0.up.railway.app'
export const WS_URL = `${API_BASE_URL.replace(/\/$/, '')}/ws`

export const createStompClient = () =>
  new Client({
    webSocketFactory: () => new (SockJS as any)(WS_URL),
    reconnectDelay: 3000,
  })
