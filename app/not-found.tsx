'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-bg-elevated/60 backdrop-blur">
        <div className="container-page flex h-16 items-center">
          <Logo size="sm" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="text-center">
          <p className="text-eyebrow">404</p>
          <h1 className="display-lg mt-4">{t('errors.notFoundTitle')}</h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-fg-muted">
            {t('errors.notFoundDescription')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="btn btn-primary">
              <LayoutDashboard className="h-4 w-4" strokeWidth={2.25} />
              {t('nav.home')}
            </Link>
            <Link href="/" className="btn btn-secondary">
              <Home className="h-4 w-4" strokeWidth={2.25} />
              {t('landing.heroTitle')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
