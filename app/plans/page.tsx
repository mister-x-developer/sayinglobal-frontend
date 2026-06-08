'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Check, Crown, Zap, Gift, ArrowRight, Loader2, Tag, Users, Clock, BadgeCheck, Gem } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';
import { toast } from '@/components/ui/Toast';

interface Plan {
  id: string;
  name: string;
  name_uz?: string;
  name_uz_cyrl?: string;
  name_ru?: string;
  name_en?: string;
  description_uz?: string;
  description_uz_cyrl?: string;
  description_ru?: string;
  description_en?: string;
  monthly_listing_limit: number;
  active_listing_limit: number;
  price_uzs: number;
  price_usd: number;
  duration_days: number;
  is_default: boolean;
  order: number;
  referrals_required: number;
  is_coming_soon?: boolean;
}

interface MyPlan {
  plan: Plan;
  started_at: string;
  expires_at: string | null;
  monthly_listings_used: number;
  can_create_listing: boolean;
  limit_reason: string | null;
}

interface ReferralCode {
  code: string;
  total_referrals: number;
  rewarded_referrals: number;
}

const PLAN_ICONS = [Tag, Zap, BadgeCheck, Crown, Gem];
const PLAN_ICON_COLORS = ['text-emerald-500', 'text-blue-500', 'text-cyan-500', 'text-amber-500', 'text-fuchsia-500'];

function getPlanName(plan: Plan, locale: string): string {
  if (locale === 'uz-cyrl' && plan.name_uz_cyrl) return plan.name_uz_cyrl;
  if (locale === 'ru' && plan.name_ru) return plan.name_ru;
  if (locale === 'en' && plan.name_en) return plan.name_en;
  return plan.name_uz || plan.name;
}

function getPlanDesc(plan: Plan, locale: string): string {
  if (locale === 'uz-cyrl' && plan.description_uz_cyrl) return plan.description_uz_cyrl;
  if (locale === 'ru' && plan.description_ru) return plan.description_ru;
  if (locale === 'en' && plan.description_en) return plan.description_en;
  return plan.description_uz || '';
}

