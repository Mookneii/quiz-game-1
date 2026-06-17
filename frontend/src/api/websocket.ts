// src/api/websocket.ts
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`
export const WS_URL = `${API_BASE_URL.replace(/\/$/, '')}/ws`

export const createStompClient = () =>
  new Client({
    webSocketFactory: () => new (SockJS as any)(WS_URL),
    reconnectDelay: 3000,
  })
