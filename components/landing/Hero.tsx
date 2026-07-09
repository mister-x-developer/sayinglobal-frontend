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

      <div className="container-page relative z-10 pt-24 pb-32 sm:pt-32 sm:pb-44 lg:pt-44 lg:pb-64">
        {/* Trust pill — left aligned */}
        <div
          className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated/80 px-5 py-2.5 text-sm font-semibold text-fg-muted backdrop-blur-sm animate-fade-in"
          style={{ animationDelay: '0ms' }}
        >
          <ShieldCheck className="h-4 w-4 text-brand-accent" strokeWidth={2.25} />
          <span>{t('landing.trustTitle')}</span>
          <span className="h-1 w-1 rounded-full bg-fg-subtle" />
          <span className="text-brand-primary">{t('landing.trustFeature1Title')}</span>
        </div>

        {/* Headline — full container width, dominant scale */}
        <h1
          className="display-xl mt-10 text-balance animate-slide-up"
          style={{ animationDelay: '80ms' }}
        >
          {t('landing.heroTitle')}
        </h1>

        {/* Subtitle — generous reading width */}
        <p
          className="mt-8 max-w-3xl text-pretty text-lg leading-relaxed text-fg-muted animate-slide-up sm:text-xl lg:text-2xl lg:leading-relaxed"
          style={{ animationDelay: '160ms' }}
        >
          {t('landing.heroDescription')}
        </p>

        {/* CTAs */}
        <div
          className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:gap-4 animate-slide-up"
          style={{ animationDelay: '240ms' }}
        >
          <Link href="/auth" className="btn btn-primary btn-lg group">
            {t('landing.ctaPrimary')}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={2.25}
            />
          </Link>
          <a
            href="#how-it-works"
            className="btn btn-ghost btn-lg text-fg-muted hover:text-fg"
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
