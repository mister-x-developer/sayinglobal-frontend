'use client';

/**
 * Runtime translator for code paths that fire OUTSIDE the React render tree.
 *
 * `next-intl`'s `useTranslations` only works inside React components. The
 * WebSocket singletons (`lib/ws/notificationSocket.ts`, `lib/ws/chatSocket.ts`)
 * receive frames asynchronously and need to surface localized toasts without
 * a React context — for example when the backend pushes a `session.revoked`
 * event right before closing 4403.
 *
 * This helper reads the `sayin-locale` cookie (the same source `next-intl`
 * uses) and looks up dotted keys (e.g. `auth.sessionRevoked`) against the
 * statically-imported message tables. The lookup is synchronous so callers
 * can render a toast in the same task as the WS event.
 *
 * Falls back to English on missing keys; never throws.
 */

import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';
import uzMessages from '../../messages/uz.json';
import uzCyrlMessages from '../../messages/uz-cyrl.json';

type Locale = 'uz' | 'uz-cyrl' | 'ru' | 'en';
type MessageBundle = Record<string, unknown>;

const BUNDLES: Record<Locale, MessageBundle> = {
  'uz': uzMessages as MessageBundle,
  'uz-cyrl': uzCyrlMessages as MessageBundle,
  'ru': ruMessages as MessageBundle,
  'en': enMessages as MessageBundle,
};

function readLocaleCookie(): Locale {
  if (typeof document === 'undefined') return 'uz';
  try {
    const raw = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('sayin-locale='));
    if (!raw) return 'uz';
    const value = raw.split('=')[1]?.trim();
    if (value === 'uz' || value === 'uz-cyrl' || value === 'ru' || value === 'en') {
      return value;
    }
  } catch {
    /* fall through */
  }
  return 'uz';
}

function lookupKey(bundle: MessageBundle, dottedKey: string): string | null {
  const parts = dottedKey.split('.');
  let cursor: unknown = bundle;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in cursor) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return typeof cursor === 'string' ? cursor : null;
}

/**
 * Synchronous, framework-free lookup of a dotted message key against the
 * active locale's message bundle. Returns the English fallback, then the key
 * itself, if the lookup misses.
 */
export function tRuntime(key: string): string {
  const locale = readLocaleCookie();
  const localized = lookupKey(BUNDLES[locale], key);
  if (localized) return localized;
  const fallback = lookupKey(BUNDLES.en, key);
  if (fallback) return fallback;
  return key;
}
