'use client';

import { useTranslations } from 'next-intl';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations();

  const sections = [
    {
      title: t('privacy.dataCollectionTitle')lumotlarni to\'plash va foydalanish',
      body: t('privacy.dataCollectionBody')playdi. Bu ma\'lumotlar faqatgina e\'lonlarni ko\'rsatish va xavfsiz muhitni ta\'minlash uchun ishlatiladi.',
    },
    {
      title: t('privacy.dataUsageTitle')lumotlarni almashish',
      body: t('privacy.dataUsageBody')lumotlari (masalan, telefon raqam) uchinchi shaxslarga tijorat maqsadida sotilmaydi. Telefon raqamingiz faqatgina tizimga kirish (Telegram orqali) va profil orqali aloqa qilishga ruxsat bersangizgina e\'londa ko\'rsatiladi.',
    },
    {
      title: t('privacy.locationTitle')lumotlari (GPS)',
      body: t('privacy.locationBody')lumotlari faqatgina "Yaqin atrof" xizmati uchun va xaritada e\'lon joylashuvini belgilash uchun ishlatiladi. Sizning aniq lokatsiyangiz boshqa foydalanuvchilarga xarita belgisi (pin) shaklida ko\'rsatiladi.',
    },
    {
      title: t('privacy.securityTitle'),
      body: t('privacy.securityBody')lumotlarini himoya qiladi. Sessiyalar qurilma darajasida nazorat qilinadi va xohlagan paytingizda boshqa qurilmalardan chiqish (logout) imkoniyati mavjud.',
    },
    {
      title: t('privacy.rightsTitle')chirish',
      body: t('privacy.rightsBody')z hisobini to\'liq o\'chirib tashlash huquqiga ega. Hisob o\'chirilganda, unga tegishli barcha e\'lonlar, chatlar va rasm fayllari tizimdan tiklanmas tarzda tozalanadi.',
    },
    {
      title: t('privacy.cookiesTitle'),
      body: t('privacy.cookiesBody'),
    },
    {
      title: t('privacy.changesTitle')zgartirishlar',
      body: t('privacy.changesBody')muriyati mazkur Maxfiylik Siyosatiga o\'zgartirishlar kiritish huquqini o\'zida saqlab qoladi. Katta o\'zgarishlar bo\'lganda, platforma orqali sizga xabar beriladi.',
    },
    {
      title: t('privacy.contactTitle')lanish',
      body: t('privacy.contactBody')yicha savollaringiz, takliflaringiz bo\'lsa, rasmiy Telegram manzilimiz (@sayinglobal_support) yoki elektron pochta (support@sayinglobal.uz) orqali biz bilan bog\'lanishingiz mumkin.',
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
              <h1 className="display-md mt-1">{t('privacy.title')}</h1>
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
