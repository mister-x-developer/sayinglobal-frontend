/**
 * Translation Provider Abstraction.
 *
 * Swap the underlying engine without touching any UI component.
 * Current: Google Translate unofficial endpoint (demo/dev).
 * Future: OpenAI / DeepL / Google Cloud / LibreTranslate / self-hosted.
 *
 * Usage:
 *   import { translationProvider } from '@/lib/translation/provider';
 *   const result = await translationProvider.translate(text, 'ru', 'uz');
 */

export type SupportedLocale = 'uz' | 'uz-cyrl' | 'ru' | 'en';

export interface TranslationResult {
  text: string;
  fromLocale: string;
  toLocale: string;
  cached: boolean;
}

export interface TranslationProvider {
  name: string;
  translate(
    text: string,
    targetLocale: SupportedLocale,
    sourceLocale?: string
  ): Promise<TranslationResult>;
}

// ── ISO locale mapping ────────────────────────────────────────────────────────
const LOCALE_TO_ISO: Record<string, string> = {
  uz: 'uz',
  'uz-cyrl': 'uz',
  ru: 'ru',
  en: 'en',
};

// ── Latin → Cyrillic Uzbek transliteration map ────────────────────────────────
// Covers the most common letter combinations used in Uzbek Latin script.
const LATIN_TO_CYRL: [RegExp, string][] = [
  [/sh/gi, 'ш'], [/ch/gi, 'ч'], [/ng/gi, 'нг'], [/gh/gi, 'ғ'],
  [/oʻ/gi, 'ў'], [/gʻ/gi, 'ғ'], [/Oʻ/g, 'Ў'], [/Gʻ/g, 'Ғ'],
  [/o'/gi, 'ў'], [/g'/gi, 'ғ'],
  [/a/gi, 'а'], [/b/gi, 'б'], [/d/gi, 'д'], [/e/gi, 'е'],
  [/f/gi, 'ф'], [/g/gi, 'г'], [/h/gi, 'ҳ'], [/i/gi, 'и'],
  [/j/gi, 'ж'], [/k/gi, 'к'], [/l/gi, 'л'], [/m/gi, 'м'],
  [/n/gi, 'н'], [/o/gi, 'о'], [/p/gi, 'п'], [/q/gi, 'қ'],
  [/r/gi, 'р'], [/s/gi, 'с'], [/t/gi, 'т'], [/u/gi, 'у'],
  [/v/gi, 'в'], [/x/gi, 'х'], [/y/gi, 'й'], [/z/gi, 'з'],
];

function latinToCyrillic(text: string): string {
  let result = text;
  for (const [pattern, replacement] of LATIN_TO_CYRL) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = new Map<string, string>();

function cacheKey(text: string, target: string, source: string) {
  return `${source}:${target}:${text.slice(0, 80)}`;
}

// ── Google Translate (unofficial, no API key) ─────────────────────────────────
const googleProvider: TranslationProvider = {
  name: 'google-unofficial',

  async translate(text, targetLocale, sourceLocale = 'auto') {
    // Special case: uz → uz-cyrl is a script conversion, not a language translation.
    // Google Translate treats both as 'uz' and returns the same text.
    // We apply a Latin→Cyrillic transliteration instead.
    if (targetLocale === 'uz-cyrl') {
      const key = cacheKey(text, 'uz-cyrl', sourceLocale ?? 'auto');
      if (cache.has(key)) {
        return { text: cache.get(key)!, fromLocale: sourceLocale ?? 'auto', toLocale: 'uz-cyrl', cached: true };
      }
      // If source is not Uzbek Latin, first translate to Uzbek then convert
      let uzText = text;
      if (sourceLocale && sourceLocale !== 'uz' && sourceLocale !== 'auto') {
        const intermediate = await googleProvider.translate(text, 'uz', sourceLocale);
        uzText = intermediate.text;
      }
      const cyrl = latinToCyrillic(uzText);
      cache.set(key, cyrl);
      return { text: cyrl, fromLocale: sourceLocale ?? 'auto', toLocale: 'uz-cyrl', cached: false };
    }

    const target = LOCALE_TO_ISO[targetLocale] ?? 'en';
    const source = sourceLocale === 'auto' ? 'auto' : (LOCALE_TO_ISO[sourceLocale] ?? 'auto');

    // Same language — skip
    if (target === source && source !== 'auto') {
      return { text, fromLocale: source, toLocale: target, cached: true };
    }

    const key = cacheKey(text, target, source);
    if (cache.has(key)) {
      return { text: cache.get(key)!, fromLocale: source, toLocale: target, cached: true };
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) throw new Error(`Translation HTTP ${res.status}`);

    const data = await res.json();
    const translated: string = data[0]
      ?.map((chunk: unknown[]) => chunk[0])
      .filter(Boolean)
      .join('') ?? text;

    cache.set(key, translated);
    return { text: translated, fromLocale: source, toLocale: target, cached: false };
  },
};

// ── Active provider (swap here to change engine) ──────────────────────────────
let activeProvider: TranslationProvider = googleProvider;

export const translationProvider = {
  /** Translate text using the active provider. Never throws — returns original on failure. */
  async translate(
    text: string,
    targetLocale: SupportedLocale,
    sourceLocale?: string
  ): Promise<string> {
    if (!text.trim()) return text;
    try {
      const result = await activeProvider.translate(text, targetLocale, sourceLocale);
      return result.text;
    } catch {
      return text; // graceful fallback
    }
  },

  /** Swap the underlying translation engine. */
  setProvider(provider: TranslationProvider) {
    activeProvider = provider;
  },

  /** Get the current provider name. */
  get providerName() {
    return activeProvider.name;
  },

  /** Clear the translation cache. */
  clearCache() {
    cache.clear();
  },
};
