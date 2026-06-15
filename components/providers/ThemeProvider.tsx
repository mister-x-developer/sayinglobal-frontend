'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'day' | 'night';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'sayin-theme';

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'day';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'day' || stored === 'night') return stored;
  } catch {}
  // Default to 'day' regardless of OS preference. Night mode is opt-in.
  return 'day';
}

function applyMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.colorScheme = mode === 'night' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize from the data-theme attribute that the inline script already set.
  // This avoids a SSR→client mismatch: the inline script runs before React
  // hydrates, so document.documentElement already has the correct data-theme.
  // Initialize to 'day' to match the server-rendered HTML.
  // This prevents hydration mismatches. We will sync with the actual
  // DOM/localStorage value in the useEffect below.
  const [mode, setModeState] = useState<ThemeMode>('day');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync React state with the actual data-theme attribute set by the inline script
    const attr = document.documentElement.getAttribute('data-theme');
    const actualMode = (attr === 'day' || attr === 'night') ? attr : 'day';
    if (actualMode !== mode) {
      setModeState(actualMode);
    }
    setMounted(true);
    // Enable smooth theme transitions only after first hydration so the
    // initial paint is instant (no transition flash).
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document.body.classList.add('theme-ready');
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    applyMode(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {}
  };

  const toggle = () => setMode(mode === 'day' ? 'night' : 'day');

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
