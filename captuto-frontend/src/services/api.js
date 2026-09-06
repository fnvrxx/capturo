import axios from 'axios';
import { isAuthSubmission } from './authErrors';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('capturo_token');
  if (token && !isAuthSubmission(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isAuthSubmission(err.config?.url)) {
      localStorage.removeItem('capturo_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
