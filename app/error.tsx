'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.is_admin || s.user?.is_staff);
  const hydrated = useAuthHydrated();

  // Auth-aware home link: admin → /admin, user → /dashboard, guest → /
  const homeHref = hydrated && isAuthenticated
    ? isAdmin ? '/admin' : '/dashboard'
    : '/';

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError]', error);
    }
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      try {
        const Sentry = (window as any).__SENTRY__;
        Sentry.captureException?.(error);
      } catch {}
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-bg-elevated/60 backdrop-blur">
        <div className="container-page flex h-16 items-center">
          <Logo size="sm" href={homeHref} />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-md text-center">
          <p className="text-eyebrow">{t('errors.somethingWrong')}</p>
          <h1 className="display-lg mt-4">{t('errors.tryAgainLater')}</h1>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-left font-mono text-xs text-danger">
              {error.message}
            </p>
          )}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => reset()} className="btn btn-primary">
              <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
              {t('common.tryAgain')}
            </button>
            <Link href={homeHref} className="btn btn-secondary">
              <Home className="h-4 w-4" strokeWidth={2.25} />
              {t('errors.goHome')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
