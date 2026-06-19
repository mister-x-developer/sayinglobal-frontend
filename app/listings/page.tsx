'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
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
  const initialCategory = (searchParams.get('category')) as string;

  const [items, setItems] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>(initialCategory);
  const [region, setRegion] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<typeof SORTS[number]>('newestFirst');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setIsScrolled(true);
    } else if (latest < previous) {
      setIsScrolled(false);
    }
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPage(1);
    listingsApi
      .list({
        category: category === 'all' ? undefined : category,
        region: region ?? undefined,
        status: 'active',
        page: 1,
        page_size: pageSize,
      })
      .then((res) => {
        if (!alive) return;
        setItems(res.results ?? []);
        setTotalCount(res.count ?? 0);
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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const loadPage = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setLoading(true);
    setPage(nextPage);
    try {
      const res = await listingsApi.list({
        category: category === 'all' ? undefined : category,
        region: region ?? undefined,
        status: 'active',
        page: nextPage,
        page_size: pageSize,
      });
      setItems(res.results ?? []);
      setTotalCount(res.count ?? 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-4 sm:py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-eyebrow">{t('marketplace.title')}</p>
              <h1 className="display-md mt-2">{t('listings.title')}</h1>
              <p className="mt-2 text-fg-muted">{t('marketplace.feed')}</p>
            </div>
          </div>

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
                  {t('marketplace.showResults', { count: totalCount })}
                </p>
                <ListingGrid listings={filtered as any} />

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadPage(page - 1)}
                      disabled={!hasPrevPage || loading}
                      className={`inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-all ${
                        hasPrevPage
                          ? 'border-border bg-bg-elevated text-fg hover:bg-bg-subtle'
                          : 'cursor-not-allowed border-border/50 text-fg-subtle'
                      }`}
                    >
                      {t('common.previous')}
                    </button>
                    <span className="mx-2 text-sm text-fg-muted">
                      {t('common.page', { current: page, total: totalPages })}
                    </span>
                    <button
                      type="button"
                      onClick={() => loadPage(page + 1)}
                      disabled={!hasNextPage || loading}
                      className={`inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-all ${
                        hasNextPage
                          ? 'border-border bg-bg-elevated text-fg hover:bg-bg-subtle'
                          : 'cursor-not-allowed border-border/50 text-fg-subtle'
                      }`}
                    >
                      {t('common.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>


    </div>
  );
}
