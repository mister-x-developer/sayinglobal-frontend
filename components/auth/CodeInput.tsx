'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export function CodeInput({
  value,
  onChange,
  length = 5,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: CodeInputProps) {
  const t = useTranslations('auth');
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const lastValue = useRef(value);

  // Update focus when value changes (from paste or other updates)
  useEffect(() => {
    if (value.length > lastValue.current.length) {
      const nextFocus = Math.min(value.length, length - 1);
      inputs.current[nextFocus]?.focus();
    }
    lastValue.current = value;
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const clean = (value || '').replace(/\D/g, '').slice(0, length);
  const digits = clean.split('').concat(Array.from({ length: length - clean.length }, () => ''));

  return (
    <div className="relative">
      {/* Hidden real input that captures all keystrokes, pastes, and autofill securely */}
      <input
        value={clean}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, length);
          onChange(val);
        }}
        autoFocus={autoFocus}
        disabled={disabled}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        autoComplete="one-time-code"
        className="absolute inset-0 z-10 w-full h-full opacity-0 text-transparent bg-transparent caret-transparent cursor-text"
        style={{ color: 'transparent', textShadow: 'none' }}
        aria-label={t('codePlaceholder')}
      />

      {/* Fake UI boxes that display the value */}
      <div
        className="flex items-center justify-center gap-2 sm:gap-3 pointer-events-none"
        role="group"
        aria-hidden="true"
      >
        {Array.from({ length }).map((_, i) => {
          const ch = digits[i] || '';
          // The current active box is the one where the next digit will be typed
          // Or the last box if all are filled
          const isActive = clean.length === i || (clean.length === length && i === length - 1);
          
          return (
            <div
              key={i}
              className={`flex h-14 w-12 sm:h-16 sm:w-14 items-center justify-center rounded-xl border bg-input text-2xl font-semibold text-fg shadow-soft transition-all duration-200 ${
                hasError
                  ? 'border-danger ring-4 ring-danger/15'
                  : isActive && !disabled
                  ? 'border-brand-primary ring-4 ring-brand-primary/15'
                  : ch
                  ? 'border-brand-primary/60'
                  : 'border-input-border'
              } ${disabled ? 'opacity-60' : ''}`}
            >
              {ch}
            </div>
          );
        })}
      </div>
    </div>
  );
}
