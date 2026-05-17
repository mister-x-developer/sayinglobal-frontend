'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/shared/Logo';

export function LandingFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-bg-subtle">
      <div className="container-page py-10 sm:py-12">
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Logo size="sm" href={null} />
            <p className="max-w-xs text-xs leading-relaxed text-fg-subtle">
              {t('landing.footerTagline')}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-fg-muted sm:justify-end">
            <Link href="/auth" className="hover:text-fg transition-colors">
              {t('auth.title')}
            </Link>
            <Link href="/listings" className="hover:text-fg transition-colors">
              {t('nav.listings')}
            </Link>
            <Link href="/sellers" className="hover:text-fg transition-colors">
              {t('nav.sellers')}
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-fg-subtle sm:flex-row">
          <span>© {year} SAYIN GLOBAL. {t('landing.footerCopyright')}</span>
          <span className="text-fg-subtle/60">{t('landing.footerTagline')}</span>
        </div>
      </div>
    </footer>
  );
}
