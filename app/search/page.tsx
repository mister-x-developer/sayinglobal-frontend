'use client';

import { Suspense,  useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Search as SearchIcon,
  X,
  Clock,
  TrendingUp,
  SlidersHorizontal,
  MapPin,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { ListingCard } from '@/components/listings/ListingCard';
import { SellerCard } from '@/components/sellers/SellerCard';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { usersApi, type SellerSummary } from '@/lib/api/users';
import { searchItems } from '@/lib/utils/search';

const STORAGE_KEY = 'sayin-recent-searches';
const MAX_RECENT = 8;

const POPULAR_KEYS = ['categories.cattle', 'categories.sheep', 'categories.horses', 'categories.goats', 'categories.camels', 'categories.poultry'] as const;
const CATS = ['cattle', 'sheep', 'goats', 'horses', 'camels', 'poultry'] as const;

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  if (typeof window === 'undefined') return;
  const prev = getRecent().filter((s) => s !== q);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}

function clearRecent() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}

type ResultTab = 'listings' | 'sellers';

function SearchPageContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [committed, setCommitted] = useState(searchParams.get('q') ?? '');
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<Listing[]>([]);
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<ResultTab>('listings');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    setRecent(getRecent());
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setSellers([]);
        return;
      }
      setLoading(true);
      try {
        const [listingsData, sellersData] = await Promise.all([
          listingsApi.search(q),
          usersApi.listSellers({ q, hasActive: true, pageSize: 30 }),
        ]);
        setResults(listingsData ?? []);
        setSellers(sellersData?.results ?? []);
      } catch {
        setResults([]);
        setSellers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    if (!committed) return;
    const t = setTimeout(() => doSearch(committed), 300);
    return () => clearTimeout(t);
  }, [committed, doSearch]);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 200) return;
    setCommitted(trimmed);
    saveRecent(trimmed);
    setRecent(getRecent());
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit(query);
  };

  const handleClear = () => {
    setQuery('');
    setCommitted('');
    setResults([]);
    router.replace('/search', { scroll: false });
    inputRef.current?.focus();
  };

  const filteredResults = useMemo(() => {
    let arr = [...results];
    if (priceMin) arr = arr.filter((l) => l.price >= Number(priceMin));
    if (priceMax) arr = arr.filter((l) => l.price <= Number(priceMax));
    if (region) arr = arr.filter((l) => l.region.toLowerCase().includes(region.toLowerCase()));
    return arr;
  }, [results, priceMin, priceMax, region]);

  const sellerResults = useMemo(() => {
    if (!committed) return [];
    return searchItems(sellers, committed, (s) => [
      s.full_name,
      s.bio ?? '',
    ]);
  }, [committed, sellers]);

  const hasResults = committed && (filteredResults.length > 0 || sellerResults.length > 0);
  const noResults = committed && !loading && filteredResults.length === 0 && sellerResults.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          {/* Search input */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-2xl"
          >
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-subtle"
                strokeWidth={1.75}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('search.placeholder')}
                className="input-base h-14 w-full pl-12 pr-24 text-base"
                autoComplete="off"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle"
                    aria-label={t('common.close')}
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSubmit(query)}
                  className="btn btn-primary btn-sm"
                >
                  {t('common.search')}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Empty state — show suggestions */}
          {!committed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mx-auto mt-8 max-w-2xl space-y-8"
            >
              {/* Recent */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-fg">{t('search.recentSearches')}</p>
                    <button
                      type="button"
                      onClick={() => { clearRecent(); setRecent([]); }}
                      className="text-xs text-fg-subtle hover:text-danger"
                    >
                      {t('search.clearHistory')}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setQuery(r); handleSubmit(r); }}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3.5 py-2 text-sm text-fg hover:bg-bg-subtle"
                      >
                        <Clock className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular */}
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-primary" strokeWidth={1.75} />
                  <p className="text-sm font-semibold text-fg">{t('search.popularSearches')}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_KEYS.map((k) => {
                    const label = t(k as any);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setQuery(label); handleSubmit(label); }}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3.5 py-2 text-sm text-fg hover:bg-bg-subtle"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-sm font-semibold text-fg">{t('landing.categoriesTitle')}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {CATS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => router.push(`/listings?category=${c}`)}
                      className="surface-elevated group flex flex-col items-center gap-2 p-3 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                    >
                      <span className="text-brand-primary group-hover:scale-110 transition-transform">
                        <CategoryIcon name={c} className="h-7 w-7" />
                      </span>
                      <span className="text-xs font-medium text-fg">{t(`categories.${c}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {committed && (
            <div className="mt-8">
              {/* Filters toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {hasResults && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTab('listings')}
                        className={`relative h-10 px-4 text-sm font-semibold transition-colors ${
                          tab === 'listings' ? 'text-brand-primary' : 'text-fg-muted hover:text-fg'
                        }`}
                      >
                        {t('listings.title')}
                        {tab === 'listings' && (
                          <motion.span layoutId="search-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('sellers')}
                        className={`relative h-10 px-4 text-sm font-semibold transition-colors ${
                          tab === 'sellers' ? 'text-brand-primary' : 'text-fg-muted hover:text-fg'
                        }`}
                      >
                        {t('sellers.title')}
                        {tab === 'sellers' && (
                          <motion.span layoutId="search-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary" />
                        )}
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  className="btn btn-secondary btn-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
                  {t('marketplace.filters')}
                </button>
              </div>

              {/* Filter panel */}
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="surface-elevated grid gap-4 p-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-fg-muted uppercase tracking-wider">
                          {t('listings.price')} (min)
                        </label>
                        <input
                          type="number"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          placeholder="0"
                          className="input-base h-10 w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-fg-muted uppercase tracking-wider">
                          {t('listings.price')} (max)
                        </label>
                        <input
                          type="number"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          placeholder="∞"
                          className="input-base h-10 w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-fg-muted uppercase tracking-wider">
                          {t('listings.region')}
                        </label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
                          <input
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder={t('listings.region')}
                            className="input-base h-10 w-full pl-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading */}
              {loading && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="surface-elevated overflow-hidden">
                      <div className="aspect-[4/3] skeleton" />
                      <div className="p-4"><div className="skeleton h-4 w-3/4" /></div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {noResults && (
                <div className="mt-8">
                  <EmptyState
                    icon={SearchIcon}
                    title={t('search.noResults')}
                    description={t('search.tryDifferent')}
                  />
                </div>
              )}

              {/* Results grid */}
              {!loading && hasResults && (
                <div className="mt-6" aria-live="polite">
                  {tab === 'listings' && (
                    <>
                      <p className="mb-4 text-sm text-fg-muted">
                        {t('marketplace.showResults', { count: filteredResults.length })}
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredResults.map((l) => (
                          <ListingCard key={l.id} listing={l as any} />
                        ))}
                      </div>
                    </>
                  )}
                  {tab === 'sellers' && (
                    sellerResults.length === 0 ? (
                      <EmptyState icon={SearchIcon} title={t('search.noResults')} description={t('search.tryDifferent')} />
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sellerResults.map((s) => (
                          <SellerCard key={s.id} seller={s} />
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-8"><div className="spinner"></div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
