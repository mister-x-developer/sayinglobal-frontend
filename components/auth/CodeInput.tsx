'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

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
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const clean = (value || '').replace(/\D/g, '').slice(0, length);
  const digits = clean.split('').concat(Array.from({ length: length - clean.length }, () => ''));

  const setAt = (index: number, char: string) => {
    const arr = digits.slice();
    arr[index] = char || '';
    const next = arr.join('').replace(/\D/g, '').slice(0, length);
    onChange(next);
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      setAt(i, '');
      return;
    }
    if (v.length === 1) {
      setAt(i, v);
      if (i < length - 1) inputs.current[i + 1]?.focus();
    } else {
      // Pasted multiple (safety net, though maxLength=1 + paste handler should catch most)
      const trimmed = v.slice(0, length - i);
      const arr = digits.slice();
      for (let k = 0; k < trimmed.length; k++) {
        arr[i + k] = trimmed[k];
      }
      const next = arr.join('').replace(/\D/g, '').slice(0, length);
      onChange(next);
      const focusIdx = Math.min(i + trimmed.length, length - 1);
      inputs.current[focusIdx]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[i]) {
        if (i > 0) {
          inputs.current[i - 1]?.focus();
          setAt(i - 1, '');
          e.preventDefault();
        }
      } else {
        setAt(i, '');
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
      const focusIdx = Math.min(text.length, length - 1);
      inputs.current[focusIdx]?.focus();
    }
  };

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label="Tasdiqlash kodi"
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
