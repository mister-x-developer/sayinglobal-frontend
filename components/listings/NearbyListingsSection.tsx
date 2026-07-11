'use client';

/**
 * Nearby Listings — embedded section for the listing detail page.
 *
 * Tries up to three strategies in order, falling back gracefully:
 *   1. If the current listing has lat/lng → server-side GPS query within 50 km
 *      of the listing, same category if available.
 *   2. Otherwise → server-side region/district fallback, same category.
 *   3. If neither produces results → renders nothing (no fake "nearby" shell).
 *
 * Excludes the current listing from the result set.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';

import { ListingCard } from '@/components/listings/ListingCard';
import { listingsApi, type Listing } from '@/lib/api/listings';

interface Props {
  listing: Listing;
}

export function NearbyListingsSection({ listing }: Props) {
  const t = useTranslations();
  const [items, setItems] = useState<(Listing & { distance_km?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'gps' | 'region'>('region');

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const lat = listing.latitude != null ? Number(listing.latitude) : null;
    const lng = listing.longitude != null ? Number(listing.longitude) : null;
    const category = (listing.category as any)?.slug as string | undefined;

    const fetchNearby = async () => {
      let result: any = null;
      // Strategy 1: GPS
      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        try {
          const data = await listingsApi.nearby({
            lat, lng, radius_km: 50, category, page_size: 12,
          });
          const filtered = data.results.filter((l: any) => l.id !== listing.id);
          if (filtered.length > 0) {
            result = { ...data, results: filtered };
            setMode('gps');
          }
        } catch {/* fall through */}
      }
      // Strategy 2: region/district
      if (!result && listing.region) {
        try {
          const data = await listingsApi.nearby({
            region: listing.region,
            district: listing.district,
            category,
            page_size: 12,
          });
          const filtered = data.results.filter((l: any) => l.id !== listing.id);
          if (filtered.length > 0) {
            result = { ...data, results: filtered };
            setMode('region');
          }
        } catch {/* fall through */}
      }

      if (!alive) return;
      setItems((result?.results as any[]) ?? []);
      setLoading(false);
    };

    fetchNearby();
    return () => { alive = false; };
  }, [listing.id, listing.latitude, listing.longitude, listing.region, listing.district, listing.category]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <motion.div
      data-motion
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.22 }}
      className="surface-elevated p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-brand-accent" strokeWidth={1.75} />
          <h2 className="display-sm">{t('nearby.title' as any) ?? 'Nearby listings'}</h2>
        </div>
        <Link
          href={`/listings/nearby?category=${(listing.category as any)?.name ?? ''}`}
          className="text-sm font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
        >
          {t('common.showAll')}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        </Link>
      </div>

      <div className="mt-2 text-xs text-fg-subtle">
        {mode === 'gps'
          ? t('nearby.modeGps' as any, { km: 50 } as any) ?? 'Within 50 km'
          : t('nearby.modeRegion' as any) ?? 'Same region'}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.slice(0, 4).map((l) => (
          <div key={l.id} className="relative">
            <ListingCard listing={l as any} />
            {typeof l.distance_km === 'number' && (
              <span className="absolute left-3 top-3 rounded-full bg-bg-elevated/90 px-2 py-0.5 text-[10px] font-semibold text-fg-muted backdrop-blur">
                {l.distance_km < 1 ? '< 1 km' : `${l.distance_km.toFixed(1)} km`}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
