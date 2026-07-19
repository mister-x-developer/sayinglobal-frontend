import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['uz', 'uz-cyrl', 'ru', 'en'] as const;
export type Locale = typeof locales[number];
export const defaultLocale = 'uz';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('sayin-locale')?.value as Locale | undefined;
  const locale = localeCookie && locales.includes(localeCookie) ? localeCookie : defaultLocale;
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Tashkent'
  };
});
