/**
 * useForm — centralized form state management.
 *
 * Provides consistent:
 * - Field state management
 * - Validation
 * - Loading/saving states
 * - Error handling
 * - Optimistic submit behavior
 *
 * Usage:
 *   const { form, set, errors, saving, saved, handleSubmit } = useForm({
 *     initial: { title: '', price: '' },
 *     validate: (data) => { ... },
 *     onSubmit: async (data) => { ... },
 *   });
 */

'use client';

import { useCallback, useState } from 'react';
import { extractErrorMessage, parseValidationErrors } from '../utils/errors';
import { toast } from '@/components/ui/Toast';

type FormState = 'idle' | 'saving' | 'saved' | 'error';

interface UseFormOptions<T extends Record<string, unknown>> {
  initial: T;
  validate?: (data: T) => Record<string, string>;
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useForm<T extends Record<string, unknown>>({
  initial,
  validate,
  onSubmit,
  onSuccess,
  successMessage,
  errorMessage,
}: UseFormOptions<T>) {
  const [form, setForm] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<FormState>('idle');

  const set = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    setErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const setMany = useCallback((updates: Partial<T>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (state === 'saving') return;

      // Client-side validation
      if (validate) {
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      setState('saving');
      setErrors({});

      try {
        await onSubmit(form);
        setState('saved');
        if (successMessage) toast.success(successMessage);
        onSuccess?.();
        // Reset to idle after 2s
        setTimeout(() => setState('idle'), 2000);
      } catch (err) {
        setState('error');
        // Try to extract field-level errors
        const fieldErrors = parseValidationErrors(err);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          const msg = extractErrorMessage(err);
          if (errorMessage) toast.error(errorMessage);
          else toast.error(msg);
        }
        setTimeout(() => setState('idle'), 100);
      }
    },
    [form, state, validate, onSubmit, onSuccess, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setForm(initial);
    setErrors({});
    setState('idle');
  }, [initial]);

  return {
    form,
    set,
    setMany,
    errors,
    setErrors,
    state,
    saving: state === 'saving',
    saved: state === 'saved',
    handleSubmit,
    reset,
  };
}
