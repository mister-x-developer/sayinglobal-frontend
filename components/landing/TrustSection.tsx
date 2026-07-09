'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Star, UsersRound, MessageSquareText } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function TrustSection() {
  const t = useTranslations();

  const features = [
    {
      icon: ShieldCheck,
      title: t('landing.trustFeature1Title'),
      description: t('landing.trustFeature1Description'),
      tone: 'bg-brand-accent/12 text-brand-accent',
    },
    {
      icon: Star,
      title: t('landing.trustFeature2Title'),
      description: t('landing.trustFeature2Description'),
      tone: 'bg-warning/12 text-warning',
    },
    {
      icon: UsersRound,
      title: t('landing.trustFeature3Title'),
      description: t('landing.trustFeature3Description'),
      tone: 'bg-brand-primary/10 text-brand-primary',
    },
    {
      icon: MessageSquareText,
      title: t('landing.trustFeature4Title'),
      description: t('landing.trustFeature4Description'),
      tone: 'bg-info/12 text-info',
    },
  ];

  return (
    <section className="relative py-28 sm:py-36 lg:py-44">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-eyebrow">03</span>
          <h2 className="display-md mt-4 text-balance">
            {t('landing.trustTitle')}
          </h2>
          <p className="mt-5 text-pretty text-lg text-fg-muted">
            {t('landing.trustSubtitle')}
          </p>
        </div>

        <motion.div
          data-motion
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div data-motion key={f.title} variants={item}>
                <div className="surface-elevated group relative h-full overflow-hidden p-7 transition-all duration-400 hover:-translate-y-1 hover:shadow-lift sm:p-8">
                  <div className="absolute inset-0 border border-transparent transition-colors duration-400 group-hover:border-fg-muted/10 rounded-2xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/[0.02] dark:from-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none rounded-2xl" />
                  
                  <div className={`relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-md ${f.tone}`}>
                    <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
                  </div>
                  <h3 className="relative z-10 mt-6 font-display text-lg font-semibold text-fg transition-colors duration-300">{f.title}</h3>
                  <p className="relative z-10 mt-3 leading-relaxed text-fg-muted">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
