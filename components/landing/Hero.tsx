'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground';

/**
 * Hero — wide, confident, premium scale.
 * No inner max-width constraint — uses the full container width.
 */
export function Hero() {
  const t = useTranslations();

  return (
    <section className="relative isolate overflow-hidden">
      <AtmosphericBackground variant="hero" />

      {/* Modern Premium Glow Effects */}
      <div className="absolute top-1/3 left-[20%] -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/2 left-[80%] -z-10 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />

      <div className="container-page relative z-10 pt-24 pb-32 sm:pt-32 sm:pb-44 lg:pt-44 lg:pb-64">
        {/* Trust pill — left aligned */}
        <div
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-bg-elevated/70 px-5 py-2.5 text-sm font-semibold text-fg-muted shadow-soft backdrop-blur-xl animate-fade-in transition-all hover:bg-bg-elevated hover:shadow-lift hover:border-brand-primary/30"
          style={{ animationDelay: '0ms' }}
        >
          <ShieldCheck className="h-4 w-4 text-brand-accent animate-pulse" strokeWidth={2.25} />
          <span>{t('landing.trustTitle')}</span>
          <span className="h-1 w-1 rounded-full bg-border-strong" />
          <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent font-bold">{t('landing.trustFeature1Title')}</span>
        </div>

        {/* Headline — full container width, dominant scale */}
        <h1
          className="display-xl mt-10 max-w-4xl text-balance bg-gradient-to-br from-fg via-fg to-fg-muted bg-clip-text text-transparent animate-slide-up leading-tight sm:text-6xl md:text-7xl drop-shadow-sm"
          style={{ animationDelay: '80ms' }}
        >
          {t('landing.heroTitle')}
        </h1>

        {/* Subtitle — generous reading width */}
        <p
          className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-fg-muted animate-slide-up sm:text-xl lg:text-2xl"
          style={{ animationDelay: '160ms' }}
        >
          {t('landing.heroDescription')}
        </p>

        {/* CTAs */}
        <div
          className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:gap-4 animate-slide-up"
          style={{ animationDelay: '240ms' }}
        >
          <Link href="/auth" className="btn btn-primary btn-lg group relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              {t('landing.ctaPrimary')}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={2.25}
              />
            </span>
            {/* Shimmer effect inside button */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:animate-[skeleton-shimmer_1.5s_infinite]" />
          </Link>
          <a
            href="#how-it-works"
            className="btn btn-ghost btn-lg text-fg-muted hover:text-fg backdrop-blur-sm transition-all hover:bg-bg-subtle/50"
          >
            {t('landing.ctaSecondary')}
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 animate-fade-in"
        style={{ animationDelay: '1000ms' }}
      >
        <div className="flex flex-col items-center gap-1 text-fg-subtle animate-float">
          <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
        </div>
      </div>
    </section>
  );
}
