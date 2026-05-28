'use client';

import { useTranslations } from 'next-intl';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <div className="container-page py-12 sm:py-16 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-eyebrow">{t('common.about')}</p>
              <h1 className="display-md mt-1">{t('terms.title')}</h1>
            </div>
          </div>

          <div className="surface-elevated p-8 space-y-8">
            <section>
              <p className="text-fg-muted leading-relaxed">{t('terms.intro')}</p>
            </section>

            {[1, 2, 3, 4].map((n) => (
              <section key={n} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">
                  {n}
                </span>
                <p className="text-fg leading-relaxed">{t(`terms.point${n}` as any)}</p>
              </section>
            ))}

            <section className="rounded-2xl bg-bg-subtle p-5">
              <p className="text-sm text-fg-muted leading-relaxed">{t('terms.disclaimer')}</p>
            </section>

            <section className="border-t border-border pt-6">
              <p className="text-xs text-fg-subtle">
                SAYIN GLOBAL · {new Date().getFullYear()} · {t('landing.footerCopyright')}
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
