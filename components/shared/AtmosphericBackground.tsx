'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';

interface AtmosphericBackgroundProps {
  variant?: 'hero' | 'section' | 'subtle';
  showHills?: boolean;
}

/**
 * Cinematic Day/Night atmosphere.
 * Day: warm sunlight, sky gradient, green hills.
 * Night: stars, moon glow, deep valley.
 * Smooth 600ms transition between modes.
 *
 * SCOPING (WS-C, R7.3): This component renders the heavy atmosphere effects
 * (sun/moon orb, stars, hills). It MUST only be mounted on the landing page
 * (`app/page.tsx` via `Hero`) and the auth pages (`app/auth/*`). Functional
 * and admin pages use the calm, low-contrast `bg`/`surface-subtle` background
 * instead — do NOT mount this on listings, chat, profile, dashboard or admin.
 */
export function AtmosphericBackground({
  variant = 'hero',
  showHills = true,
}: AtmosphericBackgroundProps) {
  const { mode, mounted } = useTheme();

  const isNight = mounted ? mode === 'night' : false;

  return (
    <div
      className={`atmosphere ${isNight ? 'atmosphere-night' : 'atmosphere-day'}`}
      style={{ transition: 'background 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Sky orb — sun or moon */}
      <AnimatePresence mode="wait">
        {!isNight ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="sun-orb animate-float"
            aria-hidden="true"
          />
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="moon-orb animate-float"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Stars — night only */}
      <AnimatePresence>
        {isNight && (
          <motion.div
            key="stars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="stars"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Hill silhouettes */}
      {showHills && variant !== 'subtle' && (
        <div className="hills" aria-hidden="true">
          <div className="hill hill-1" />
          <div className="hill hill-2" />
          <div className="hill hill-3" />
        </div>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: isNight
            ? 'radial-gradient(ellipse at center, transparent 40%, rgb(9 14 19 / 0.5) 100%)'
            : 'radial-gradient(ellipse at center, transparent 40%, rgb(244 247 245 / 0.4) 100%)',
          transition: 'background 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}
