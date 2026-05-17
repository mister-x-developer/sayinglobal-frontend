'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search as SearchIcon, X, Users } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { SellerCard } from '@/components/sellers/SellerCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { usersApi } from '@/lib/api/users';
import { searchItems } from '@/lib/utils/search';

export default function SellersDirectoryPage() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'top' | 'new'>('all');
  const [hydrated, setHydrated] = useState(false);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    usersApi
      .listSellers?.()
      .then((data: any) => {
        if (!alive) return;
        const arr = Array.isArray(data) ? data : data?.results ?? [];
        setSellers(arr);
      })
      .catch(() => alive && setSellers([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let arr = [...sellers];
    if (search.trim()) {
      arr = searchItems(arr, search, (s) => [s.full_name, s.full_name]);
    }
    if (tab === 'top') {
      arr.sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0));
    }
    if (tab === 'new') {
      arr.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0));
    }
    return arr;
  }, [sellers, search, tab]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-eyebrow">{t('sellers.title')}</p>
            <h1 className="display-md mt-2">{t('sellers.directory')}</h1>
            <p className="mt-2 text-fg-muted">{t('sellers.trustedSellers')}</p>
          </motion.div>

          {/* Search */}
          <div className="mt-6">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
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
          </div>

          {/* Tabs */}
          <div className="mt-5 flex gap-2 border-b border-border">
            {[
              { key: 'all', label: t('common.all') },
              { key: 'top', label: t('sellers.topSellers') },
              { key: 'new', label: t('sellers.newSellers') },
            ].map((tt) => {
              const active = tab === (tt.key as any);
              return (
                <button
                  key={tt.key}
                  type="button"
                  onClick={() => setTab(tt.key as any)}
                  className={`relative h-11 px-4 text-sm font-semibold transition-colors ${
                    active ? 'text-brand-primary' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {tt.label}
                  {active && (
                    <motion.span
                      layoutId="sellers-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="mt-6">
            {!hydrated ? null : filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('marketplace.noResults')}
                description={t('marketplace.tryAdjusting')}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => (
                  <SellerCard key={s.public_id} seller={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
