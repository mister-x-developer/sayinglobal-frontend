'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

/**
 * LandingRedirect
 * 
 * Ushbu komponent foydalanuvchi tizimga kirgan boʻlsa (Zustand auth store boʻyicha)
 * va Landing yoxud Auth sahifasida tursa, avtomatik ravishda uni Dashboardga yoʻnaltiradi.
 */
export function LandingRedirect() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const hydrated = useAuthHydrated();

  useEffect(() => {
    // Prevent redirect loop if the server mistakenly serves index.html for other paths
    if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '/index.html') return;

    if (hydrated && isAuthenticated) {
      const target = user?.is_admin ? '/admin' : '/dashboard';
      router.replace(target);
    }
  }, [hydrated, isAuthenticated, user, router]);

  return null;
}
