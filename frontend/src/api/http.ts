import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`,
});

api.interceptors.request.use((config) => {
  // Retrieve token from localStorage. Login stores it under 'token',
  // but older code expected 'quiz-game-auth-user'. Support both.
  let token = window.localStorage.getItem('token');
  if (!token) {
    const storedUserStr = window.localStorage.getItem('quiz-game-auth-user');
    if (storedUserStr) {
      try {
        const user = JSON.parse(storedUserStr);
        token = user?.token;
      } catch {
        // ignore parse errors
      }
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;