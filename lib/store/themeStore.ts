/**
 * Backward-compat shim.
 * Bridges legacy `useThemeStore({ theme, toggleTheme, setTheme })` to the
 * canonical `ThemeProvider` (data-theme="day" | "night").
 */

import { useTheme } from '@/components/providers/ThemeProvider';

type LegacyTheme = 'light' | 'dark';

export function useThemeStore(selector?: (s: any) => any) {
  const { mode, setMode, toggle } = useTheme();
  const legacy: LegacyTheme = mode === 'night' ? 'dark' : 'light';

  const state = {
    theme: legacy,
    toggleTheme: toggle,
    setTheme: (t: LegacyTheme) => setMode(t === 'dark' ? 'night' : 'day'),
  };

  if (selector) return selector(state);
  return state;
}
