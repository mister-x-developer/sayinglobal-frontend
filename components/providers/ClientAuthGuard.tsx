'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store/auth';
import { Capacitor } from '@capacitor/core';



function isPublicPath(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname === '/' || pathname === '/index.html') return true;
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

    // If authenticated and on an auth page
    if (
      (pathname.startsWith('/auth') || pathname.startsWith('/admin/login')) &&
      isAuthenticated
    ) {
      // Allow AuthPageContent to handle the redirect for /auth so it preserves the ?next= parameter
      if (pathname.startsWith('/auth')) return;

      const target = isPlatformAdmin ? '/admin' : '/dashboard';
      router.replace(target);
      return;
    }

    // Proactively re-sync the cookie on every route change if authenticated.
    // This fixes the issue where the 7-day cookie expires but the localStorage Zustand store
    // remains hydrated, causing middleware to bounce the user to /auth.
    if (isAuthenticated) {
      const auth = require('@/lib/store/auth');
      if (auth.writeAuthCookie) {
        auth.writeAuthCookie({
          isAuthenticated: true,
          accessToken: useAuthStore.getState().accessToken,
          user: useAuthStore.getState().user,
        });
      }
    }

    // Unauthenticated user trying to access private page
    if (!isPublicPath(pathname) && !isAuthenticated) {
      const target = pathname.startsWith('/admin') ? '/admin/login' : '/auth';
      const isRoot = pathname === '/' || pathname === '/index.html';
      const url = isRoot ? target : `${target}?next=${encodeURIComponent(pathname)}`;
      router.replace(url);
      return;
    }

    // Native apps do not use the landing page. Redirect unauthenticated users directly to /auth.
    if ((pathname === '/' || pathname === '/index.html') && Capacitor.isNativePlatform() && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    // Non-admin trying to access admin route
    if (isAdminPath(pathname) && isAuthenticated && !isPlatformAdmin) {
      router.replace('/dashboard');
      return;
    }
  }, [hasHydrated, pathname, isAuthenticated, user, router]);

  if (!hasHydrated && !isPublicPath(pathname || '')) {
    const { Logo } = require('@/components/shared/Logo');
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-6">
          <Logo size="lg" href={null} />
          <div className="spinner" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // Prevent flash of protected content while redirecting
  if (hasHydrated && !isPublicPath(pathname || '') && !isAuthenticated) {
    return null;
  }

  // Native apps do not have a landing page; unauthenticated users should see Auth page.
  // Returning null here prevents the LandingPage HTML from flashing before redirecting.
  if (hasHydrated && Capacitor.isNativePlatform() && (pathname === '/' || pathname === '/index.html') && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
