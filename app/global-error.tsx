'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useState } from 'react';

/**
 * Global error boundary for Next.js App Router.
 *
 * This boundary REPLACES the root layout when a render error escapes every
 * other boundary, so the `NextIntlClientProvider` from `app/layout.tsx` is NOT
 * available here and `useTranslations()` cannot be used. It must also render
 * its own <html>/<body> tags.
 *
 * To keep the fallback localized we read the active locale from the
 * `sayin-locale` cookie (the same cookie `lib/i18n.ts` uses) and resolve a
 * tiny inline message dictionary whose values mirror `messages/*.json`.
 */
const LOCALE_COOKIE = 'sayin-locale';
const DEFAULT_LOCALE = 'uz';

type Locale = 'uz' | 'uz-cyrl' | 'ru' | 'en';

const MESSAGES: Record<Locale, { title: string; description: string; tryAgain: string; goHome: string }> = {
  uz: {
    title: "Nimadir noto'g'ri ketdi",
    description: "Iltimos, keyinroq qaytadan urinib ko'ring",
    tryAgain: "Qaytadan urinish",
    goHome: "Bosh sahifaga qaytish",
  },
  'uz-cyrl': {
    title: 'Нимадир нотўғри кетди',
    description: 'Илтимос, кейинроқ қайтадан уриниб кўринг',
    tryAgain: 'Қайтадан уриниш',
    goHome: 'Бош саҳифага қайтиш',
  },
  ru: {
    title: 'Что-то пошло не так',
    description: 'Пожалуйста, попробуйте позже',
    tryAgain: 'Попробовать снова',
    goHome: 'На главную',
  },
  en: {
    title: 'Something went wrong',
    description: 'Please try again later',
    tryAgain: 'Try again',
    goHome: 'Go home',
  },
};

function readLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + LOCALE_COOKIE + '=([^;]*)'));
    const value = match ? decodeURIComponent(match[1]) : undefined;
    if (value && value in MESSAGES) return value as Locale;
  } catch {}
  return DEFAULT_LOCALE;
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Start from the default locale so SSR and the first client render agree,
  // then resolve the real locale from the cookie after mount.
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(readLocaleFromCookie());
  }, []);

  useEffect(() => {
    try {
      Sentry.captureException(error);
    } catch {}
  }, [error]);

  const t = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];

  return (
    <html lang={locale}>
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
          background: '#0c1f17',
          color: '#ecfdf5',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '14px', color: '#9bb0a6', marginBottom: '24px' }}>
            {t.description}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {t.tryAgain}
            </button>
            {/* global-error replaces the root layout and renders its own
                <html>/<body>, so the Next.js router context for <Link> is not
                available here — a plain anchor with a hard navigation is required. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: 'transparent',
                color: '#ecfdf5',
                border: '1px solid #2f4a3d',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {t.goHome}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
