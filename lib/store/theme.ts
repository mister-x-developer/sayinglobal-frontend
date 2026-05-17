/**
 * Theme store shim — points to ThemeProvider context.
 */
import { useTheme } from '@/components/providers/ThemeProvider';

export function useThemeStore() {
  const { mode, setMode, toggle } = useTheme();
  return {
    mode,
    setMode,
    toggleMode: toggle,
  };
}
