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

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      // Handle backspace (empty)
      const newValue = clean.slice(0, i) + clean.slice(i + 1);
      onChange(newValue);
      if (i > 0) inputs.current[i - 1]?.focus();
      return;
    }
    if (v.length === 1) {
      // Single digit typed
      const newValue = (clean.slice(0, i) + v + clean.slice(i + 1)).slice(0, length);
      onChange(newValue);
      if (i < length - 1) inputs.current[i + 1]?.focus();
    } else {
      // Multiple digits typed (rare, but handle)
      const newValue = (clean.slice(0, i) + v + clean.slice(i)).slice(0, length);
      onChange(newValue);
      const focusIdx = Math.min(i + v.length, length - 1);
      inputs.current[focusIdx]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[i] && i > 0) {
        // If current is empty, move back and delete previous
        const newValue = clean.slice(0, i - 1) + clean.slice(i);
        onChange(newValue);
        inputs.current[i - 1]?.focus();
        e.preventDefault();
      } else if (digits[i]) {
        // Delete current digit
        const newValue = clean.slice(0, i) + clean.slice(i + 1);
        onChange(newValue);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (text) {
      onChange(text);
    }
  };

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label={t('codePlaceholder')}
      aria-describedby={hasError ? 'code-error' : undefined}
    >
      {Array.from({ length }).map((_, i) => {
        const ch = digits[i] || '';
        return (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            disabled={disabled}
            value={ch ?? ''}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Raqam ${i + 1}`}
            className={`h-14 w-12 sm:h-16 sm:w-14 rounded-xl border bg-input text-center text-2xl font-semibold text-fg shadow-soft transition-all duration-200 focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/15 ${
              hasError
                ? 'border-danger ring-4 ring-danger/15'
                : ch
                ? 'border-brand-primary/60'
                : 'border-input-border'
            } ${disabled ? 'opacity-60' : ''}`}
          />
        );
      })}
    </div>
  );
}
