/**
 * Auth Store — Telegram code-only authentication
 * Single source of truth for user/session state.
 * Hydration-safe: uses `persist` with partialize to avoid SSR mismatch.
 *
 * Cookie strategy: every state change writes the SAME cookie (`sayin-auth`)
 * with `state.isAuthenticated`, `state.accessToken`, and `state.user.is_admin`
 * so middleware can route admins to /admin and non-admins to /dashboard.
 * The cookie is the single source of truth for middleware-side decisions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  public_id: number;
  phone: string;
  full_name: string;
  telegram_username?: string;
  avatar?: string | null;
  avatar_url?: string;
  bio?: string;
  status?: 'good' | 'warning' | 'restricted' | 'blocked';
  trust_score?: number;
  rating_count?: number;
  is_verified?: boolean;
  is_staff?: boolean;
  is_admin?: boolean;
  date_joined?: string;
  terms_accepted_at?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Canonical actions
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  setSession: (access: string, refresh: string, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Compatibility shim: legacy login() used by older pages
  login: (access: string, refresh: string, user: User) => void;
}

const COOKIE_NAME = 'sayin-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function writeAuthCookie(payload: {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
}) {
  if (typeof document === 'undefined') return;
  const body = JSON.stringify({
    state: {
      isAuthenticated: payload.isAuthenticated,
      accessToken: payload.accessToken,
      user: payload.user
        ? {
            public_id: payload.user.public_id,
            is_admin: !!payload.user.is_admin,
            is_staff: !!payload.user.is_staff,
            terms_accepted_at: payload.user.terms_accepted_at ?? null,
          }
        : null,
    },
  });
  try {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(body)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  } catch {}
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  } catch {}
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
        writeAuthCookie({
          isAuthenticated: !!user,
          accessToken: get().accessToken,
          user,
        });
      },

      setTokens: (access, refresh) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
          } catch {}
        }
        set({ accessToken: access, refreshToken: refresh });
        writeAuthCookie({
          isAuthenticated: true,
          accessToken: access,
          user: get().user,
        });
      },

      // Atomic session set — writes user + tokens + cookie in a single shot
      // so the middleware sees a consistent state on the very next navigation.
      setSession: (access, refresh, user) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
          } catch {}
        }
        set({
          accessToken: access,
          refreshToken: refresh,
          user,
          isAuthenticated: true,
        });
        writeAuthCookie({
          isAuthenticated: true,
          accessToken: access,
          user,
        });
      },

      updateUser: (data) => {
        const next = get().user ? { ...get().user!, ...data } : null;
        set({ user: next });
        writeAuthCookie({
          isAuthenticated: !!next,
          accessToken: get().accessToken,
          user: next,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('sayin-follow');
            localStorage.removeItem('sayin-auth');
          } catch {}
        }
        clearAuthCookie();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      login: (access, refresh, user) => {
        get().setSession(access, refresh, user);
      },
    }),
    {
      name: 'sayin-auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // After Zustand re-hydrates from localStorage, mirror the state into
      // the cookie so middleware sees the authenticated session on the very
      // next navigation. Without this, a hard refresh restores Zustand state
      // but the cookie is missing → middleware redirects to /auth.
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          if (state.isAuthenticated && state.accessToken) {
            writeAuthCookie({
              isAuthenticated: true,
              accessToken: state.accessToken,
              user: state.user,
            });
          }
        }
      },
    }
  )
);
