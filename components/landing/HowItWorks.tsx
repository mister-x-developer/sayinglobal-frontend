'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { MessageSquareText, UserCircle2, HandCoins } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export function HowItWorks() {
  const t = useTranslations();

  const steps = [
    {
      icon: MessageSquareText,
      title: t('landing.step1Title'),
      description: t('landing.step1Description'),
      number: '01',
    },
    {
      icon: UserCircle2,
      title: t('landing.step2Title'),
      description: t('landing.step2Description'),
      number: '02',
    },
    {
      icon: HandCoins,
      title: t('landing.step3Title'),
      description: t('landing.step3Description'),
      number: '03',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-28 sm:py-36 lg:py-44">
      {/* Subtle section divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-eyebrow">01</span>
          <h2 className="display-md mt-4 text-balance">
            {t('landing.howItWorksTitle')}
          </h2>
          <p className="mt-5 text-pretty text-lg text-fg-muted">
            {t('landing.howItWorksSubtitle')}
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-20 grid gap-6 md:grid-cols-3 md:gap-8 lg:gap-10"
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.number} variants={item}>
                <div className="surface-elevated group h-full p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-10">
                  <div className="flex items-start justify-between">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <span className="font-display text-6xl font-extrabold text-fg-subtle/20 transition-colors group-hover:text-fg-subtle/30">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="display-sm mt-8 text-xl">{step.title}</h3>
                  <p className="mt-4 leading-relaxed text-fg-muted">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
