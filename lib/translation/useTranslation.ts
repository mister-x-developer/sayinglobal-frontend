/**
 * useTranslation hook — centralized translation state management.
 *
 * Replaces scattered useState + translateText calls across components.
 * Provides consistent loading/error/translated state everywhere.
 *
 * Usage:
 *   const { translated, isLoading, isTranslated, toggle } = useTranslation(text);
 */

'use client';

import { useCallback, useState } from 'react';
import { useLocale } from 'next-intl';
import { translationProvider, type SupportedLocale } from './provider';

export type TranslationState = 'idle' | 'loading' | 'translated' | 'error';

export interface UseTranslationReturn {
  /** The currently displayed text (original or translated). */
  displayText: string;
  /** Whether translation is active. */
  isTranslated: boolean;
  /** Current state. */
  state: TranslationState;
  /** Toggle between original and translated. */
  toggle: () => Promise<void>;
  /** Reset to original. */
  reset: () => void;
}

export function useTranslation(
  originalText: string,
  sourceLocale?: string
): UseTranslationReturn {
  const locale = useLocale() as SupportedLocale;
  const [state, setState] = useState<TranslationState>('idle');
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  const toggle = useCallback(async () => {
    if (state === 'loading') return;

    if (state === 'translated') {
      setState('idle');
      setTranslatedText(null);
      return;
    }

    setState('loading');
    try {
      const result = await translationProvider.translate(originalText, locale, sourceLocale);

      // If result is same as original, no translation needed
      if (result === originalText) {
        setState('idle');
        return;
      }

      setTranslatedText(result);
      setState('translated');
    } catch {
      setState('error');
      // Auto-reset error state after 2s
      setTimeout(() => setState('idle'), 2000);
    }
  }, [originalText, locale, sourceLocale, state]);

  const reset = useCallback(() => {
    setState('idle');
    setTranslatedText(null);
  }, []);

  return {
    displayText: state === 'translated' && translatedText ? translatedText : originalText,
    isTranslated: state === 'translated',
    state,
    toggle,
    reset,
  };
}
