import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`,
});

export default api;
