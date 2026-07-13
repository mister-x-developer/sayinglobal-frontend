'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles, ArrowLeft, Clock } from 'lucide-react';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';
import { UserAILogo } from '@/components/ai/AILogos';

export default function ChatAIPage() {
  const t = useTranslations();
  const router = useRouter();

  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    const isAdmin = user?.is_staff || user?.is_admin || user?.is_admin_account;
    if (isAdmin) {
      router.replace('/dashboard');
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated || !isAuthenticated || !mounted) return null;

  const AILogo = UserAILogo;
  const aiTitle = t('ai.title');
  const aiSubtitle = t('ai.subtitle');
  const comingSoonText = t('ai.comingSoon');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg-elevated pt-safe pb-safe">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg px-4">
        <button
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg hover:bg-bg-subtle"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 border border-brand-primary/20 shadow-sm">
          <AILogo size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-fg flex items-center gap-1.5">
            {aiTitle}
            <Sparkles className="h-4 w-4 text-brand-primary" />
          </p>
          <p className="text-xs text-fg-subtle truncate">{aiSubtitle}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-canvas text-center">
        <div className="mb-6 flex items-center justify-center h-24 w-24 rounded-full bg-brand-primary/10 text-brand-primary">
          <Clock className="h-12 w-12" strokeWidth={1.5} />
        </div>
        
        <h2 className="text-2xl font-bold text-fg mb-3">{comingSoonText}</h2>
        <p className="text-[15px] text-fg-muted max-w-sm mx-auto leading-relaxed">
          {t('ai.subtitle')}
        </p>
        
        <button
          onClick={() => router.back()}
          className="mt-8 px-6 py-2.5 rounded-full bg-bg-elevated border border-border text-fg font-medium shadow-sm active:scale-95 transition-transform"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}
