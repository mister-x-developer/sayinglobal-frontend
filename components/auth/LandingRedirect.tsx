'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

/**
 * LandingRedirect
 * 
 * Ushbu komponent foydalanuvchi tizimga kirgan boʻlsa (Zustand auth store boʻyicha)
 * va Landing yoxud Auth sahifasida tursa, avtomatik ravishda uni Dashboardga yo'naltiradi.
 */
export function LandingRedirect() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const hydrated = useAuthHydrated();

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      const target = user?.is_admin ? '/admin' : '/dashboard';
      if (typeof window !== 'undefined' && !(window as any).Capacitor?.isNative) {
        window.location.replace(target);
      } else {
        router.replace(target);
      }
    }
  }, [hydrated, isAuthenticated, user, router]);

  return null;
}
