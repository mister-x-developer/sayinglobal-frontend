'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  ArrowRight,
  Plus,
  Search as SearchIcon,
  Heart,
  MessageSquareText,
  Users,
  ShieldCheck,
  LayoutGrid,
  Sparkles,
  MapPin,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { ListingGridSkeleton } from '@/components/shared/LoadingStates';
import { useAuthStore } from '@/lib/store/auth';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';

const CATEGORIES = [
  { key: 'cattle', image: '/categories_images/cattle.webp' },
  { key: 'sheep', image: '/categories_images/sheep.webp' },
  { key: 'goats', image: '/categories_images/goats.webp' },
  { key: 'horses', image: '/categories_images/horses.webp' },
  { key: 'camels', image: '/categories_images/camels.webp' },
  { key: 'poultry', image: '/categories_images/poultry.webp' },
  { key: 'rabbits', image: '/categories_images/cattle.webp' }, // placeholder
  { key: 'bees', image: '/categories_images/cattle.webp' }, // placeholder
  { key: 'fish', image: '/categories_images/cattle.webp' }, // placeholder
] as const;
export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  // Auth gating is handled by middleware; pages don't redirect on their own.
  const [feed, setFeed] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listingsApi
      .list({ page_size: 8 })
      .then((res) => {
        if (!alive) return;
        setFeed(res.results ?? []);
      })
      .catch(() => alive && setFeed([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            data-motion
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-eyebrow">{t('common.welcome')}</p>
              <h1 className="display-md mt-2">
                {user?.full_name?.split(' ')[0] ?? t('common.welcome')}
              </h1>
              <p className="mt-2 text-fg-muted">{t('marketplace.feed')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/search" className="btn btn-secondary btn-sm">
                <SearchIcon className="h-4 w-4" strokeWidth={1.75} />
                {t('common.search')}
              </Link>
              <Link href="/listings/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                {t('nav.createListing')}
              </Link>
            </div>
          </motion.div>

          {/* Quick links */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                href: '/listings',
                icon: LayoutGrid,
                label: t('nav.listings'),
                tone: 'bg-brand-primary/10 text-brand-primary',
              },
              {
                href: '/sellers',
                icon: ShieldCheck,
                label: t('nav.sellers'),
                tone: 'bg-brand-accent/12 text-brand-accent',
              },
              {
                href: '/listings/nearby',
                icon: MapPin,
                label: t('nearby.title' as any) ?? 'Yaqin atrofdagi',
                tone: 'bg-success/12 text-success',
              },
              {
                href: '/profile/favorites',
                icon: Heart,
                label: t('nav.favorites'),
                tone: 'bg-warning/12 text-warning',
              },
              {
                href: '/chat',
                icon: MessageSquareText,
                label: t('nav.chat'),
                tone: 'bg-info/12 text-info',
              },
            ].map((q, i) => {
              const Icon = q.icon;
              return (
                <motion.div
                  key={q.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={q.href}
                    className="surface-elevated group flex h-full items-center justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${q.tone}`}>
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <span className="font-semibold text-fg">{q.label}</span>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 text-fg-subtle transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Categories */}
          <div className="mt-12">
            <div className="flex items-end justify-between">
              <h2 className="display-sm">{t('landing.categoriesTitle')}</h2>
              <Link href="/listings" className="text-sm font-semibold text-brand-primary hover:underline">
                {t('common.showAll')}
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-9">
              {CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <Link
                    href={`/listings?category=${cat.key}`}
                    className="surface-elevated group relative flex aspect-square flex-col items-center justify-end overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift hover:border-brand-primary/30"
                  >
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src={cat.image}
                        alt={t(`categories.${cat.key}`)}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 17vw, 11vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/85" />
                    <div className="relative z-10 w-full p-2 text-center">
                      <p className="text-xs font-semibold text-white sm:text-sm">
                        {t(`categories.${cat.key}`)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div className="mt-14">
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-accent" strokeWidth={1.75} />
                <h2 className="display-sm">{t('marketplace.recommended')}</h2>
              </div>
              <Link href="/listings" className="text-sm font-semibold text-brand-primary hover:underline">
                {t('common.showAll')}
              </Link>
            </div>

            <div className="mt-5">
              {loading ? (
                <ListingGridSkeleton count={4} />
              ) : (
                <ListingGrid listings={feed as any} />
              )}
            </div>
          </div>

          {/* Nearby listings — geo-aware section */}
          <div className="mt-14">
            <DashboardNearby />
          </div>
        </div>
      </main>
    </div>
  );
}


/**
 * Dashboard Nearby preview — geo-aware mini-feed.
 *
 * Tries the browser geolocation API first. If denied / unavailable,
 * silently renders nothing (the regular recommended feed still serves).
 */
function DashboardNearby() {
  const t = useTranslations();
  const [items, setItems] = useState<(Listing & { distance_km?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGeo, setHasGeo] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await listingsApi.nearby({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            radius_km: 50,
            page_size: 8,
          });
          setItems(data.results);
          setHasGeo(true);
        } catch {
          /* ignore */
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 5 * 60_000 },
    );
  }, []);

  if (loading || !hasGeo || items.length === 0) return null;

  return (
    <>
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-brand-accent" strokeWidth={1.75} />
          <h2 className="display-sm">{t('nearby.title' as any) ?? 'Nearby'}</h2>
        </div>
        <Link href="/listings/nearby" className="text-sm font-semibold text-brand-primary hover:underline">
          {t('common.showAll')}
        </Link>
      </div>
      <div className="mt-5">
        <ListingGrid listings={items as any} />
      </div>
    </>
  );
}
