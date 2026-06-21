import { getRequestConfig } from 'next-intl/server';

export const locales = ['uz', 'uz-cyrl', 'ru', 'en'] as const;
export type Locale = typeof locales[number];
export const defaultLocale = 'uz';

export default getRequestConfig(async () => {
  const locale = 'uz'; // Default for static export
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Tashkent'
  };
});
