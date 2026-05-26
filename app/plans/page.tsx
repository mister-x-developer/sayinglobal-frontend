'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Crown, Zap, Star, Gift, ArrowRight, Loader2, Tag, Users } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';
import { toast } from '@/components/ui/Toast';

interface Plan {
  id: string;
  name: string;
  name_uz?: string;
  name_ru?: string;
  name_en?: string;
  description_uz?: string;
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

const PLAN_ICONS = [Tag, Zap, Crown];
const PLAN_COLORS = [
  'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
  'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
  'from-amber-500/10 to-orange-500/10 border-amber-500/20',
];
const PLAN_ICON_COLORS = ['text-emerald-500', 'text-blue-500', 'text-amber-500'];

function formatPrice(uzs: number): string {
  if (uzs === 0) return "Bepul";
  return new Intl.NumberFormat('uz-UZ').format(uzs) + " so'm";
}

export default function PlansPage() {
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [myPlan, setMyPlan] = useState<MyPlan | null>(null);
  const [referral, setReferral] = useState<ReferralCode | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    // Load public plans
    apiClient.get('/plans/').then((r) => {
      if (alive) setPlans(r.data ?? []);
    }).catch(() => {});

    if (isAuthenticated) {
      // Load my plan
      apiClient.get('/plans/my/').then((r) => {
        if (alive) setMyPlan(r.data);
      }).catch(() => {});
      // Load referral code
      apiClient.get('/plans/referral/').then((r) => {
        if (alive) setReferral(r.data);
      }).catch(() => {});
    }

    setLoading(false);
    return () => { alive = false; };
  }, [isAuthenticated]);

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const r = await apiClient.post('/plans/promo/use/', { code: promoCode.trim().toUpperCase() });
      toast.success(r.data?.message ?? "Promo kod qo'llanildi!");
      setPromoCode('');
      // Refresh my plan
      const updated = await apiClient.get('/plans/my/');
      setMyPlan(updated.data);
    } catch (e: any) {
      const err = e?.response?.data?.error ?? 'Xatolik yuz berdi';
      const msgs: Record<string, string> = {
        invalid_code: "Noto'g'ri promo kod",
        code_expired_or_exhausted: "Promo kod muddati tugagan yoki tugab ketgan",
      };
      toast.error(msgs[err] ?? err);
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
            className="text-center"
          >
            <p className="text-eyebrow">Tariflar</p>
            <h1 className="display-lg mt-3">Sizga mos tarif tanlang</h1>
            <p className="mt-4 text-lg text-fg-muted max-w-xl mx-auto">
              Har oy yangilanadigan e'lon limitlari. Hech qanday yashirin to'lov yo'q.
            </p>
          </motion.div>

          {/* Current plan banner */}
          {isAuthenticated && myPlan && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-8 surface-elevated p-5 border-brand-primary/20 bg-brand-primary/4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-fg-muted">Joriy tarifingiz</p>
                  <p className="mt-1 text-xl font-bold text-fg">{myPlan.plan.name_uz ?? myPlan.plan.name}</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    Bu oy: <span className="font-semibold text-fg">{myPlan.monthly_listings_used}</span> / {myPlan.plan.monthly_listing_limit} e'lon yaratildi
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-fg-muted">Faol e'lonlar</p>
                    <p className="font-bold text-fg">{myPlan.plan.active_listing_limit} ta limit</p>
                  </div>
                  {myPlan.expires_at && (
                    <div className="text-right">
                      <p className="text-xs text-fg-muted">Tugash sanasi</p>
                      <p className="font-bold text-fg">{new Date(myPlan.expires_at).toLocaleDateString('uz-UZ')}</p>
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
                Tariflar yuklanmadi
              </div>
            ) : (
              plans.map((plan, i) => {
                const Icon = PLAN_ICONS[i % PLAN_ICONS.length];
                const colorClass = PLAN_COLORS[i % PLAN_COLORS.length];
                const iconColor = PLAN_ICON_COLORS[i % PLAN_ICON_COLORS.length];
                const isCurrent = myPlan?.plan.id === plan.id;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className={`relative surface-elevated bg-gradient-to-br ${colorClass} p-6 flex flex-col ${isCurrent ? 'ring-2 ring-brand-primary' : ''}`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-primary px-3 py-1 text-xs font-bold text-white">
                        Joriy tarif
                      </div>
                    )}
                    {plan.is_default && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fg px-3 py-1 text-xs font-bold text-bg">
                        Standart
                      </div>
                    )}

                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-elevated ${iconColor}`}>
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-fg">{plan.name_uz ?? plan.name}</h3>
                    {plan.description_uz && (
                      <p className="mt-1 text-sm text-fg-muted">{plan.description_uz}</p>
                    )}

                    <div className="mt-4">
                      <span className="text-3xl font-black text-fg">{formatPrice(plan.price_uzs)}</span>
                      {plan.price_uzs > 0 && <span className="text-sm text-fg-muted"> / {plan.duration_days} kun</span>}
                    </div>

                    {/* Referral notice */}
                    <div className="mt-3 rounded-xl bg-brand-accent/10 px-3 py-2 text-xs text-brand-accent font-semibold">
                      🎁 Hozircha referral orqali bepul. Tez orada to'lovga o'tadi!
                    </div>
                    {/* Referrals required */}
                    {plan.referrals_required > 0 && (
                      <div className="mt-2 flex items-center gap-2 rounded-xl bg-bg-subtle px-3 py-2 text-xs text-fg-muted">
                        <Users className="h-3.5 w-3.5 flex-shrink-0 text-brand-primary" strokeWidth={2} />
                        <span>
                          Bu tarifni olish uchun:{' '}
                          <strong className="text-fg">{plan.referrals_required} ta referral</strong>
                          {referral && (
                            <span className="ml-1 text-success">
                              ({referral.rewarded_referrals}/{plan.referrals_required} ✓)
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    <ul className="mt-5 space-y-2.5 flex-1">
                      <li className="flex items-center gap-2 text-sm text-fg">
                        <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                        Oyiga <strong>{plan.monthly_listing_limit}</strong> ta e'lon yaratish
                      </li>
                      <li className="flex items-center gap-2 text-sm text-fg">
                        <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                        Bir vaqtda <strong>{plan.active_listing_limit}</strong> ta faol e'lon
                      </li>
                      <li className="flex items-center gap-2 text-sm text-fg">
                        <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                        Xarita va GPS joylashuv
                      </li>
                      <li className="flex items-center gap-2 text-sm text-fg">
                        <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
                        Xabarlar va izohlar
                      </li>
                    </ul>

                    <div className="mt-6">
                      {!isAuthenticated ? (
                        <Link href="/auth" className="btn btn-primary w-full">
                          Kirish
                          <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        </Link>
                      ) : isCurrent ? (
                        <button disabled className="btn btn-secondary w-full opacity-60 cursor-not-allowed">
                          Joriy tarif
                        </button>
                      ) : plan.price_uzs === 0 ? (
                        <button disabled className="btn btn-secondary w-full opacity-60 cursor-not-allowed">
                          Bepul tarif
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            // Scroll to referral section
                            document.getElementById('referral-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="btn btn-primary w-full"
                        >
                          Referral orqali olish
                          <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        </button>
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
              <h2 className="display-sm">Promo kod</h2>
              <p className="mt-1 text-sm text-fg-muted">Promo kod orqali tarif yoqing</p>
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
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Qo\'llash'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Referral */}
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
                  <h2 className="display-sm">Do'stingizni taklif qiling</h2>
                  <p className="text-sm text-fg-muted">Har bir faol taklif uchun mukofot oling</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-border bg-bg-subtle px-4 py-3 font-mono text-lg font-bold tracking-widest text-fg">
                  {referral.code}
                </div>
                <button
                  onClick={copyReferral}
                  className="btn btn-secondary"
                >
                  {copied ? <Check className="h-4 w-4 text-success" /> : 'Nusxa'}
                </button>
              </div>
              <div className="mt-3 flex gap-6 text-sm text-fg-muted">
                <span>Jami taklif: <strong className="text-fg text-lg">{referral.total_referrals}</strong></span>
                <span>Mukofot olindi: <strong className="text-fg text-lg">{referral.rewarded_referrals}</strong></span>
              </div>
              <p className="mt-2 text-xs text-fg-muted">
                Standart uchun: 3 ta · Pro uchun: 7 ta mukofotlangan referral kerak
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
