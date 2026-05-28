'use client';

import { useTranslations } from 'next-intl';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations();

  const sections = [
    {
      title: t('privacy.dataCollectionTitle' as any) ?? 'Ma\'lumotlar to\'plash',
      body: t('privacy.dataCollectionBody' as any) ?? 'Biz faqat platformadan foydalanish uchun zarur bo\'lgan ma\'lumotlarni to\'playmiz: telefon raqami (Telegram orqali), ism, joylashuv (e\'lon uchun), va platforma faoliyati.',
    },
    {
      title: t('privacy.dataUsageTitle' as any) ?? 'Ma\'lumotlardan foydalanish',
      body: t('privacy.dataUsageBody' as any) ?? 'Ma\'lumotlaringiz faqat platforma xizmatlarini ko\'rsatish uchun ishlatiladi. Uchinchi tomonlarga sotilmaydi yoki ulashilmaydi.',
    },
    {
      title: t('privacy.locationTitle' as any) ?? 'Joylashuv ma\'lumotlari',
      body: t('privacy.locationBody' as any) ?? 'Joylashuv ma\'lumotlari faqat yaqin atrofdagi e\'lonlarni ko\'rsatish uchun ishlatiladi. Aniq koordinatalar foydalanuvchiga ko\'rsatilmaydi.',
    },
    {
      title: t('privacy.securityTitle' as any) ?? 'Xavfsizlik',
      body: t('privacy.securityBody' as any) ?? 'Barcha ma\'lumotlar shifrlangan holda saqlanadi. JWT tokenlar va session management orqali xavfsizlik ta\'minlanadi.',
    },
    {
      title: t('privacy.rightsTitle' as any) ?? 'Foydalanuvchi huquqlari',
      body: t('privacy.rightsBody' as any) ?? 'Siz istalgan vaqtda hisobingizni o\'chirishingiz, ma\'lumotlaringizni so\'rashingiz yoki to\'g\'rilashingiz mumkin. Buning uchun support@sayinglobal.uz ga murojaat qiling.',
    },
    {
      title: t('privacy.contactTitle' as any) ?? 'Bog\'lanish',
      body: t('privacy.contactBody' as any) ?? 'Maxfiylik siyosati bo\'yicha savollar uchun: support@sayinglobal.uz yoki Telegram: @sayinglobal_support',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <div className="container-page py-12 sm:py-16 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
              <Lock className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-eyebrow">{t('common.about')}</p>
              <h1 className="display-md mt-1">{t('privacy.title' as any) ?? 'Maxfiylik siyosati'}</h1>
            </div>
          </div>

          <div className="surface-elevated p-8 space-y-8">
            {sections.map((section, i) => (
              <section key={i} className="space-y-2">
                <h2 className="font-display text-lg font-bold text-fg">{section.title}</h2>
                <p className="text-fg-muted leading-relaxed">{section.body}</p>
              </section>
            ))}

            <section className="border-t border-border pt-6">
              <p className="text-xs text-fg-subtle">
                SAYIN GLOBAL · {new Date().getFullYear()} · {t('landing.footerCopyright')}
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
