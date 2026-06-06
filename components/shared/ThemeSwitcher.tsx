'use client';

import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeSwitcher() {
  const { mode, toggle, mounted } = useTheme();

  return (
    <button
      onClick={toggle}
      type="button"
      suppressHydrationWarning
      aria-label={mode === 'day' ? 'Tungi rejimga oʻtish' : 'Kunduzgi rejimga oʻtish'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-fg transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <motion.span
        key={mode}
        initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex"
      >
        {!mounted ? (
          <Sun className="h-4.5 w-4.5" strokeWidth={1.75} />
        ) : mode === 'day' ? (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        )}
      </motion.span>
    </button>
  );
}
