'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

/**
 * Landing-only navigation.
 * Uses CSS-based animations (no framer-motion) so it always renders
 * correctly on first paint, even before JS hydration.
 */
export function LandingNav() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydrated();

  // After hydration: authenticated users get logo → /dashboard,
  // unauthenticated users get logo → / (landing, current page).
  const logoHref = hydrated && isAuthenticated ? '/dashboard' : '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-500 animate-fade-in ${
        scrolled
          ? 'border-b border-border/60 bg-bg/80 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgb(var(--border)/0.5)]'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-page">
        <nav className="flex h-16 items-center justify-between" aria-label="Main navigation">
          <Logo size="sm" href={logoHref} />

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeSwitcher />
            {!hydrated ? (
              <div className="h-9 w-24 rounded-full bg-border/50 animate-pulse" />
            ) : isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn btn-primary btn-sm gap-1.5 group"
              >
                <span>{t('nav.home')}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  strokeWidth={2.25}
                />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="btn btn-primary btn-sm gap-1.5 group"
              >
                <span className="hidden sm:inline">{t('auth.title')}</span>
                <span className="sm:hidden">{t('common.continue')}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  strokeWidth={2.25}
                />
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
