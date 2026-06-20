'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Heart, LayoutGrid, List } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuthStore } from '@/lib/store/auth';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { useLocale } from 'next-intl';
import { getLocalizedListingTitle } from '@/lib/utils/format';

type ViewMode = 'grid' | 'list';

export default function FavoritesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const locale = useLocale();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('grid');

  useEffect(() => setHydrated(true), []);
  /* auth gating handled by middleware */

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    setLoading(true);
    listingsApi
      .favorites()
      .then((data) => {
        if (!alive) return;
        setItems(data ?? []);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [isAuthenticated]);

  const handleUnfavorite = async (id: number) => {
    setItems((prev) => prev.filter((l) => l.public_id !== id));
    try {
      await listingsApi.toggleFavorite(id);
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <p className="text-eyebrow">{t('profile.favorites')}</p>
              <h1 className="display-md mt-2">{t('listings.favorites')}</h1>
              {items.length > 0 && (
                <p className="mt-2 text-fg-muted">
                  {t('listings.favoriteCount', { count: items.length })}
                </p>
              )}
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl border border-border bg-bg-elevated p-1">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    view === 'grid' ? 'bg-bg-subtle text-fg' : 'text-fg-muted hover:text-fg'
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    view === 'list' ? 'bg-bg-subtle text-fg' : 'text-fg-muted hover:text-fg'
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            )}
          </motion.div>

          <div className="mt-8">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="surface-elevated overflow-hidden">
                    <div className="aspect-[4/3] skeleton" />
                    <div className="p-4">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton mt-2 h-3 w-1/2" />
                      <div className="skeleton mt-3 h-5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Heart}
                title={t('empty.noFavorites')}
                description={t('empty.noFavoritesDescription')}
                action={
                  <Link href="/listings" className="btn btn-primary btn-sm">
                    {t('marketplace.title')}
                  </Link>
                }
              />
            ) : view === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((l) => (
                  <ListingCard
                    key={l.public_id}
                    listing={{ ...l, is_favorited: true } as any}
                    onFavorite={handleUnfavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((l, i) => (
                  <motion.div
                    key={l.public_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  >
                    <Link href={`/listings/detail?id=${l.public_id}`} className="surface-elevated group flex items-start gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                      <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-bg-subtle sm:h-24 sm:w-32">
                        <div className="absolute inset-0 flex items-center justify-center text-fg-subtle opacity-40">
                          <svg width="40" height="40" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="6" y="14" width="52" height="36" rx="4" />
                            <circle cx="22" cy="28" r="4" />
                            <path d="M58 42 L42 28 L22 46 L6 38" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-semibold text-fg">{getLocalizedListingTitle(l, locale)}</h3>
                        <p className="mt-1 text-sm text-fg-muted">{l.location}</p>
                        <p className="mt-2 font-display text-lg font-bold text-fg">
                          {new Intl.NumberFormat('uz-UZ').format(l.price)} so&apos;m
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleUnfavorite(l.public_id); }}
                        className="flex-shrink-0 text-danger"
                        aria-label="Remove from favorites"
                      >
                        <Heart className="h-5 w-5 fill-current" strokeWidth={0} />
                      </button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
