import { getRequestConfig } from 'next-intl/server';

export const locales = ['uz', 'ru', 'en'] as const;
export const defaultLocale = 'uz';

export default getRequestConfig(async () => {
  const locale = 'uz'; // Default for static export
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Tashkent'
  };
});
