'use client';

import { useEffect } from 'react';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

/**
 * LandingRedirect
 * 
 * Ushbu komponent foydalanuvchi tizimga kirgan boʻlsa (Zustand auth store boʻyicha)
 * va Landing yoxud Auth sahifasida tursa, avtomatik ravishda uni Dashboardga yo'naltiradi.
 * Bu orqali "cookie yoʻqolishi ammo localStorage saqlanib qolishi" natijasida kelib chiqadigan
 * Landing va Dashboard aralashib ketish xatoligini to'liq oldini oladi.
 */
export function LandingRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  const hydrated = useAuthHydrated();

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      window.location.replace(user?.is_admin ? '/admin' : '/dashboard');
    }
  }, [hydrated, isAuthenticated, user]);

  return null;
}
