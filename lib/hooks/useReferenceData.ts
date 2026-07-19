/**
 * useReferenceData — centralized hook for backend-driven reference data.
 *
 * Provides: categories, regions, breeds — all locale-aware.
 * Caches at module level to avoid redundant API calls.
 * Falls back to static data when backend is unavailable.
 */

'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { referenceApi, type Category, type Region, type Breed } from '../api/reference';
import { FALLBACK_CATEGORIES } from './fallbackCategories';

// Module-level cache — survives component remounts
const _cache: {
  categories: Map<string, Category[]>;
  regions: Map<string, Region[]>;
  breeds: Map<string, Breed[]>;
} = {
  categories: new Map(),
  regions: new Map(),
  breeds: new Map(),
};

export function useCategories() {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>(_cache.categories.get(locale) ?? FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(!_cache.categories.has(locale));

  useEffect(() => {
    if (_cache.categories.has(locale)) {
      setCategories(_cache.categories.get(locale)!);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    referenceApi.getCategories(locale).then((data) => {
      if (!alive) return;
      const finalData = data && data.length > 0 ? data : FALLBACK_CATEGORIES;
      _cache.categories.set(locale, finalData);
      setCategories(finalData);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [locale]);

  return { categories, loading };
}

export function useRegions() {
  const locale = useLocale();
  const [regions, setRegions] = useState<Region[]>(_cache.regions.get(locale) ?? []);
  const [loading, setLoading] = useState(!_cache.regions.has(locale));

  useEffect(() => {
    if (_cache.regions.has(locale)) {
      setRegions(_cache.regions.get(locale)!);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    referenceApi.getRegions(locale).then((data) => {
      if (!alive) return;
      if (data.length > 0) {
        _cache.regions.set(locale, data);
        setRegions(data);
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [locale]);

  return { regions, loading };
}

export function useBreeds(categorySlug: string) {
  const locale = useLocale();
  const cacheKey = `${locale}:${categorySlug}`;
  const [breeds, setBreeds] = useState<Breed[]>(_cache.breeds.get(cacheKey) ?? []);
  const [loading, setLoading] = useState(!!categorySlug && !_cache.breeds.has(cacheKey));

  useEffect(() => {
    if (!categorySlug) { setBreeds([]); return; }
    if (_cache.breeds.has(cacheKey)) {
      setBreeds(_cache.breeds.get(cacheKey)!);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    referenceApi.getBreeds(categorySlug, locale).then((data) => {
      if (!alive) return;
      _cache.breeds.set(cacheKey, data);
      setBreeds(data);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [categorySlug, locale, cacheKey]);

  return { breeds, loading };
}

/** Invalidate all reference data caches (e.g., after admin update). */
export function invalidateReferenceCache() {
  _cache.categories.clear();
  _cache.regions.clear();
  _cache.breeds.clear();
  referenceApi.clearCache();
}
