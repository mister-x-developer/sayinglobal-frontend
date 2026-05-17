/**
 * Formatting helpers — locale aware where it matters.
 */

const NBSP = '\u00A0';

export function formatPrice(price: number, currency: string = 'UZS'): string {
  if (currency === 'UZS' || !currency) {
    const formatted = new Intl.NumberFormat('uz-UZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return `${formatted}${NBSP}soʻm`;
  }
  try {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(num);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('998')) {
    const rest = digits.slice(3);
    return `+998 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
  }
  return phone;
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return 'hozirgina';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}\u00A0daqiqa oldin`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}\u00A0soat oldin`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}\u00A0kun oldin`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}\u00A0hafta oldin`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}\u00A0oy oldin`;
  return `${Math.floor(seconds / 31536000)}\u00A0yil oldin`;
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
