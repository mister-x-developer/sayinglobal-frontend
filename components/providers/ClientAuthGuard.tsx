'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store/auth';
import { Capacitor } from '@capacitor/core';

function isPublicPath(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname === '/') return true;
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin/login')) return true;
  if (pathname === '/terms' || pathname === '/privacy') return true;
  return false;
}

function isAdminPath(pathname: string): boolean {
  return !!pathname && pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
}

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hasHydrated || !pathname) return;

    const isPlatformAdmin = !!(user?.is_admin || user?.is_staff);

    // If authenticated and on an auth page or on landing page (unless admin)
    if (
      (pathname.startsWith('/auth') || pathname.startsWith('/admin/login') || (pathname === '/' && !isPlatformAdmin)) &&
      isAuthenticated
    ) {
      const target = isPlatformAdmin ? '/admin' : '/dashboard';
      router.replace(target);
      return;
    }

    // Unauthenticated user trying to access private page
    if (!isPublicPath(pathname) && !isAuthenticated) {
      const target = pathname.startsWith('/admin') ? '/admin/login' : '/auth';
      router.replace(`${target}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Non-admin trying to access admin route
    if (isAdminPath(pathname) && isAuthenticated && !isPlatformAdmin) {
      router.replace('/dashboard');
      return;
    }
  }, [hasHydrated, pathname, isAuthenticated, user, router]);

  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  // Prevent flash of protected content on mobile before auth state is loaded from storage
  if (isNative && !hasHydrated && !isPublicPath(pathname || '')) {
    return null;
  }

  // Prevent flash of protected content while redirecting
  if (hasHydrated && !isPublicPath(pathname || '') && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
