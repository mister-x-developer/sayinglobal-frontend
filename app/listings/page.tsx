'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LayoutGrid, MapPin, Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListingGridSkeleton } from '@/components/shared/LoadingStates';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';

const CATS = [
  { key: 'all' },
  { key: 'cattle' },
  { key: 'sheep' },
  { key: 'goats' },
  { key: 'horses' },
  { key: 'camels' },
  { key: 'poultry' },
] as const;

const REGIONS = [
  'tashkent',
  'samarkand',
  'bukhara',
  'andijan',
  'fergana',
  'namangan',
  'kashkadarya',
  'surkhandarya',
  'jizzakh',
  'navoi',
  'sirdarya',
  'khorezm',
  'karakalpakstan',
] as const;

const SORTS = ['newestFirst', 'oldestFirst', 'priceLowToHigh', 'priceHighToLow'] as const;

export default function ListingsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('category') ?? 'all') as string;

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>(initialCategory);
  const [region, setRegion] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<typeof SORTS[number]>('newestFirst');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listingsApi
      .list({ category: category === 'all' ? undefined : category, region: region ?? undefined })
      .then((res) => {
        if (!alive) return;
        setItems(res.results ?? []);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [category, region]);

  const filtered = useMemo(() => {
    let arr = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }
    arr = [...arr];
    switch (sort) {
      case 'priceLowToHigh':
        arr.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighToLow':
        arr.sort((a, b) => b.price - a.price);
        break;
      case 'oldestFirst':
        arr.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      default:
        arr.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return arr;
  }, [items, search, sort]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-eyebrow">{t('marketplace.title')}</p>
              <h1 className="display-md mt-2">{t('listings.title')}</h1>
              <p className="mt-2 text-fg-muted">{t('marketplace.feed')}</p>
            </div>
          </motion.div>

          {/* Search + filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <SearchIcon
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
                strokeWidth={1.75}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search.placeholder')}
                className="input-base h-12 w-full pl-11 pr-4"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle"
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="btn btn-secondary btn-sm"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
              {t('marketplace.filters')}
            </button>

            <div className="hidden sm:block">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof SORTS[number])}
                className="input-base h-12 cursor-pointer pr-9"
                aria-label={t('marketplace.sortBy')}
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`marketplace.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categories chips row — text only, no icons */}
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
            {CATS.map((c) => {
              const active = c.key === category;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`inline-flex h-10 flex-shrink-0 items-center rounded-full border px-5 text-sm font-semibold transition-all ${
                    active
                      ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                      : 'border-border bg-bg-elevated text-fg hover:border-brand-primary/40 hover:bg-bg-subtle'
                  }`}
                >
                  {t(`categories.${c.key}`)}
                </button>
              );
            })}
          </div>

          {/* Region filter — collapsible */}
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 overflow-hidden"
            >
              <div className="surface-elevated p-4">
                <p className="text-sm font-semibold text-fg">{t('listings.region')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRegion(null)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium ${
                      region === null
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-border bg-bg-elevated text-fg hover:bg-bg-subtle'
                    }`}
                  >
                    {t('common.all')}
                  </button>
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegion(r)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium ${
                        region === r
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-border bg-bg-elevated text-fg hover:bg-bg-subtle'
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {t(`regions.${r}`)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          <div className="mt-8">
            {loading ? (
              <ListingGridSkeleton count={8} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={LayoutGrid}
                title={t('marketplace.noResults')}
                description={t('marketplace.tryAdjusting')}
              />
            ) : (
              <>
                <p
                  className="mb-4 text-sm text-fg-muted"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {t('marketplace.showResults', { count: filtered.length })}
                </p>
                <ListingGrid listings={filtered as any} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Nearby Button */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-8 left-6 z-40 sm:bottom-10 sm:left-8"
        >
          <Link
            href={`/listings/nearby${category !== 'all' ? `?category=${category}` : ''}`}
            className="group flex items-center gap-3 rounded-2xl bg-brand-primary px-5 py-3.5 text-white shadow-[0_8px_32px_rgba(31,122,82,0.45)] transition-all hover:bg-brand-primary/90 hover:shadow-[0_12px_40px_rgba(31,122,82,0.55)] hover:scale-105 active:scale-95"
            aria-label={t('nearby.title' as any) ?? 'Nearby listings'}
          >
            <div className="relative">
              <MapPin className="h-5 w-5" strokeWidth={2} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-secondary ring-2 ring-brand-primary" />
            </div>
            <span className="text-sm font-bold tracking-wide">
              {t('nearby.title' as any) ?? 'Yaqin atrofda'}
            </span>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
