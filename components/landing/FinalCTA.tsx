'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export function FinalCTA() {
  const t = useTranslations();

  return (
    <section className="relative pb-32 pt-20 sm:pb-40 lg:pb-48">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-border bg-bg-elevated p-12 text-center sm:p-20 lg:p-24"
        >
          {/* Atmospheric orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgb(31 122 82 / 0.4), transparent 70%)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgb(0 184 159 / 0.35), transparent 70%)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgb(31 122 82 / 0.06), transparent 60%)',
            }}
          />

          <div className="relative">
            <div className="mx-auto mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <ShieldCheck className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <h2 className="display-lg text-balance">
              {t('landing.finalCtaTitle')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-fg-muted">
              {t('landing.finalCtaSubtitle')}
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth" className="btn btn-primary btn-lg group w-full sm:w-auto">
                {t('landing.ctaPrimary')}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={2.25}
                />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
