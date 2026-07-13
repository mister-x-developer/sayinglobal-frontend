'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store/auth';
import { Capacitor } from '@capacitor/core';

/** Qora ekran o'rniga SAYIN brendi loading ekrani */
function AuthLoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgb(var(--bg, 248 250 248))',
        zIndex: 9999,
      }}
    >
      {/* SAYIN GLOBAL logo / brend */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          animation: 'fadeIn 0.3s ease forwards',
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'rgb(31 122 82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(31,122,82,0.25)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M7 18C7 12 12 7 18 7s11 5 11 11-5 11-11 11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="18" cy="18" r="4" fill="#fff"/>
          </svg>
        </div>

        {/* Brand name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'rgb(31 122 82)', letterSpacing: '-0.02em' }}>
            SAYIN GLOBAL
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgb(118 132 124)', marginTop: '0.25rem' }}>
            Raqamli chorva bozori
          </div>
        </div>

        {/* Spinner */}
        <div
          style={{
            width: 28,
            height: 28,
            border: '2.5px solid rgb(220 226 223)',
            borderTopColor: 'rgb(31 122 82)',
            borderRadius: '50%',
            animation: 'spin 700ms linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        [data-theme='night'] #auth-loading-bg { background-color: rgb(10 13 16) !important; }
      `}</style>
    </div>
  );
}

function isPublicPath(pathname: string): boolean {
  if (!pathname) return true;
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
      const target = isPlatformAdmin ? '/admin' : '/dashboard';
      router.replace(target);
      return;
    }

    // Unauthenticated user trying to access private page
    if (!isPublicPath(pathname) && !isAuthenticated) {
      const target = pathname.startsWith('/admin') ? '/admin/login' : '/auth';
      const isRoot = pathname === '/' || pathname === '/index.html';
      const url = isRoot ? target : `${target}?next=${encodeURIComponent(pathname)}`;
      router.replace(url);
      return;
    }

    // Non-admin trying to access admin route
    if (isAdminPath(pathname) && isAuthenticated && !isPlatformAdmin) {
      router.replace('/dashboard');
      return;
    }
  }, [hasHydrated, pathname, isAuthenticated, user, router]);

  // Hydration hali tugamagan va himoyalangan sahifada — loading ko'rsat
  if (!hasHydrated && !isPublicPath(pathname || '')) {
    return <AuthLoadingScreen />;
  }

  // Hydration tugadi, autentifikatsiya yo'q, himoyalangan sahifa — redirect kutilmoqda
  if (hasHydrated && !isPublicPath(pathname || '') && !isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
