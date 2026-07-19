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

import apiClient from '@/lib/api/client';

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
  // ── Digraphs MUST come first (before single-letter rules eat the chars) ──
  [/Sh/g, 'Ш'], [/sh/gi, 'ш'],
  [/Ch/g, 'Ч'], [/ch/gi, 'ч'],
  [/Yo/g, 'Ё'], [/yo/gi, 'ё'],
  [/Yu/g, 'Ю'], [/yu/gi, 'ю'],
  [/Ya/g, 'Я'], [/ya/gi, 'я'],
  [/Ye/g, 'Е'], [/ye/gi, 'е'],
  [/Ng/g, 'Нг'], [/ng/gi, 'нг'],
  [/Gh/g, 'Ғ'], [/gh/gi, 'ғ'],
  [/Ts/g, 'Ц'], [/ts/gi, 'ц'],
  // ── Apostrophe combinations ──
  [/Oʻ/g, 'Ў'], [/oʻ/gi, 'ў'],
  [/Gʻ/g, 'Ғ'], [/gʻ/gi, 'ғ'],
  [/O'/g, 'Ў'], [/o'/gi, 'ў'],
  [/G'/g, 'Ғ'], [/g'/gi, 'ғ'],
  [/O'/g, 'Ў'], [/o'/gi, 'ў'],
  [/G'/g, 'Ғ'], [/g'/gi, 'ғ'],
  // ── Single letters ──
  [/A/g, 'А'], [/a/g, 'а'],
  [/B/g, 'Б'], [/b/g, 'б'],
  [/D/g, 'Д'], [/d/g, 'д'],
  [/E/g, 'Е'], [/e/g, 'е'],
  [/F/g, 'Ф'], [/f/g, 'ф'],
  [/G/g, 'Г'], [/g/g, 'г'],
  [/H/g, 'Ҳ'], [/h/g, 'ҳ'],
  [/I/g, 'И'], [/i/g, 'и'],
  [/J/g, 'Ж'], [/j/g, 'ж'],
  [/K/g, 'К'], [/k/g, 'к'],
  [/L/g, 'Л'], [/l/g, 'л'],
  [/M/g, 'М'], [/m/g, 'м'],
  [/N/g, 'Н'], [/n/g, 'н'],
  [/O/g, 'О'], [/o/g, 'о'],
  [/P/g, 'П'], [/p/g, 'п'],
  [/Q/g, 'Қ'], [/q/g, 'қ'],
  [/R/g, 'Р'], [/r/g, 'р'],
  [/S/g, 'С'], [/s/g, 'с'],
  [/T/g, 'Т'], [/t/g, 'т'],
  [/U/g, 'У'], [/u/g, 'у'],
  [/V/g, 'В'], [/v/g, 'в'],
  [/X/g, 'Х'], [/x/g, 'х'],
  [/Y/g, 'Й'], [/y/g, 'й'],
  [/Z/g, 'З'], [/z/g, 'з'],
  // ── Misc ──
  [/ʼ/g, 'ъ'], [/'/g, 'ъ'], [/'/g, 'ъ'],
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

// ── Backend proxy provider (avoids CORS) ─────────────────────────────────────
const backendProvider: TranslationProvider = {
  name: 'backend-proxy',

  async translate(text, targetLocale, sourceLocale = 'auto') {
    // Special case: uz → uz-cyrl is a script conversion
    if (targetLocale === 'uz-cyrl') {
      const key = cacheKey(text, 'uz-cyrl', sourceLocale ?? 'auto');
      if (cache.has(key)) {
        return { text: cache.get(key)!, fromLocale: sourceLocale ?? 'auto', toLocale: 'uz-cyrl', cached: true };
      }
      let uzText = text;
      if (sourceLocale !== 'uz') {
        const intermediate = await backendProvider.translate(text, 'uz', sourceLocale);
        uzText = intermediate.text;
      }
      const cyrl = latinToCyrillic(uzText);
      cache.set(key, cyrl);
      return { text: cyrl, fromLocale: sourceLocale ?? 'auto', toLocale: 'uz-cyrl', cached: false };
    }

    const target = LOCALE_TO_ISO[targetLocale] ?? 'en';
    const source = sourceLocale === 'auto' ? 'auto' : (LOCALE_TO_ISO[sourceLocale] ?? 'auto');

    // Short-circuit if source and target are the same language and no translation needed.
    // Note: uz-cyrl is handled above with an early return, so it never reaches here.
    if (target === source && source !== 'auto') {
      return { text, fromLocale: source, toLocale: target, cached: true };
    }

    const key = cacheKey(text, target, source);
    if (cache.has(key)) {
      return { text: cache.get(key)!, fromLocale: source, toLocale: target, cached: true };
    }

    // Call backend proxy via apiClient to include the Authorization header automatically.
    const response = await apiClient.post('/listings/translate/', {
      text,
      target_lang: target,
    });

    const translated = response.data?.translated_text ?? text;

    cache.set(key, translated);
    return { text: translated, fromLocale: source, toLocale: target, cached: false };
  },
};

// ── Active provider (swap here to change engine) ──────────────────────────────
let activeProvider: TranslationProvider = backendProvider;

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
      let translated = result.text;
      // Preserve sentence case: if original starts with uppercase, translated should too
      if (translated && text.length > 0) {
        const originalFirstChar = text.trimStart()[0];
        if (originalFirstChar === originalFirstChar.toUpperCase() && originalFirstChar !== originalFirstChar.toLowerCase()) {
          translated = translated.charAt(0).toUpperCase() + translated.slice(1);
        }
      }
      return translated;
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
