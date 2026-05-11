import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// ── Request interceptor — atașează JWT la fiecare request ──
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — handling global erori ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirat — curăță sesiunea și redirect la login
      clearToken();
      window.location.href = '/tutor-track/#/login';
    }
    return Promise.reject(error);
  },
);

// ── Token management — în memorie, NU în localStorage ──
let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

export function clearToken() {
  _token = null;
}