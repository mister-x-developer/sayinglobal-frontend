'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Languages, Loader2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/translation/useTranslation';

interface TranslateButtonProps {
  text: string;
  sourceLocale?: string;
  /** Called with translated text (null = reverted to original). */
  onTranslated?: (translated: string | null) => void;
  /** Compact mode — icon only, no label. */
  compact?: boolean;
  className?: string;
}

/**
 * Inline translate button.
 * Uses the centralized useTranslation hook.
 * Consistent state, loading, error handling everywhere.
 */
export function TranslateButton({
  text,
  sourceLocale,
  onTranslated,
  compact = false,
  className = '',
}: TranslateButtonProps) {
  const t = useTranslations();
  const { isTranslated, state, toggle, displayText } = useTranslation(text, sourceLocale);

  return (
    <button
      type="button"
      onClick={async () => {
        const wasTranslated = isTranslated;
        await toggle();
        if (wasTranslated) {
          onTranslated?.(null);
        }
      }}
      disabled={state === 'loading'}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
        isTranslated
          ? 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
          : state === 'error'
          ? 'bg-danger/10 text-danger'
          : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated hover:text-fg'
      } ${className}`}
      aria-label={isTranslated ? t('common.showOriginal' as any) : t('common.translate' as any)}
      aria-pressed={isTranslated}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'loading' ? (
          <motion.span key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          </motion.span>
        ) : isTranslated ? (
          <motion.span key="revert" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          </motion.span>
        ) : (
          <motion.span key="translate" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Languages className="h-3.5 w-3.5" strokeWidth={1.75} />
          </motion.span>
        )}
      </AnimatePresence>

      {!compact && (
        <span>
          {state === 'loading'
            ? '...'
            : state === 'error'
            ? '!'
            : isTranslated
            ? t('common.showOriginal' as any)
            : t('common.translate' as any)}
        </span>
      )}
    </button>
  );
}

/**
 * TranslatableText — self-contained translatable block.
 * Uses useTranslation hook internally. No prop drilling needed.
 */
export function TranslatableText({
  text,
  sourceLocale,
  className = '',
  textClassName = '',
}: {
  text: string;
  sourceLocale?: string;
  className?: string;
  textClassName?: string;
}) {
  const t = useTranslations();
  const { displayText, isTranslated, state, toggle } = useTranslation(text, sourceLocale);

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={isTranslated ? 'translated' : 'original'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={textClassName}
        >
          {displayText}
        </motion.p>
      </AnimatePresence>

      <div className="mt-2">
        <button
          type="button"
          onClick={toggle}
          disabled={state === 'loading'}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
            isTranslated
              ? 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
              : state === 'error'
              ? 'bg-danger/10 text-danger'
              : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated hover:text-fg'
          }`}
          aria-pressed={isTranslated}
        >
          {state === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : isTranslated ? (
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <Languages className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          <span>
            {state === 'loading'
              ? '...'
              : isTranslated
              ? t('common.showOriginal' as any)
              : t('common.translate' as any)}
          </span>
        </button>
      </div>
    </div>
  );
}
