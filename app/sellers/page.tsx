'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search as SearchIcon, X, Users, MapPin, Compass } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { SellerCard } from '@/components/sellers/SellerCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SellerCardSkeleton } from '@/components/shared/LoadingStates';
import { usersApi } from '@/lib/api/users';
import { searchItems } from '@/lib/utils/search';

type GeoState =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'granted'; lat: number; lng: number }
  | { kind: 'denied' };

export default function SellersDirectoryPage() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'top' | 'new' | 'nearby'>('all');
  const [hydrated, setHydrated] = useState(false);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' });

  useEffect(() => setHydrated(true), []);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ kind: 'denied' });
      return;
    }
    setGeo({ kind: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ kind: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ kind: 'denied' }),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  // Auto-request location when user picks the Nearby tab.
  useEffect(() => {
    if (tab === 'nearby' && geo.kind === 'idle') {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Debounce remote search
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const handle = setTimeout(() => {
      const params: any = { q: search.trim() || undefined, pageSize: 60 };
      if (tab === 'nearby') {
        if (geo.kind !== 'granted') {
          // Wait for location
          if (alive) setLoading(false);
          return;
        }
        params.lat = geo.lat;
        params.lng = geo.lng;
        params.radius_km = 50;
        params.hasActive = true;
      } else {
        params.hasActive = tab !== 'new';
        if (tab === 'top' || tab === 'new') {
          params.sort = tab;
        }
      }
      usersApi
        .listSellers(params)
        .then((data) => {
          if (!alive) return;
          setSellers(data.results);
        })
        .catch(() => alive && setSellers([]))
        .finally(() => alive && setLoading(false));
    }, search ? 250 : 0);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [search, tab, geo]);

  const filtered = useMemo(() => {
    const arr = [...sellers];
    if (tab === 'top') {
      arr.sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0));
    }
    if (tab === 'new') {
      arr.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0));
    }
    return arr;
  }, [sellers, tab]);

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
          <div className="mt-5 flex gap-2 border-b border-border overflow-x-auto no-scrollbar">
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
                    active ? 'text-brand-primary' : 'text-fg-muted hover:text-fgʻ
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
            {loading || !hydrated ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SellerCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('sellers.noResults' as any) ?? 'Sotuvchilar topilmadi'}
                description={t('sellers.tryAdjusting' as any) ?? 'Boshqa qidiruv so\'zlarini sinab ko\'ring yoki joylashuvni o\'zgartiring'}
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
