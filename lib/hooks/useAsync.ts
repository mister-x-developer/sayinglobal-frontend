/**
 * useAsync — centralized async data fetching with consistent loading/error states.
 *
 * Replaces scattered useState + useEffect + try/catch patterns.
 * Provides: data, loading, error, refetch, reset.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useAsync(
 *     () => listingsApi.list(),
 *     { fallback: [], deps: [category] }
 *   );
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAsyncOptions<T> {
  /** Fallback value when data is not yet loaded or on error. */
  fallback?: T;
  /** Dependencies that trigger a refetch. */
  deps?: unknown[];
  /** Whether to skip the initial fetch. */
  skip?: boolean;
  /** Called on success. */
  onSuccess?: (data: T) => void;
  /** Called on error. */
  onError?: (error: unknown) => void;
}

interface UseAsyncReturn<T> {
  data: T;
  loading: boolean;
  error: unknown;
  refetch: () => void;
  reset: () => void;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> {
  const { fallback, deps = [], skip = false, onSuccess, onError } = options;

  const [data, setData] = useState<T>(fallback as T);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<unknown>(null);
  const mountedRef = useRef(true);
  const fetchRef = useRef(fn);
  fetchRef.current = fn;

  const execute = useCallback(() => {
    if (skip) return;
    let alive = true;
    setLoading(true);
    setError(null);

    fetchRef.current()
      .then((result) => {
        if (!alive || !mountedRef.current) return;
        setData(result);
        setLoading(false);
        onSuccess?.(result);
      })
      .catch((err) => {
        if (!alive || !mountedRef.current) return;
        setError(err);
        setLoading(false);
        if (fallback !== undefined) setData(fallback as T);
        onError?.(err);
      });

    return () => { alive = false; };
  }, [skip, fallback, onSuccess, onError]);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = execute();
    return () => {
      mountedRef.current = false;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const reset = useCallback(() => {
    setData(fallback as T);
    setError(null);
    setLoading(false);
  }, [fallback]);

  return { data, loading, error, refetch: execute, reset };
}
