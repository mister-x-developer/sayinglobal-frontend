import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['uz', 'uz-cyrl', 'ru', 'en'] as const;
export const defaultLocale = 'uz' as const;
export type Locale = (typeof locales)[number];

const COOKIE = 'sayin-locale';

function isValid(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale;
  try {
    const c = cookies().get(COOKIE)?.value;
    if (isValid(c)) locale = c;
  } catch {}

  let messages: Record<string, any> = {};
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../messages/${defaultLocale}.json`)).default;
  }

  return {
    locale,
    messages,
    timeZone: 'Asia/Tashkent',
    now: new Date(),
  };
});
