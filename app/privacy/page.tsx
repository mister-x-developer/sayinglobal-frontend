'use client';

import { useTranslations } from 'next-intl';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations();

  const sections = [
    {
      title: t('privacy.dataCollectionTitle'),
      body: t('privacy.dataCollectionBody'),
    },
    {
      title: t('privacy.dataUsageTitle'),
      body: t('privacy.dataUsageBody'),
    },
    {
      title: t('privacy.locationTitle'),
      body: t('privacy.locationBody'),
    },
    {
      title: t('privacy.securityTitle'),
      body: t('privacy.securityBody'),
    },
    {
      title: t('privacy.rightsTitle'),
      body: t('privacy.rightsBody'),
    },
    {
      title: t('privacy.cookiesTitle'),
      body: t('privacy.cookiesBody'),
    },
    {
      title: t('privacy.changesTitle'),
      body: t('privacy.changesBody'),
    },
    {
      title: t('privacy.contactTitle'),
      body: t('privacy.contactBody'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <div className="container-page py-12 sm:py-16 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
              <Lock className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-eyebrow">{t('common.about')}</p>
              <h1 className="display-md mt-1">{t('privacy.title')}</h1>
            </div>
          </div>

          <div className="surface-elevated p-8 space-y-8">
            {sections.map((section, i) => (
              <section key={i} className="space-y-2">
                <h2 className="font-display text-lg font-bold text-fg">{section.title}</h2>
                <p className="text-fg-muted leading-relaxed">{section.body}</p>
              </section>
            ))}

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
