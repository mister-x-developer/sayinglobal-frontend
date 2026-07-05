'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AppNav } from '@/components/layout/AppNav';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertCircle, Zap, Shield, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { plansApi, type UserPlan, type Plan } from '@/lib/api/plans';
import { toast } from '@/components/ui/Toast';

export default function SubscriptionsPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [myPlan, setMyPlan] = useState<UserPlan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planData, allPlans] = await Promise.all([
        plansApi.getMyPlan().catch(() => null),
        plansApi.getPlans().catch(() => []),
      ]);
      setMyPlan(planData);
      setPlans(allPlans);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      await plansApi.usePromoCode(promoCode.trim());
      toast.success(t('success.saved') || 'Promo code applied!');
      setPromoCode('');
      fetchData(); // refresh plan
    } catch (e: any) {
      toast.error(e.message || 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <AppNav />
      <main className="flex-1">
        <div className="container-page py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div>
              <p className="text-eyebrow">{t('profile.subscriptions')}</p>
              <h1 className="display-sm mt-2">{t('plans.currentPlan')}</h1>
            </div>

            {/* Current Plan Card */}
            {myPlan ? (
              <div className="surface-elevated p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-full -z-0" />
                <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                        <Shield className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{myPlan.plan.name_uz || myPlan.plan.name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-sm text-fg-subtle">
                          {myPlan.is_active ? (
                            <Badge variant="success" size="sm">Faol</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">Faol emas</Badge>
                          )}
                          <span>
                            {myPlan.expires_at 
                              ? `Tugaydi: ${new Date(myPlan.expires_at).toLocaleDateString()}` 
                              : 'Muddatsiz'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-fg-muted max-w-md">
                      {myPlan.plan.description_uz || myPlan.plan.description}
                    </p>
                  </div>

                  {/* Limits */}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-4 bg-bg-subtle">
                      <div className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">
                        {t('plans.monthlyLimit')}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-fg">{myPlan.monthly_listings_used}</span>
                        <span className="text-sm font-medium text-fg-muted">/ {myPlan.plan.monthly_listing_limit}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-border mt-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-primary transition-all" 
                          style={{ width: `${Math.min(100, (myPlan.monthly_listings_used / myPlan.plan.monthly_listing_limit) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4 bg-bg-subtle">
                      <div className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">
                        {t('plans.activeLimit')}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-fg">Maks</span>
                        <span className="text-sm font-medium text-fg-muted">/ {myPlan.plan.active_listing_limit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features list */}
                <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 text-sm font-medium">
                  {myPlan.plan.is_wholesale_allowed && (
                    <span className="flex items-center gap-1.5 text-success">
                      <CheckCircle2 className="h-4 w-4" /> {t('plans.wholesale')}
                    </span>
                  )}
                  {myPlan.plan.can_bump_listings && (
                    <span className="flex items-center gap-1.5 text-brand-primary">
                      <Zap className="h-4 w-4" /> Oyiga {myPlan.plan.monthly_bump_limit} marta ko'tarish
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="surface-elevated p-8 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-fg-muted mb-3" />
                <p className="text-fg-muted">Tarif ma'lumotlari topilmadi.</p>
              </div>
            )}

            {/* Promo code */}
            <div className="surface-elevated p-6 sm:p-8">
              <h3 className="text-lg font-bold">{t('plans.promoCode')}</h3>
              <form onSubmit={handlePromo} className="mt-4 flex gap-3 max-w-md">
                <input 
                  type="text" 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value)} 
                  className="input-base flex-1" 
                  placeholder="PROMO-KOD" 
                />
                <button type="submit" disabled={promoLoading || !promoCode} className="btn btn-primary">
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
                </button>
              </form>
            </div>

            {/* Available Plans */}
            <div className="pt-8">
              <h2 className="display-sm mb-6">{t('plans.upgrade')}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((p) => (
                  <div key={p.id} className="surface-elevated p-6 flex flex-col relative group hover:border-brand-primary/50 transition-colors">
                    {p.id === myPlan?.plan?.id && (
                      <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                        Joriy
                      </div>
                    )}
                    <h3 className="text-lg font-bold">{p.name_uz || p.name}</h3>
                    <div className="mt-2 text-3xl font-black tracking-tight text-brand-primary">
                      {Number(p.price_uzs) === 0 ? 'Bepul' : `${Number(p.price_uzs).toLocaleString()} UZS`}
                    </div>
                    <p className="text-sm text-fg-subtle mt-1 mb-6">/ {p.duration_days} kun</p>
                    
                    <ul className="space-y-3 text-sm flex-1 mb-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-primary mt-0.5 shrink-0" />
                        <span>Oylik chegara: {p.monthly_listing_limit} e'lon</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-primary mt-0.5 shrink-0" />
                        <span>Faol e'lonlar: {p.active_listing_limit} ta</span>
                      </li>
                      {p.is_wholesale_allowed && (
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-primary mt-0.5 shrink-0" />
                          <span>Ulgurji savdoga ruxsat</span>
                        </li>
                      )}
                      {p.can_bump_listings && (
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-brand-primary mt-0.5 shrink-0" />
                          <span>E'lonni tez-tez tepaga chiqarish</span>
                        </li>
                      )}
                    </ul>

                    <button 
                      disabled={p.id === myPlan?.plan?.id}
                      className={`btn w-full ${p.id === myPlan?.plan?.id ? 'btn-secondary opacity-50' : 'btn-primary'}`}
                    >
                      {p.id === myPlan?.plan?.id ? 'Hozirgi tarifingiz' : 'Sotib olish (Tez kunda)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
