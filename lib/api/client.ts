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

// ── Token refresh single-flight (F-29 + F-30) ───────────────────────────────
// Replaces the old `isRefreshing` flag + `refreshQueue` array with a single
// Promise<string> mutex. All concurrent 401s share the same refresh future,
// so:
//   - exactly one POST hits /auth/token/refresh/ per burst
//   - failure rejects every waiter (no leaked promises)
//   - success awaits the same access token everywhere
// F-30: reads BOTH `access` and `refresh` from the response and persists the
// new refresh — required after backend F-12 rotation. The `?? refreshToken`
// fallback keeps pre-rotation backends working.
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error('no_refresh');
      const res = await axios.post(`${API_URL}/api/users/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      const { access, refresh: newRefresh } = res.data;
      useAuthStore.getState().setTokens(access, newRefresh ?? refreshToken);
      return access;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ── Request interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Do NOT attach a stale Bearer token to OTP/auth endpoints.
    // These are AllowAny — sending a revoked token could block them.
    const isOtpEndpoint = config.url?.includes('/auth/');
    if (!isOtpEndpoint) {
      const token = useAuthStore.getState().accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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

    try {
      // F-29 single-flight: every concurrent 401 awaits the same Promise.
      const newToken = await refreshAccessToken();
      if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/auth';
      return Promise.reject(refreshError);
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
// deploy trigger Tue May 19 03:35:37 PM +05 2026
