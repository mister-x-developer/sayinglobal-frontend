/**
 * API Client — production-hardened with:
 * - Token refresh with race-condition lock
 * - Graceful error handling
 * - Timeout configuration
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

function shouldUseSameOriginProxy(): boolean {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function getApiBaseUrl(): string {
  // Local production smoke tests often point NEXT_PUBLIC_API_URL at the live
  // backend, which rejects localhost CORS. Use the Next.js rewrite proxy only
  // on localhost so production deployments keep their direct API origin.
  return shouldUseSameOriginProxy() ? '' : API_ORIGIN;
}

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Token reader (race-safe) ────────────────────────────────────────────────
// During the brief window between page load and Zustand persist hydration,
// the in-memory store reads as `null` even though localStorage has valid
// tokens. Reading directly from localStorage as a fallback prevents:
//   * 401 → forced logout immediately after login (window.location.replace
//     race)
//   * stale auth state on cold start
//   * tab focus / SSR hydration mismatch
function readPersistedAccess(): string | null {
  // Primary source: in-memory Zustand state (fastest)
  const fromStore = useAuthStore.getState().accessToken;
  if (fromStore) return fromStore;
  // Fallback: localStorage (Zustand persist key)
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sayin-auth-store');
    if (raw) {
      const parsed = JSON.parse(raw);
      const t = parsed?.state?.accessToken;
      if (typeof t === 'string' && t.length > 20) return t;
    }
    const direct = localStorage.getItem('access_token');
    if (direct && direct.length > 20) return direct;
  } catch {}
  return null;
}

function readPersistedRefresh(): string | null {
  const fromStore = useAuthStore.getState().refreshToken;
  if (fromStore) return fromStore;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sayin-auth-store');
    if (raw) {
      const parsed = JSON.parse(raw);
      const t = parsed?.state?.refreshToken;
      if (typeof t === 'string' && t.length > 20) return t;
    }
    const direct = localStorage.getItem('refresh_token');
    if (direct && direct.length > 20) return direct;
  } catch {}
  return null;
}

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
      const refreshToken = readPersistedRefresh();
      if (!refreshToken) throw new Error('no_refresh');
      const res = await axios.post(`${API_BASE_URL}/api/users/auth/token/refresh/`, {
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
    const isOtpEndpoint = config.url?.includes('/auth/');
    if (!isOtpEndpoint) {
      // Race-safe: prefer in-memory store, fall back to localStorage
      // during the brief Zustand persist hydration window. Without this
      // fallback, the first request after login (full page reload via
      // window.location.replace) hits the backend with NO Bearer →
      // 401 → forced logout, causing the "logged out 2 seconds after
      // login" bug.
      const token = readPersistedAccess();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Attach X-Device-* headers so backend UserSession shows real device.
    if (typeof window !== 'undefined' && config.headers) {
      try {
        const ua = navigator.userAgent || '';
        const platform = /Android/i.test(ua) ? 'web-android'
                       : /iPhone|iPad|iPod/i.test(ua) ? 'web-ios'
                       : 'web';
        const browserName = /Chrome\/[\d.]+/.test(ua) && !/Edg\//.test(ua) ? 'Chrome'
                          : /Edg\//.test(ua) ? 'Edge'
                          : /Firefox\//.test(ua) ? 'Firefox'
                          : /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Safari'
                          : 'Browser';
        const osMatch = ua.match(/\(([^)]+)\)/);
        const os = osMatch ? osMatch[1].split(';')[0].trim() : 'Web';
        const deviceName = `${browserName} on ${os}`;
        let deviceId = '';
        try {
          deviceId = localStorage.getItem('sayin_device_id') || '';
          if (!deviceId) {
            deviceId = (crypto as any).randomUUID
              ? (crypto as any).randomUUID()
              : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem('sayin_device_id', deviceId);
          }
        } catch {}
        config.headers['X-Device-Id'] = deviceId;
        config.headers['X-Device-Name'] = deviceName;
        config.headers['X-Platform'] = platform;
        config.headers['X-Os-Version'] = os;
        config.headers['X-App-Version'] = 'web-1.0.0';
      } catch {}
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

    const refreshToken = readPersistedRefresh();
    if (!refreshToken) {
      // No refresh token anywhere — only logout if we're actually past the
      // hydration window. During cold-start, just propagate the error and
      // let the page-level guards handle it.
      const looksHydrated = useAuthStore.getState().isAuthenticated
        || (typeof window !== 'undefined' && localStorage.getItem('sayin-auth-store'));
      if (looksHydrated) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/auth';
      }
      return Promise.reject(error);
    }

    try {
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
