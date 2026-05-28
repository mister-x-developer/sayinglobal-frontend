'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Gift, Check, Copy, Users, ArrowRight, ExternalLink } from 'lucide-react';
import { AppNav } from '@/components/layout/AppNav';
import apiClient from '@/lib/api/client';
import { toast } from '@/components/ui/Toast';

interface ReferralCode {
  code: string;
  total_referrals: number;
  rewarded_referrals: number;
}

export default function ReferralPage() {
  const t = useTranslations();
  const [referral, setReferral] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    apiClient.get('/plans/referral/')
      .then((r) => setReferral(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth?ref=${referral?.code ?? ''}`
    : '';

  const copyCode = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.code).then(() => {
      setCopied(true);
      toast.success(t('plans.copied'));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setLinkCopied(true);
      toast.success(t('plans.copied'));
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const shareLink = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({
        title: 'SAYIN GLOBAL',
        text: t('plans.inviteSubtitle'),
        url: referralLink,
      }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1">
        <div className="container-page py-8 sm:py-10 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
                <Gift className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-eyebrow">{t('nav.profile')}</p>
                <h1 className="display-md mt-1">{t('plans.inviteFriends')}</h1>
              </div>
            </div>

            {loading ? (
              <div className="surface-elevated h-48 animate-pulse" />
            ) : !referral ? (
              <div className="surface-elevated p-8 text-center">
                <p className="text-fg-muted">{t('common.error')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="surface-elevated p-5 text-center">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary mb-3">
                      <Users className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <p className="font-display text-3xl font-black text-fg">{referral.total_referrals}</p>
                    <p className="mt-1 text-sm text-fg-muted">{t('plans.totalReferrals')}</p>
                  </div>
                  <div className="surface-elevated p-5 text-center">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success mb-3">
                      <Check className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <p className="font-display text-3xl font-black text-fg">{referral.rewarded_referrals}</p>
                    <p className="mt-1 text-sm text-fg-muted">{t('plans.rewarded')}</p>
                  </div>
                </div>

                {/* Referral code */}
                <div className="surface-elevated p-6">
                  <h2 className="display-sm mb-1">{t('plans.inviteFriends')}</h2>
                  <p className="text-sm text-fg-muted mb-5">{t('plans.inviteSubtitle')}</p>

                  {/* Code */}
                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-subtle">
                      {t('plans.copyCode')}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-xl border border-border bg-bg-subtle px-4 py-3 font-mono text-xl font-black tracking-[0.2em] text-fg">
                        {referral.code}
                      </div>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="btn btn-secondary btn-sm gap-2"
                      >
                        {copied ? <Check className="h-4 w-4 text-success" strokeWidth={2.5} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
                        {copied ? t('plans.copied') : t('plans.copyCode')}
                      </button>
                    </div>
                  </div>

                  {/* Link */}
                  <div className="mb-5">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-subtle">
                      Referral link
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 truncate rounded-xl border border-border bg-bg-subtle px-4 py-3 text-sm text-fg-muted font-mono">
                        {referralLink}
                      </div>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="btn btn-secondary btn-sm gap-2 shrink-0"
                      >
                        {linkCopied ? <Check className="h-4 w-4 text-success" strokeWidth={2.5} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={shareLink}
                    className="btn btn-primary w-full gap-2"
                  >
                    <ExternalLink className="h-4 w-4" strokeWidth={2} />
                    {t('common.share')}
                  </button>
                </div>

                {/* How it works */}
                <div className="surface-elevated p-6">
                  <h2 className="display-sm mb-4">{t('plans.systemTitle')}</h2>
                  <p className="text-sm text-fg-muted mb-4">{t('plans.systemDesc')}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-bg-subtle p-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-xs font-bold text-brand-primary">3</span>
                      <span className="text-sm text-fg">{t('plans.tier1')}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-bg-subtle p-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-xs font-bold text-brand-accent">7</span>
                      <span className="text-sm text-fg">{t('plans.tier2')}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-fg-subtle">{t('plans.referralHint')}</p>
                </div>

                <Link href="/plans" className="btn btn-secondary w-full gap-2">
                  {t('plans.viewPlans')}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
