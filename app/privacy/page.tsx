'use client';

import { useTranslations } from 'next-intl';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations();

  const sections = [
    {
      title: t('privacy.dataCollectionTitle' as any) ?? '1. Ma\'lumotlarni to\'plash va foydalanish',
      body: t('privacy.dataCollectionBody' as any) ?? 'SAYIN GLOBAL platformasi xizmatlardan foydalanish jarayonida foydalanuvchilarning ismini, telefon raqamini, ruxsat etilganda GPS joylashuvini hamda qurilma turini (IP, browser) to\'playdi. Bu ma\'lumotlar faqatgina e\'lonlarni ko\'rsatish va xavfsiz muhitni ta\'minlash uchun ishlatiladi.',
    },
    {
      title: t('privacy.dataUsageTitle' as any) ?? '2. Uchinchi tomonlar va ma\'lumotlarni almashish',
      body: t('privacy.dataUsageBody' as any) ?? 'Foydalanuvchining shaxsiy ma\'lumotlari (masalan, telefon raqam) uchinchi shaxslarga tijorat maqsadida sotilmaydi. Telefon raqamingiz faqatgina tizimga kirish (Telegram orqali) va profil orqali aloqa qilishga ruxsat bersangizgina e\'londa ko\'rsatiladi.',
    },
    {
      title: t('privacy.locationTitle' as any) ?? '3. Joylashuv ma\'lumotlari (GPS)',
      body: t('privacy.locationBody' as any) ?? 'Joylashuv ma\'lumotlari faqatgina "Yaqin atrof" xizmati uchun va xaritada e\'lon joylashuvini belgilash uchun ishlatiladi. Sizning aniq lokatsiyangiz boshqa foydalanuvchilarga xarita belgisi (pin) shaklida ko\'rsatiladi.',
    },
    {
      title: t('privacy.securityTitle' as any) ?? '4. Axborot xavfsizligi',
      body: t('privacy.securityBody' as any) ?? 'Platforma zamonaviy shifrlash standartlari (JWT, HTTPS/SSL) yordamida foydalanuvchi ma\'lumotlarini himoya qiladi. Sessiyalar qurilma darajasida nazorat qilinadi va xohlagan paytingizda boshqa qurilmalardan chiqish (logout) imkoniyati mavjud.',
    },
    {
      title: t('privacy.rightsTitle' as any) ?? '5. Foydalanuvchi huquqlari va Hisobni o\'chirish',
      body: t('privacy.rightsBody' as any) ?? 'Foydalanuvchi istalgan vaqtda o\'z hisobini to\'liq o\'chirib tashlash huquqiga ega. Hisob o\'chirilganda, unga tegishli barcha e\'lonlar, chatlar va rasm fayllari tizimdan tiklanmas tarzda tozalanadi.',
    },
    {
      title: t('privacy.cookiesTitle' as any) ?? '6. Cookie fayllari (Cookies)',
      body: t('privacy.cookiesBody' as any) ?? 'Tizim qulayligini oshirish maqsadida cookie va local storage fayllaridan foydalanamiz (masalan: til sozlamalari, tungi/kunduzgi rejim va avtorizatsiya tokenlarini saqlash).',
    },
    {
      title: t('privacy.changesTitle' as any) ?? '7. Siyosatga kiritiladigan o\'zgartirishlar',
      body: t('privacy.changesBody' as any) ?? 'SAYIN GLOBAL ma\'muriyati mazkur Maxfiylik Siyosatiga o\'zgartirishlar kiritish huquqini o\'zida saqlab qoladi. Katta o\'zgarishlar bo\'lganda, platforma orqali sizga xabar beriladi.',
    },
    {
      title: t('privacy.contactTitle' as any) ?? '8. Biz bilan bog\'lanish',
      body: t('privacy.contactBody' as any) ?? 'Maxfiylik siyosati bo\'yicha savollaringiz, takliflaringiz bo\'lsa, rasmiy Telegram manzilimiz (@sayinglobal_support) yoki elektron pochta (support@sayinglobal.uz) orqali biz bilan bog\'lanishingiz mumkin.',
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
