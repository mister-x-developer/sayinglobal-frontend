'use client';

/**
 * OnboardingModal — shown once to new users after first login.
 * Explains platform features: listings, plans, chat, nearby.
 * Dismissed via localStorage flag 'sayin_onboarded'.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  X, ChevronRight, ChevronLeft,
  MapPin, MessageSquareText, Sparkles, Tag, Users, CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

const STORAGE_KEY = 'sayin_onboarded_v1';

interface Slide {
  icon: React.ElementType;
  color: string;
  title: Record<string, string>;
  body: Record<string, string>;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    color: 'bg-brand-primary/10 text-brand-primary',
    title: {
      uz: "SAYIN GLOBAL'ga xush kelibsiz!",
      'uz-cyrl': "SAYIN GLOBAL'га хуш келибсиз!",
      ru: 'Добро пожаловать в SAYIN GLOBAL!',
      en: 'Welcome to SAYIN GLOBAL!',
    },
    body: {
      uz: "Oʻzbekistondagi eng yirik raqamli chorva bozori. Sotuvchilar va xaridorlarni bevosita bogʻlaymiz.",
      'uz-cyrl': "Ўзбекистондаги энг йирик рақамли чорва бозори. Сотувчилар ва харидорларни бевосита боғлаймиз.",
      ru: 'Крупнейший цифровой рынок скота в Узбекистане. Соединяем продавцов и покупателей напрямую.',
      en: "Uzbekistan's largest digital livestock marketplace. We connect sellers and buyers directly.",
    },
  },
  {
    icon: Tag,
    color: 'bg-brand-accent/10 text-brand-accent',
    title: {
      uz: "Eʼlonlar",
      'uz-cyrl': "Эълонлар",
      ru: 'Объявления',
      en: 'Listings',
    },
    body: {
      uz: "Qoramol, qo'y, echki, ot, tuya, parrandalar va boshqa chorva mollarini soting yoki xarid qiling. Har bir eʼlon xaritada koʻrsatiladi.",
      'uz-cyrl': "Қорамол, қўй, эчки, от, туя, паррандалар ва бошқа чорва молларини сотинг ёки харид қилинг. Ҳар бир эълон харитада кўрсатилади.",
      ru: 'Продавайте или покупайте КРС, овец, коз, лошадей, верблюдов, птицу и другой скот. Каждое объявление отображается на карте.',
      en: 'Sell or buy cattle, sheep, goats, horses, camels, poultry and more. Every listing is shown on the map.',
    },
  },
  {
    icon: MapPin,
    color: 'bg-success/10 text-success',
    title: {
      uz: 'Yaqin atrofdagi e\'lonlar',
      'uz-cyrl': "Яқин атрофдаги эълонлар",
      ru: 'Объявления рядом',
      en: 'Nearby listings',
    },
    body: {
      uz: "GPS orqali yaqin atrofdagi eʼlonlarni ko'ring. Xaritada sotuvchilarning joylashuvini aniqlang va eng yaqinini toping.",
      'uz-cyrl': "GPS орқали яқин атрофдаги эълонларни кўринг. Харитада сотувчиларнинг жойлашувини аниқланг.",
      ru: 'Смотрите объявления рядом с вами через GPS. Найдите ближайших продавцов на карте.',
      en: 'See listings near you via GPS. Find the closest sellers on the map.',
    },
  },
  {
    icon: MessageSquareText,
    color: 'bg-info/10 text-info',
    title: {
      uz: 'Sotuvchilar bilan muloqot',
      'uz-cyrl': "Сотувчилар билан мулоқот",
      ru: 'Общение с продавцами',
      en: 'Chat with sellers',
    },
    body: {
      uz: "Eʼlon sahifasida 'Sotuvchiga yozish' tugmasini bosib, toʻgʻridan-toʻgʻri muloqot qiling. Barcha suhbatlar /chat sahifasida.",
      'uz-cyrl': "Эълон саҳифасида 'Сотувчига ёзиш' тугмасини босиб, тўғридан-тўғри мулоқот қилинг.",
      ru: "Нажмите 'Написать продавцу' на странице объявления для прямого общения. Все диалоги в разделе /chat.",
      en: "Tap 'Message Seller' on any listing to chat directly. All conversations are at /chat.",
    },
  },

];

const BTN_LABELS = {
  next: { uz: 'Keyingi', 'uz-cyrl': 'Кейинги', ru: 'Далее', en: 'Next' },
  prev: { uz: 'Oldingi', 'uz-cyrl': 'Олдинги', ru: 'Назад', en: 'Back' },
  start: { uz: 'Boshlash', 'uz-cyrl': 'Бошлаш', ru: 'Начать', en: 'Get started' },
  skip: { uz: "Oʻtkazib yuborish", 'uz-cyrl': 'Ўтказиб юбориш', ru: 'Пропустить', en: 'Skip' },
};

export function OnboardingModal() {
  const locale = useLocale();
  const { isAuthenticated, user } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user?.terms_accepted_at) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the page loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, user?.terms_accepted_at]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < SLIDES.length - 1) setStep((s) => s + 1);
    else dismiss();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const lang = locale as string;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-4 bottom-4 z-[201] mx-auto max-w-sm sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated shadow-[0_32px_80px_rgba(0,0,0,0.22)]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-0">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStep(i)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === step
                          ? 'w-5 bg-brand-primary'
                          : 'w-1.5 bg-border-strong hover:bg-fg-subtle'
                      }`}
                      aria-label={`Step ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              {/* Slide content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 py-6"
                >
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${slide.color}`}>
                    <Icon className="h-7 w-7" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-xl font-bold text-fg leading-tight mb-2">
                    {slide.title[lang] ?? slide.title['uz']}
                  </h2>
                  <p className="text-sm text-fg-muted leading-relaxed">
                    {slide.body[lang] ?? slide.body['uz']}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center gap-2 border-t border-border/60 px-5 py-4">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={prev}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    {BTN_LABELS.prev[lang as keyof typeof BTN_LABELS.prev] ?? BTN_LABELS.prev['uz']}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="btn btn-ghost btn-sm flex-1 text-fg-muted"
                  >
                    {BTN_LABELS.skip[lang as keyof typeof BTN_LABELS.skip] ?? BTN_LABELS.skip['uz']}
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  className="btn btn-primary btn-sm flex-1"
                >
                  {step === SLIDES.length - 1 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                      {BTN_LABELS.start[lang as keyof typeof BTN_LABELS.start] ?? BTN_LABELS.start['uz']}
                    </>
                  ) : (
                    <>
                      {BTN_LABELS.next[lang as keyof typeof BTN_LABELS.next] ?? BTN_LABELS.next['uz']}
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
