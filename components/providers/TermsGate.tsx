'use client';

/**
 * Terms acceptance gate.
 * After accepting terms: shows referral code input (optional), then plans page link.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ShieldAlert, CheckCircle2, Loader2, Gift, ArrowRight, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { usersApi } from '@/lib/api/users';
import apiClient from '@/lib/api/client';

const SKIP_PATHS = ['/', '/auth'];

export function TermsGate() {
  const t = useTranslations();
  const pathname = usePathname() || '/';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [step, setStep] = useState<'terms' | 'referral' | 'plans'>('terms');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralMsg, setReferralMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const shouldEvaluate = useMemo(() => {
    if (!isAuthenticated) return false;
    if (SKIP_PATHS.includes(pathname)) return false;
    if (pathname.startsWith('/admin')) return false;
    if (user?.is_admin) return false;
    return true;
  }, [isAuthenticated, pathname, user?.is_admin]);

  useEffect(() => {
    if (!shouldEvaluate) { setOpen(false); return; }
    let alive = true;
    if (user?.terms_accepted_at) { setOpen(false); return; }
    usersApi.getTerms().then((data) => {
      if (!alive || !data) return;
      if (!data.accepted) { setStep('terms'); setOpen(true); }
      else { updateUser({ terms_accepted_at: data.accepted_at ?? undefined }); setOpen(false); }
    }).catch(() => {});
    return () => { alive = false; };
  }, [shouldEvaluate, user?.terms_accepted_at, updateUser]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const acceptTerms = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await usersApi.acceptTerms();
      updateUser({ terms_accepted_at: result?.accepted_at ?? new Date().toISOString() });
      setStep('referral'); // Move to referral step
    } catch {
      // keep open
    } finally {
      setSubmitting(false);
    }
  };

  const submitReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) { setStep('plans'); return; }
    setReferralLoading(true);
    try {
      const res = await apiClient.post('/plans/referral/use/', { code });
      setReferralMsg({ ok: true, text: res.data?.message ?? "Referral kod qo'llanildi!" });
      setTimeout(() => setStep('plans'), 1500);
    } catch (e: any) {
      const err = e?.response?.data?.error ?? 'error';
      const msgs: Record<string, string> = {
        invalid_code: "Noto'g'ri referral kod",
        cannot_use_own_code: "O'z kodingizni ishlatib bo'lmaydi",
        already_used_referral: "Referral kod allaqachon ishlatilgan",
      };
      setReferralMsg({ ok: false, text: msgs[err] ?? err });
    } finally {
      setReferralLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 px-4 pb-4 pt-10 sm:items-center sm:pb-10"
      role="dialog" aria-modal="true">
      <div className="surface-elevated w-full max-w-lg overflow-hidden">

        {/* STEP 1: Terms */}
        {step === 'terms' && (
          <>
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent">
                  <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="display-sm">{t('terms.title')}</h2>
                  <p className="mt-0.5 text-xs text-fg-subtle">{t('terms.subtitle')}</p>
                </div>
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-6 py-5 text-sm leading-relaxed text-fg">
              <p className="text-fg-muted">{t('terms.intro')}</p>
              <ol className="mt-4 space-y-3 text-fg">
                {[1,2,3,4].map((n) => (
                  <li key={n} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-bold text-fg-muted">{n}</span>
                    <span>{t(`terms.point${n}` as any)}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-xl bg-bg-subtle p-4 text-xs text-fg-muted">{t('terms.disclaimer')}</p>
            </div>
            <div className="border-t border-border px-6 py-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary" />
                <span className="text-sm text-fg">{t('terms.checkboxLabel')}</span>
              </label>
              <button type="button" onClick={acceptTerms} disabled={!checked || submitting}
                className="btn btn-primary btn-lg mt-4 w-full">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />{t('common.loading')}</> : <><CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />{t('terms.accept')}</>}
              </button>
            </div>
          </>
        )}

        {/* STEP 2: Referral code */}
        {step === 'referral' && (
          <>
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent">
                  <Gift className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="display-sm">Referral kod</h2>
                  <p className="mt-0.5 text-xs text-fg-subtle">Agar do'stingiz sizga kod bergan bo'lsa, kiriting</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-fg-muted mb-4">
                Referral kod orqali platformaga qo'shilsangiz, do'stingiz mukofot oladi. Kod yo'q bo'lsa, o'tkazib yuboring.
              </p>
              <input
                value={referralCode}
                onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralMsg(null); }}
                placeholder="REFERRAL-KOD"
                className="input-base w-full font-mono tracking-widest text-center text-lg"
                onKeyDown={(e) => e.key === 'Enter' && submitReferral()}
              />
              {referralMsg && (
                <p className={`mt-2 text-sm font-medium ${referralMsg.ok ? 'text-success' : 'text-danger'}`}>
                  {referralMsg.text}
                </p>
              )}
            </div>
            <div className="border-t border-border px-6 py-4 flex gap-3">
              <button type="button" onClick={() => setStep('plans')}
                className="btn btn-secondary flex-1">
                O'tkazib yuborish
              </button>
              <button type="button" onClick={submitReferral} disabled={referralLoading}
                className="btn btn-primary flex-1">
                {referralLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tasdiqlash'}
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Plans */}
        {step === 'plans' && (
          <>
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="display-sm">Tariflar</h2>
                <button type="button" onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle">
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <p className="mt-1 text-sm text-fg-muted">Platformaga xush kelibsiz! Tariflarimiz bilan tanishing.</p>
            </div>
            <div className="px-6 py-6 space-y-3">
              <div className="rounded-xl bg-success/10 border border-success/20 p-4">
                <p className="text-sm font-semibold text-success">✓ Shartlarga rozisiz!</p>
                <p className="text-xs text-fg-muted mt-1">Hozirda barcha tariflar referral tizimi orqali bepul. Tez orada pullik bo'ladi.</p>
              </div>
              <div className="rounded-xl bg-brand-primary/8 border border-brand-primary/20 p-4">
                <p className="text-sm font-semibold text-fg">🎁 Referral tizimi</p>
                <p className="text-xs text-fg-muted mt-1">Do'stlaringizni taklif qiling → ular e'lon joylashganda siz yuqori tarif olasiz.</p>
                <ul className="mt-2 space-y-1 text-xs text-fg-muted">
                  <li>• 3 ta referral → Standart tarif (49,000 so'm/oy)</li>
                  <li>• 7 ta referral → Pro tarif (99,000 so'm/oy)</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary flex-1">
                Keyinroq
              </button>
              <a href="/plans" onClick={() => setOpen(false)} className="btn btn-primary flex-1 justify-center">
                Tariflarni ko'rish
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
