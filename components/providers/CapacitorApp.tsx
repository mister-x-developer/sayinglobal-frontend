'use client';

import { useEffect } from 'react';
import { initializeApp, isNativeApp } from '@/lib/capacitor';

export function CapacitorApp() {
  useEffect(() => {
    // Only initialize if we're in a native app
    if (isNativeApp()) {
      initializeApp().catch(console.error);
    }
  }, []);

  return null;
}
