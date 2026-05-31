'use client';

import { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';

/**
 * App-wide Framer Motion configuration.
 *
 * `reducedMotion="user"` makes every framer-motion animation honour the OS
 * `prefers-reduced-motion` setting at the JS level: transform and layout
 * animations are skipped (snapped to their target) while opacity changes are
 * preserved. The CSS `@media (prefers-reduced-motion: reduce)` block only
 * neutralises CSS-driven and inline `opacity:0` flashes — it cannot stop
 * framer-motion's rAF/WAAPI-driven transforms (e.g. drawer slide-ins). This
 * provider closes that gap so reduced-motion users get a genuinely calm UI
 * (premium-production-readiness R7.7).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
