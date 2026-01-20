// src/api/axios.ts
import axios from 'axios';

export const TOKEN_KEY = 'accessToken';

const api = axios.create({
  baseURL: '/api', // Vite proxy -> gateway
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — ставим Authorization, если есть токен
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) { /* ignore */ }
  return config;
}, (error) => Promise.reject(error));

// Хелпер для установки/снятия токена
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Response interceptor — при 401 не делаем мгновенный переход,
// а чистим токен и испускаем событие, чтобы React мог аккуратно реагировать
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        delete api.defaults.headers.common.Authorization;
        localStorage.removeItem(TOKEN_KEY);
        // флаг времени для синхронизации между вкладками
        localStorage.setItem('auth:loggedOutAt', Date.now().toString());
      } catch (e) { /* ignore */ }
      // испускаем событие — приложение подпишется и сделает навигацию только если нужно
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
