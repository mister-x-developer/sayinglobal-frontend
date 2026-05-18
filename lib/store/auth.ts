/**
 * Auth Store — Telegram code-only authentication
 * Single source of truth for user/session state.
 * Hydration-safe: uses `persist` with partialize to avoid SSR mismatch.
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
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Compatibility shim: legacy login() used by older pages
  login: (access: string, refresh: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (access, refresh) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            const authState = JSON.stringify({
              state: { isAuthenticated: true, accessToken: access }
            });
            document.cookie = `sayin-auth=${encodeURIComponent(authState)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
          } catch {}
        }
        set({ accessToken: access, refreshToken: refresh });
      },

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // F-33: clear sibling persisted stores so the next sign-in cannot
            // see the previous user's cached data.
            localStorage.removeItem('sayin-follow');
            localStorage.removeItem('sayin-auth');
            // Clear auth cookie so middleware redirects to /auth
            document.cookie = 'sayin-auth=; path=/; max-age=0; samesite=lax';
          } catch {}
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      login: (access, refresh, user) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            // Write auth state to cookie so middleware can read it
            const authState = JSON.stringify({
              state: { isAuthenticated: true, accessToken: access }
            });
            document.cookie = `sayin-auth=${encodeURIComponent(authState)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
          } catch {}
        }
        set({
          accessToken: access,
          refreshToken: refresh,
          user,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'sayin-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