export default function PlansPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [myPlan, setMyPlan] = useState<MyPlan | null>(null);
  const [referral, setReferral] = useState<ReferralCode | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState<string | null>(null);
  const [planMsg, setPlanMsg] = useState<{ planId: string; ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const loadPlans = apiClient.get('/plans/').then((r) => {
      if (alive) setPlans(r.data ?? []);
    }).catch(() => {});

    const loadAuth = isAuthenticated ? Promise.all([
      apiClient.get('/plans/my/').then((r) => { if (alive) setMyPlan(r.data); }).catch(() => {}),
      apiClient.get('/plans/referral/').then((r) => { if (alive) setReferral(r.data); }).catch(() => {}),
    ]) : Promise.resolve();

    Promise.all([loadPlans, loadAuth]).finally(() => {
      if (alive) setLoading(false);
    });

    return () => { alive = false; };
  }, [isAuthenticated]);

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const r = await apiClient.post('/plans/promo/use/', { code: promoCode.trim().toUpperCase() });
      toast.success(r.data?.message ?? t('plans.promoApplied'));
      setPromoCode('');
      const updated = await apiClient.get('/plans/my/');
      setMyPlan(updated.data);
    } catch (e: any) {
      const err = e?.response?.data?.error ?? '';
      const msgs: Record<string, string> = {
        invalid_code: t('plans.promoInvalid'),
        code_expired_or_exhausted: t('plans.promoExpired'),
      };
      toast.error(msgs[err] ?? t('plans.promoError'));
    } finally {
      setPromoLoading(false);
    }
  };

  const copyReferral = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const claimWithReferral = async (plan: Plan) => {
    if (!referral) return;
    setPlanLoading(plan.id);
    setPlanMsg(null);

    const needed = plan.referrals_required;
    const have = referral.rewarded_referrals;

    if (have < needed) {
      const more = needed - have;
      const msg = t('plans.notEnoughReferrals')
        .replace('{n}', String(more))
        .replace('{have}', String(have))
        .replace('{needed}', String(needed));
      setPlanMsg({ planId: plan.id, ok: false, text: msg });
      setPlanLoading(null);
      return;
    }

    try {
      await apiClient.post('/plans/referral/claim/', { plan_id: plan.id });
      const updated = await apiClient.get('/plans/my/');
      setMyPlan(updated.data);
      const msg = t('plans.planActivated').replace('{name}', getPlanName(plan, locale));
      setPlanMsg({ planId: plan.id, ok: true, text: msg });
    } catch (e: any) {
      const err = e?.response?.data?.error ?? '';
      const msg = err === 'insufficient_referrals'
        ? t('plans.insufficientReferrals')
        : t('plans.errorTryAgain');
      setPlanMsg({ planId: plan.id, ok: false, text: msg });
    } finally {
      setPlanLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1">
        <div className="container-page py-10 sm:py-14">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-eyebrow">{t('plans.title')}</p>
            <h1 className="display-lg mt-3">{t('plans.choosePlan')}</h1>
            <p className="mt-4 text-lg text-fg-muted">{t('plans.subtitle')}</p>
          </motion.div>

          {/* Current plan banner */}
          {isAuthenticated && myPlan && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-8 surface-elevated p-5 border border-brand-primary/20 bg-brand-primary/4 rounded-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                    {t('plans.currentPlan')}
                  </p>
                  <p className="mt-1 text-2xl font-black text-fg">{getPlanName(myPlan.plan, locale)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 w-32 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all"
                        style={{ width: `${Math.min(100, (myPlan.monthly_listings_used / myPlan.plan.monthly_listing_limit) * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-fg-muted">
                      {myPlan.monthly_listings_used}/{myPlan.plan.monthly_listing_limit}{' '}
                      {t('plans.listingsThisMonth')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-fg-muted">{t('plans.activeLimit')}</p>
                    <p className="font-bold text-fg text-lg">{myPlan.plan.active_listing_limit}</p>
                  </div>
                  {myPlan.expires_at && (
                    <div className="text-center">
                      <p className="text-xs text-fg-muted">{t('plans.until')}</p>
                      <p className="font-bold text-fg">{new Date(myPlan.expires_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Plans grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="surface-elevated h-64 animate-pulse" />
              ))
            ) : plans.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-fg-muted">
                {t('marketplace.noResults')}
              </div>
            ) : (
              plans.map((plan, i) => {
                const Icon = PLAN_ICONS[i % PLAN_ICONS.length];
                const iconColor = PLAN_ICON_COLORS[i % PLAN_ICON_COLORS.length];
                const isCurrent = myPlan
                  ? (myPlan.plan.name === plan.name && myPlan.plan.monthly_listing_limit === plan.monthly_listing_limit)
                  : false;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className={`relative surface-elevated p-6 flex flex-col ${isCurrent ? 'ring-2 ring-brand-primary' : ''}`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-primary px-3 py-1 text-xs font-bold text-white">
                        {t('plans.currentPlanBadge')}
                      </div>
                    )}
                    {plan.is_default && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fg px-3 py-1 text-xs font-bold text-bg">
                        {t('plans.standardBadge')}
                      </div>
                    )}

                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-elevated ${iconColor}`}>
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-fg">{getPlanName(plan, locale)}</h3>
                    {getPlanDesc(plan, locale) && (
                      <p className="mt-1 text-sm text-fg-muted">{getPlanDesc(plan, locale)}</p>
                    )}

                    <div className="mt-4">
                      {plan.is_coming_soon ? (
                        <span className="text-xl font-bold text-fg">
                          {t('plans.flexiblePricing') ?? 'Moslashuvchan narx'}
                        </span>
                      ) : (
                        <>
                          <span className="text-3xl font-black text-fg">
                            {plan.price_uzs === 0
                              ? t('plans.free')
                              : new Intl.NumberFormat('uz-UZ').format(plan.price_uzs) + " so'm"}
                          </span>
                          {plan.price_uzs > 0 && (
                            <span className="text-sm text-fg-muted"> / {plan.duration_days} {t('plans.days')}</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Referral notice — only for paid plans */}
                    {plan.price_uzs > 0 && !plan.is_coming_soon && plan.referrals_required > 0 && (
                      <div className="mt-3 rounded-xl bg-brand-accent/10 px-3 py-2 text-xs text-brand-accent font-semibold flex items-center justify-between">
                        <span>🎁 {t('plans.referralNotice')}</span>
                        <span className="bg-brand-accent text-white px-2 py-0.5 rounded-full text-[10px]">
                          {plan.referrals_required} ta kerak
                        </span>
                      </div>
                    )}

                    {/* Referrals required — with progress bar */}
                    {plan.referrals_required > 0 && !plan.is_coming_soon && (
                      <div className="mt-2 rounded-xl bg-bg-subtle border border-border px-3 py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-brand-primary" strokeWidth={2} />
                            {t('plans.referralsNeeded')}
                          </span>
                          <span className="text-xs font-bold text-fg">
                            {referral ? referral.rewarded_referrals : 0}/{plan.referrals_required}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-primary transition-all duration-500"
                            style={{ width: `${Math.min(100, ((referral?.rewarded_referrals ?? 0) / plan.referrals_required) * 100)}%` }}
                          />
                        </div>
                        {referral && referral.rewarded_referrals >= plan.referrals_required && (
                          <p className="mt-1 text-[10px] font-semibold text-success">
                            ✓ {t('plans.enoughReferrals')}
                          </p>
                        )}
                      </div>
                    )}

                    <ul className="mt-5 space-y-2.5 flex-1">
                      {plan.is_coming_soon ? (
                        <li className="flex items-center gap-2 text-sm text-fg">
                          <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                          {t('plans.flexibleLimits') ?? 'Moslashuvchan limitlar'}
                        </li>
                      ) : (
                        <>
                          <li className="flex items-center gap-2 text-sm text-fg">
                            <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                            {t('plans.listingsPerMonth', { n: plan.monthly_listing_limit })}
                          </li>
                          <li className="flex items-center gap-2 text-sm text-fg">
                            <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                            {t('plans.activeAtOnce', { n: plan.active_listing_limit })}
                          </li>
                        </>
                      )}
                      <li className="flex items-center gap-2 text-sm text-fg">
                        <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                        {t('plans.mapGps')}
                      </li>
                      <li className="flex items-center gap-2 text-sm text-fg">
                        <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                        {t('plans.messagesComments')}
                      </li>
                    </ul>

                    <div className="mt-6">
                      {!isAuthenticated ? (
                        <Link href="/auth" className="btn btn-primary w-full">
                          {t('plans.signInToStart')}
                          <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        </Link>
                      ) : plan.is_coming_soon ? (
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-primary/20 via-brand-accent/20 to-brand-primary/20 p-[1px]">
                          <div className="flex h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-bg-elevated/80 backdrop-blur-sm text-sm font-bold text-fg-muted cursor-not-allowed">
                            <Clock className="h-4 w-4 text-brand-accent animate-pulse" strokeWidth={2.5} />
                            {t('plans.comingSoon')}
                          </div>
                        </div>
                      ) : isCurrent ? (
                        <button disabled className="btn btn-secondary w-full opacity-60 cursor-not-allowed">
                          {t('plans.currentPlanBadge')}
                        </button>
                      ) : plan.price_uzs === 0 ? (
                        <button disabled className="btn btn-secondary w-full opacity-60 cursor-not-allowed">
                          {t('plans.freePlan')}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => claimWithReferral(plan)}
                            disabled={planLoading === plan.id}
                            className="btn btn-primary w-full"
                          >
                            {planLoading === plan.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Gift className="h-4 w-4" strokeWidth={2} />}
                            {t('plans.claimWithReferrals')}
                            <ArrowRight className="h-4 w-4" strokeWidth={2} />
                          </button>
                          {planMsg && planMsg.planId === plan.id && (
                            <p className={`text-xs font-semibold text-center ${planMsg.ok ? 'text-success' : 'text-danger'}`}>
                              {planMsg.ok ? '✓ ' : '✗ '}{planMsg.text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Promo code */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-10 surface-elevated p-6"
            >
              <h2 className="display-sm">{t('plans.promoCode')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('plans.promoSubtitle')}</p>
              <div className="mt-4 flex gap-3">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="PROMO-KOD"
                  className="input-base flex-1 font-mono tracking-widest"
                  onKeyDown={(e) => e.key === 'Enter' && handlePromo()}
                />
                <button
                  onClick={handlePromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="btn btn-primary"
                >
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('plans.promoApply')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Referral section */}
          {isAuthenticated && referral && (
            <motion.div
              id="referral-section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-6 surface-elevated p-6 border-brand-accent/20 bg-brand-accent/4"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/12 text-brand-accent">
                  <Gift className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="display-sm">{t('plans.inviteFriends')}</h2>
                  <p className="text-sm text-fg-muted">{t('plans.inviteSubtitle')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-border bg-bg-subtle px-4 py-3 font-mono text-lg font-bold tracking-widest text-fg">
                  {referral.code}
                </div>
                <button onClick={copyReferral} className="btn btn-secondary">
                  {copied ? <Check className="h-4 w-4 text-success" /> : t('plans.copyCode')}
                </button>
              </div>
              <div className="mt-3 flex gap-6 text-sm text-fg-muted">
                <span>
                  {t('plans.totalReferrals')}:{' '}
                  <strong className="text-fg text-lg">{referral.total_referrals}</strong>
                </span>
                <span>
                  {t('plans.rewarded')}:{' '}
                  <strong className="text-fg text-lg">{referral.rewarded_referrals}</strong>
                </span>
              </div>
              <p className="mt-2 text-xs text-fg-muted">{t('plans.referralHint')}</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
