/**
 * Auth Store — Telegram code-only authentication.
 *
 * Single source of truth for user/session state.
 *
 * Hydration race fix:
 * - Cookie is the synchronous truth source for middleware
 * - Zustand `persist` is the truth source for client UI
 * - `useAuthHydrated()` returns true ONLY after persist has rehydrated
 *   from localStorage, so consumers never trigger redirect-to-/auth
 *   while the store is still booting
 *
 * Atomicity guarantees in `setSession`:
 *   1. localStorage written synchronously (before any navigation)
 *   2. Cookie written synchronously
 *   3. Zustand state set
 *   4. Returns only after all three have happened
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

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
  _hasHydrated: boolean;

  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  setSession: (access: string, refresh: string, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  login: (access: string, refresh: string, user: User) => void;
  setHasHydrated: (value: boolean) => void;
}

const COOKIE_NAME = 'sayin-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function writeAuthCookie(payload: {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
}) {
  if (typeof document === 'undefined') return;
  const isAdminUser = !!(payload.user?.is_admin || payload.user?.is_staff);
  const body = JSON.stringify({
    state: {
      isAuthenticated: payload.isAuthenticated,
      accessToken: payload.accessToken,
      user: payload.user
        ? {
            public_id: payload.user.public_id,
            is_admin: isAdminUser,
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

function writeLocalStorageTokens(access: string | null, refresh: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (access) localStorage.setItem('access_token', access);
    else localStorage.removeItem('access_token');
    if (refresh) localStorage.setItem('refresh_token', refresh);
    else localStorage.removeItem('refresh_token');
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
      _hasHydrated: false,

      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
        writeAuthCookie({
          isAuthenticated: !!user,
          accessToken: get().accessToken,
          user,
        });
      },

      setTokens: (access, refresh) => {
        writeLocalStorageTokens(access, refresh);
        set({ accessToken: access, refreshToken: refresh });
        writeAuthCookie({
          isAuthenticated: true,
          accessToken: access,
          user: get().user,
        });
      },

      /**
       * Atomic session set. Order matters:
       *   1. localStorage (sync) — so middleware can see it on next request
       *      (note: middleware reads cookie, but the API client reads
       *      localStorage on cold start)
       *   2. Cookie (sync) — middleware sees authenticated state
       *   3. Zustand state — UI re-renders
       */
      setSession: (access, refresh, user) => {
        writeLocalStorageTokens(access, refresh);
        writeAuthCookie({
          isAuthenticated: true,
          accessToken: access,
          user,
        });
        set({
          accessToken: access,
          refreshToken: refresh,
          user,
          isAuthenticated: true,
        });
      },

      updateUser: (data) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const next = { ...currentUser, ...data };
        set({ user: next });
        writeAuthCookie({
          isAuthenticated: true,
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
            localStorage.removeItem('sayin-auth-store');
            localStorage.removeItem('sayin-auth');
          } catch {}
        }
        clearAuthCookie();
        // F-33 / F-51 fix: clear in-memory user-scoped Zustand stores BEFORE
        // flipping auth state, so any re-render that races with the auth
        // transition sees consistent (empty + unauthenticated) state, not
        // (previous-user-data + unauthenticated). Imports are deferred to
        // avoid a circular import (the stores may import from `./auth`).
        try {
          const notif = require('./notifications') as
            typeof import('./notifications');
          notif.useNotificationsStore.getState().reset();
        } catch {/* never block sign-out on store reset failures */}
        try {
          const follow = require('./follow') as typeof import('./follow');
          follow.useFollowStore.getState().reset();
        } catch {/* never block sign-out on store reset failures */}
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
        // _hasHydrated is intentionally excluded — it must always start false
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state && typeof document !== 'undefined') {
          if (state.isAuthenticated && state.accessToken) {
            writeAuthCookie({
              isAuthenticated: true,
              accessToken: state.accessToken,
              user: state.user,
            });
          }
        }
        // Mark hydration complete — prevents premature navigation guards
        if (state && state.setHasHydrated) {
          state.setHasHydrated(true);
        } else {
          setTimeout(() => {
            useAuthStore.getState().setHasHydrated(true);
          }, 0);
        }
      },
    }
  )
);

/**
 * useAuthHydrated — returns true only after the auth store has finished
 * rehydrating from localStorage. Pages MUST gate their "redirect if not
 * authenticated" effects on this so they do not bounce the user back to
 * /auth during the brief boot window.
 */
export function useAuthHydrated(): boolean {
  return useAuthStore((s) => s._hasHydrated);
}

/**
 * useHasHydrated — alias for useAuthHydrated.
 * Returns true only after the auth store has finished rehydrating from localStorage.
 * Use this to gate navigation guards so they don't fire during the boot window.
 */
export function useHasHydrated(): boolean {
  return useAuthHydrated();
}
