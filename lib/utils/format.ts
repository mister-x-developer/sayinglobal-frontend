/**
 * Formatting helpers — locale aware where it matters.
 */

const NBSP = '\u00A0';

export function formatPrice(price: number, currency: string = 'UZS', locale: string = 'uz'): string {
  const formatted = new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  if (currency === 'UZS' || !currency) {
    const suffix = locale === 'ru' ? 'сум' : locale === 'uz-cyrl' ? 'сўм' : locale === 'en' ? 'UZS' : "soʻm";
    return `${formatted}${NBSP}${suffix}`;
  }
  
  if (currency === 'USD') {
    return `${formatted}${NBSP}$`;
  }

  return `${formatted}${NBSP}${currency}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(num);
}

/**
 * Return the best pre-translated title for the current UI locale.
 * Falls back to the canonical `title` (original language).
 * Used for eʼlon sarlavhalari so they appear in the interface language.
 */
export function getLocalizedListingTitle(
  listing: {
    title: string;
    title_uz?: string;
    title_uz_cyrl?: string;
    title_ru?: string;
    title_en?: string;
  },
  locale: string
): string {
  const norm = (locale || 'uz').replace('-', '_');
  const field = `title_${norm}` as keyof typeof listing;
  const val = listing[field] as string | undefined;
  return val || listing.title || '';
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('998')) {
    const rest = digits.slice(3);
    return `+998 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
  }
  return phone;
}

export function formatRelativeTime(date: Date | string, locale: string = 'uz'): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  const isRu = locale === 'ru';
  const isCyrl = locale === 'uz-cyrl';
  const isEn = locale === 'en';

  if (seconds < 60) {
    if (isRu) return 'только что';
    if (isCyrl) return 'ҳозиргина';
    if (isEn) return 'just now';
    return 'hozirgina';
  }
  
  const m = Math.floor(seconds / 60);
  if (seconds < 3600) {
    if (isRu) return `${m}\u00A0минут назад`;
    if (isCyrl) return `${m}\u00A0дақиқа олдин`;
    if (isEn) return `${m}\u00A0minutes ago`;
    return `${m}\u00A0daqiqa oldin`;
  }
  
  const h = Math.floor(seconds / 3600);
  if (seconds < 86400) {
    if (isRu) return `${h}\u00A0часов назад`;
    if (isCyrl) return `${h}\u00A0соат олдин`;
    if (isEn) return `${h}\u00A0hours ago`;
    return `${h}\u00A0soat oldin`;
  }
  
  const d = Math.floor(seconds / 86400);
  if (seconds < 604800) {
    if (isRu) return `${d}\u00A0дней назад`;
    if (isCyrl) return `${d}\u00A0кун олдин`;
    if (isEn) return `${d}\u00A0days ago`;
    return `${d}\u00A0kun oldin`;
  }
  
  const w = Math.floor(seconds / 604800);
  if (seconds < 2592000) {
    if (isRu) return `${w}\u00A0недель назад`;
    if (isCyrl) return `${w}\u00A0ҳафта олдин`;
    if (isEn) return `${w}\u00A0weeks ago`;
    return `${w}\u00A0hafta oldin`;
  }
  
  const mo = Math.floor(seconds / 2592000);
  if (seconds < 31536000) {
    if (isRu) return `${mo}\u00A0месяцев назад`;
    if (isCyrl) return `${mo}\u00A0ой олдин`;
    if (isEn) return `${mo}\u00A0months ago`;
    return `${mo}\u00A0oy oldin`;
  }
  
  const y = Math.floor(seconds / 31536000);
  if (isRu) return `${y}\u00A0лет назад`;
  if (isCyrl) return `${y}\u00A0йил олдин`;
  if (isEn) return `${y}\u00A0years ago`;
  return `${y}\u00A0yil oldin`;
}

export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '…';
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/')) {
    const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'https://sayinglobal.up.railway.app').replace(/\/api\/?$/, '');
    return `${apiOrigin}${url}`;
  }
  return url;
}
