import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { IntlErrorCode } from 'next-intl';

export const locales = ['uz', 'uz-cyrl', 'ru', 'en'] as const;
export const defaultLocale = 'uz' as const;
export type Locale = (typeof locales)[number];

const COOKIE = 'sayin-locale';

type Messages = Record<string, any>;

/**
 * R6.9: only one of the four supported locales is accepted. Any other
 * requested/stored value is treated as invalid and falls back to `uz`.
 */
export function isValidLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A visible value: a string with at least one non-whitespace character. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Deep-merge the active locale's messages on top of the default-locale (`uz`)
 * base. The active locale wins ONLY when it provides a non-empty value; keys
 * that are missing or whose value is empty / whitespace-only keep the `uz`
 * value. This guarantees that no raw dotted key and no blank text is ever
 * rendered (R6.7, R6.8) for both Server and Client Components, because the
 * resolved messages already carry the `uz` fallback baked in.
 */
export function mergeWithFallback(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };
  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = base[key];
    if (isPlainObject(o) && isPlainObject(b)) {
      result[key] = mergeWithFallback(b, o);
    } else if (isPlainObject(o)) {
      result[key] = mergeWithFallback({}, o);
    } else if (isNonEmptyString(o)) {
      result[key] = o;
    } else if (typeof o === 'string') {
      // Empty / whitespace-only active value → keep the `uz` value if any.
      result[key] = isNonEmptyString(b) || isPlainObject(b) ? b : o;
    } else if (o !== undefined && o !== null) {
      result[key] = o;
    }
    // undefined / null override → keep the base value (already present).
  }
  return result;
}

function resolveByPath(messages: Messages, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((acc, part) => (isPlainObject(acc) ? acc[part] : undefined), messages);
}

async function loadMessages(locale: Locale): Promise<Messages> {
  return (await import(`../messages/${locale}.json`)).default as Messages;
}

/**
 * next-intl routing config — used by middleware.ts createMiddleware().
 */
export const routing = {
  locales,
  defaultLocale,
};

export default getRequestConfig(async () => {
  // R6.9: resolve the stored locale, falling back to `uz` when it is missing
  // or not one of the four supported locales.
  let locale: Locale = defaultLocale;
  try {
    const stored = cookies().get(COOKIE)?.value;
    if (isValidLocale(stored)) locale = stored;
  } catch {}

  // The `uz` base is always loaded so it can act as the fallback source.
  const base = await loadMessages(defaultLocale);
  let messages: Messages = base;
  if (locale !== defaultLocale) {
    try {
      const active = await loadMessages(locale);
      messages = mergeWithFallback(base, active);
    } catch {
      // Unknown or broken locale file → fall back entirely to `uz`.
      messages = base;
      locale = defaultLocale;
    }
  }

  return {
    locale,
    messages,
    timeZone: 'Asia/Tashkent',
    now: new Date(),
    // R6.7 / R6.8: never surface a raw dotted key. If next-intl still reports a
    // message as missing (i.e. absent from `uz` too), resolve the `uz` value
    // and, as a last resort, show the leaf segment instead of the dotted path.
    getMessageFallback({ namespace, key }) {
      const path = namespace ? `${namespace}.${key}` : key;
      const uzValue = resolveByPath(base, path);
      if (isNonEmptyString(uzValue)) return uzValue;
      return path.split('.').pop() || path;
    },
    // A missing message must not crash rendering — the `uz` fallback already
    // covers it. Genuine configuration errors are still surfaced in dev.
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) return;
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
  };
});
