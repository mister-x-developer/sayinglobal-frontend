'use client';

import { ReactNode, useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  NextIntlClientProvider,
  IntlErrorCode,
  type AbstractIntlMessages,
} from 'next-intl';

// ── Supported locales ──────────────────────────────────────────────────────────
const SUPPORTED_LOCALES = ['uz', 'uz-cyrl', 'ru', 'en'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];
const DEFAULT_LOCALE: SupportedLocale = 'uz';
const COOKIE_NAME = 'sayin-locale';

// ── Storage helpers ─────────────────────────────────────────────────────────────
function getStoredLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;
  // Try localStorage first (reliable in Capacitor)
  try {
    const ls = localStorage.getItem(COOKIE_NAME);
    if (ls && (SUPPORTED_LOCALES as readonly string[]).includes(ls)) {
      return ls as SupportedLocale;
    }
  } catch {}
  // Fallback to cookie
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const val = match ? decodeURIComponent(match[1]) : null;
  return val && (SUPPORTED_LOCALES as readonly string[]).includes(val)
    ? (val as SupportedLocale)
    : null;
}

function setStoredLocale(locale: SupportedLocale) {
  if (typeof window === 'undefined') return;
  const ONE_YEAR = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  try {
    localStorage.setItem(COOKIE_NAME, locale);
  } catch {}
}

// ── Dynamic message loader ────────────────────────────────────────────────────
const messageCache: Partial<Record<SupportedLocale, AbstractIntlMessages>> = {};

async function loadMessages(locale: SupportedLocale): Promise<AbstractIntlMessages> {
  if (messageCache[locale]) return messageCache[locale]!;
  try {
    const mod = await import(`../../messages/${locale}.json`);
    messageCache[locale] = mod.default;
    return mod.default;
  } catch {
    // Fallback to uz
    if (locale !== DEFAULT_LOCALE) return loadMessages(DEFAULT_LOCALE);
    return {};
  }
}

// ── Locale context (for LanguageSwitcher to trigger change) ───────────────────
interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function useLocaleSwitch() {
  return useContext(LocaleContext);
}

// ── Main Provider ─────────────────────────────────────────────────────────────
export function IntlClientProvider({
  locale: serverLocale,
  messages: serverMessages,
  timeZone = 'Asia/Tashkent',
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  timeZone?: string;
  children: ReactNode;
}) {
  // Determine initial locale: prefer cookie (set by user), then server prop
  const getInitialLocale = (): SupportedLocale => {
    if (typeof window !== 'undefined') {
      const stored = getStoredLocale();
      if (stored) return stored;
    }
    return (SUPPORTED_LOCALES as readonly string[]).includes(serverLocale)
      ? (serverLocale as SupportedLocale)
      : DEFAULT_LOCALE;
  };

  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(serverMessages);
  const [loading, setLoading] = useState(false);

  // On mount, check if stored locale differs from server-rendered locale
  // Because if it does, our `messages` state (initialized to serverMessages) is WRONG!
  useEffect(() => {
    const storedLocale = getStoredLocale();
    if (storedLocale && storedLocale !== serverLocale) {
      // Load the correct locale messages
      setLoading(true);
      loadMessages(storedLocale).then((msgs) => {
        setMessages(msgs);
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(async (newLocale: SupportedLocale) => {
    if (newLocale === locale) return;
    setLoading(true);
    setStoredLocale(newLocale);
    const msgs = await loadMessages(newLocale);
    setMessages(msgs);
    setLocaleState(newLocale);
    // Update <html lang="..."> attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
    setLoading(false);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={timeZone}
        getMessageFallback={({ namespace, key }) => {
          const path = namespace ? `${namespace}.${key}` : key;
          return path.split('.').pop() || path;
        }}
        onError={(error) => {
          if (error.code === IntlErrorCode.MISSING_MESSAGE) return;
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error(error);
          }
        }}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
