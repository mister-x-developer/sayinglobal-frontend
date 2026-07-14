'use client';

import { useTranslations } from 'next-intl';
import { UserAILogo } from '@/components/ai/AILogos';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChatAIPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/dashboard"
          className="btn btn-ghost inline-flex items-center gap-2 text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          {t('common.back')}
        </Link>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        <div className="h-20 w-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-brand-primary/5 relative">
          <UserAILogo className="w-10 h-10 text-brand-primary" />
          <div className="absolute -top-2 -right-2 bg-brand-accent rounded-full p-1.5 shadow-md animate-pulse">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold mb-3 text-fg">
          {t('ai.title')}
        </h1>
        
        <p className="text-fg-muted text-lg mb-8 text-balance">
          {t('ai.subtitle')}
        </p>
        
        <div className="bg-bg-elevated border border-border rounded-2xl p-6 w-full shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-brand-primary">
            {/* 4 languages as requested */}
            Tez orada • Скоро • Coming Soon • Жакында
          </h2>
          <p className="text-sm text-fg-subtle">
            Aqlli yordamchi hozirda tayyorlanmoqda. U tez orada sizga xizmat ko'rsatishni boshlaydi!
          </p>
        </div>
      </div>
    </div>
  );
}
