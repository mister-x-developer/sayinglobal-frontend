'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, ArrowLeft } from 'lucide-react';
import { listingsApi } from '@/lib/api/listings';

export default function ConfirmPurchasePage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCode = searchParams.get('code') || '';
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [score, setScore] = useState<number>(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!code.trim()) {
      setError(t('listings.codeRequired') ?? 'Kod kiritish shart');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await listingsApi.confirmPurchase(code.trim(), score, review.trim() || undefined);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || t('errors.generic') || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/12">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">{t('listings.purchaseConfirmedTitle') ?? 'Sotib olinganligi tasdiqlandi!'}</h1>
          <p className="mt-2 text-fg-muted">{t('listings.purchaseConfirmedBody') ?? 'Rahmat! Sotuvchining ishonch bali yangilandi.'}</p>
          <button onClick={() => router.push('/')} className="btn btn-primary mt-6">
            {t('common.goHome') ?? 'Bosh sahifaga'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-fg-muted mb-6">
        <ArrowLeft className="h-4 w-4" /> {t('common.back') ?? 'Orqaga'}
      </button>

      <div className="surface-elevated p-6 rounded-2xl">
        <h1 className="text-2xl font-semibold">{t('listings.confirmPurchaseTitle') ?? 'Xaridni tasdiqlash'}</h1>
        <p className="text-sm text-fg-muted mt-1">{t('listings.confirmPurchaseDesc') ?? 'Sotuvchi bergan kodni kiriting va ixtiyoriy ravishda 1-5 yulduz baho qo\'ying.'}</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-fg-subtle">{t('listings.confirmationCode') ?? 'Tasdiqlash kodi'}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="A1B2C3D4"
              className="input-base w-full mt-1 font-mono tracking-widest text-lg"
              maxLength={12}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg-subtle">{t('listings.yourRating') ?? 'Sizning bahoingiz (1-5 yulduz)'}</label>
            <div className="flex gap-2 mt-2">
              {[1,2,3,4,5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScore(s)}
                  className={`flex-1 py-3 rounded-xl border transition ${score === s ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-border hover:bg-bg-subtle hover:text-fg'}`}
                >
                  <div className="flex justify-center">
                    {Array.from({ length: s }).map((_, i) => (
                      <Star key={i} className="h-5 w-5" fill="currentColor" />
                    ))}
                  </div>
                  <div className="text-xs mt-1">{s}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-fg-subtle">{t('listings.reviewOptional') ?? 'Izoh (ixtiyoriy)'}</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={t('listings.reviewPlaceholder') ?? 'Mahsulot sifati, yetkazib berish haqida...'}
              className="input-base w-full mt-1 h-24 resize-y"
              maxLength={500}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={loading || !code}
          className="btn btn-primary w-full mt-6 disabled:opacity-60"
        >
          {loading ? (t('common.loading') ?? 'Yuklanmoqda...') : (t('listings.confirmPurchase') ?? 'Tasdiqlash')}
        </button>

        <p className="text-[10px] text-center text-fg-subtle mt-3">
          {t('listings.confirmNote') ?? 'Tasdiqlashdan keyin sotuvchi ishonch bali oladi va e\'lon statistikasida hisobga olinadi.'}
        </p>
      </div>
    </div>
  );
}
