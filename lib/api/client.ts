/**
 * API Client — production-hardened with:
 * - Token refresh with race-condition lock
 * - Graceful error handling
 * - Timeout configuration
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Token refresh lock ──────────────────────────────────────────────────────
// Prevents multiple concurrent 401s from each triggering a refresh.
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// ── Request interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/auth';
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve) => {
        refreshQueue.push(resolve);
      }).then((newToken) => {
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      });
    }

    isRefreshing = true;

    try {
      const res = await axios.post(`${API_URL}/api/users/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      const { access } = res.data;
      useAuthStore.getState().setTokens(access, refreshToken);
      processQueue(access);
      if (original.headers) original.headers.Authorization = `Bearer ${access}`;
      return apiClient(original);
    } catch (refreshError) {
      refreshQueue = [];
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/auth';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Error message extractor ─────────────────────────────────────────────────
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (data?.detail) return data.detail;
    if (error.response?.status === 404) return 'Topilmadi';
    if (error.response?.status === 403) return 'Ruxsat yoʻq';
    if (error.response?.status === 500) return 'Server xatosi. Keyinroq urinib koʻring.';
    if (error.code === 'ECONNABORTED') return 'Soʻrov vaqti tugadi';
    if (error.message) return error.message;
  }
  return 'Kutilmagan xato yuz berdi';
}

export default apiClient;
