import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Home } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export default async function NotFound() {
  const t = await getTranslations();

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
            <Link href="/" className="btn btn-primary">
              <Home className="h-4 w-4" strokeWidth={2.25} />
              {t('errors.goHome')}
            </Link>
            <Link href="/dashboard" className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
              {t('common.back')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
