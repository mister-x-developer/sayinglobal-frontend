'use client';

import { useEffect } from 'react';

/**
 * Marks the document as hydrated only after React has mounted on the client.
 * CSS uses this flag to keep framer-motion's initial opacity/transform styles
 * from hiding server-rendered content during the hydration window.
 */
export function HydrationReady() {
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      document.documentElement.classList.add('js-ready');
    });

    return () => window.cancelAnimationFrame(raf);
  }, []);

  return null;
}
