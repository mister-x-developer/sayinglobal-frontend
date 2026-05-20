'use client';

/**
 * Nearby Listings.
 *
 * Strategy:
 *   1. Try `navigator.geolocation` with a 6-second timeout.
 *      - If permission granted → fetch `/api/listings/nearby/?lat=&lng=&radius_km=`
 *      - If denied / timeout    → fall back to `/api/listings/nearby/?region=&district=`
 *   2. The page UI:
 *      - Map of nearby listings (one pin per result)
 *      - Distance chip on each card when GPS mode is active
 *      - Category filter chips
 *      - Radius slider (5 / 25 / 50 / 100 / 250 km)
 *      - Manual region/district fallback when GPS is unavailable
 *
 * Always renders something useful — never a "no map available" dead end.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  MapPin,
  Compass,
  Loader2,
  Filter,
  X,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { EmptyState } from '@/components/shared/EmptyState';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { MapView } from '@/components/shared/MapView';
import { listingsApi, type Listing } from '@/lib/api/listings';
import { referenceApi } from '@/lib/api/reference';

const CATEGORIES = ['cattle', 'sheep', 'goats', 'horses', 'camels', 'poultry'] as const;
const RADIUS_OPTIONS = [5, 25, 50, 100, 250] as const;

type GeoState =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'granted'; lat: number; lng: number }
  | { kind: 'denied' };

export default function NearbyListingsPage() {
  const t = useTranslations();

  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' });
  const [category, setCategory] = useState<typeof CATEGORIES[number] | null>(null);
  const [radius, setRadius] = useState<typeof RADIUS_OPTIONS[number]>(50);

  // Region fallback
  const [regions, setRegions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [region, setRegion] = useState<string>('');
  const [district, setDistrict] = useState<string>('');

  const [results, setResults] = useState<(Listing & { distance_km?: number })[]>([]);
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<'gps' | 'region'>('region');
  const [loading, setLoading] = useState(false);

  // Ask for location on first paint
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ kind: 'denied' });
      return;
    }
    setGeo({ kind: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ kind: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ kind: 'denied' }),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60_000 },
    );
  }, []);

  // Load reference regions for the fallback selector
  useEffect(() => {
    referenceApi
      .getRegions()
      .then((rs) => setRegions(rs))
      .catch(() => setRegions([]));
  }, []);

  // Load districts when region changes
  useEffect(() => {
    if (!region) { setDistricts([]); setDistrict(''); return; }
    referenceApi
      .getDistricts(region)
      .then((ds) => setDistricts(ds))
      .catch(() => setDistricts([]));
  }, [region]);

  // Re-run query whenever inputs change
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        const params: any = { category: category || undefined, page_size: 30 };
        if (geo.kind === 'granted') {
          params.lat = geo.lat;
          params.lng = geo.lng;
          params.radius_km = radius;
        } else if (region) {
          params.region = region;
          if (district) params.district = district;
        }
        const data = await listingsApi.nearby(params);
        if (!alive) return;
        setResults(data.results);
        setCount(data.count);
        setMode(data.mode);
      } catch {
        if (!alive) return;
        setResults([]);
        setCount(0);
      } finally {
        if (alive) setLoading(false);
      }
    };
    if (geo.kind === 'requesting' || geo.kind === 'idle') return; // wait for geo decision
    run();
    return () => { alive = false; };
  }, [geo, category, radius, region, district]);

  const mapMarkers = useMemo(
    () => results
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        id: r.public_id,
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        label: r.title,
        href: `/listings/${r.public_id}`,
      })),
    [results],
  );

  const center: [number, number] | null =
    geo.kind === 'granted' ? [geo.lat, geo.lng] : null;

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
            <p className="text-eyebrow">{t('nearby.eyebrow' as any) ?? t('nav.listings')}</p>
            <h1 className="display-md mt-2">{t('nearby.title' as any) ?? 'Nearby listings'}</h1>
            <p className="mt-2 text-fg-muted inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" strokeWidth={1.75} />
              {mode === 'gps'
                ? t('nearby.modeGps' as any, { km: radius } as any) ?? `Within ${radius} km`
                : t('nearby.modeRegion' as any) ?? 'Filter by region / district'}
            </p>
          </motion.div>

          {/* Filters */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-5">
              {/* Geolocation status */}
              <div className="surface-elevated p-5">
                <h3 className="text-eyebrow">{t('nearby.location' as any) ?? 'Location'}</h3>
                {geo.kind === 'granted' ? (
                  <p className="mt-2 text-sm text-fg-muted">
                    {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}
                  </p>
                ) : geo.kind === 'requesting' ? (
                  <p className="mt-2 text-sm text-fg-muted inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    {t('nearby.requesting' as any) ?? 'Requesting location...'}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-fg-muted">
                    {t('nearby.permissionDenied' as any) ?? 'Location not available — using region fallback.'}
                  </p>
                )}

                {geo.kind === 'denied' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      setGeo({ kind: 'requesting' });
                      navigator.geolocation.getCurrentPosition(
                        (pos) => setGeo({ kind: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        () => setGeo({ kind: 'denied' }),
                        { enableHighAccuracy: true, timeout: 6000 },
                      );
                    }}
                    className="btn btn-secondary btn-sm mt-3 w-full"
                  >
                    <Compass className="h-3.5 w-3.5" strokeWidth={2} />
                    {t('nearby.tryAgain' as any) ?? 'Try again'}
                  </button>
                )}
              </div>

              {/* Radius (only useful when GPS available) */}
              {geo.kind === 'granted' && (
                <div className="surface-elevated p-5">
                  <h3 className="text-eyebrow">{t('nearby.radius' as any) ?? 'Radius'}</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadius(r)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          r === radius
                            ? 'bg-brand-primary text-white'
                            : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="surface-elevated p-5">
                <h3 className="text-eyebrow">{t('listings.category')}</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 text-xs ${
                      category === null ? 'bg-brand-primary/10 text-brand-primary' : 'text-fg-muted hover:bg-bg-subtle'
                    }`}
                  >
                    <Filter className="h-4 w-4" strokeWidth={1.75} />
                    {t('common.all')}
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c === category ? null : c)}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2 text-xs ${
                        c === category
                          ? 'bg-brand-primary/10 text-brand-primary'
                          : 'text-fg-muted hover:bg-bg-subtle'
                      }`}
                    >
                      <CategoryIcon name={c} className="h-5 w-5" />
                      {t(`categories.${c}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region fallback */}
              {geo.kind !== 'granted' && (
                <div className="surface-elevated p-5">
                  <h3 className="text-eyebrow">{t('listings.region')}</h3>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="input-base mt-2 w-full"
                  >
                    <option value="">{t('common.all')}</option>
                    {regions.map((r: any) => (
                      <option key={r.slug} value={r.slug}>{r.name_uz ?? r.name}</option>
                    ))}
                  </select>

                  {region && districts.length > 0 && (
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="input-base mt-3 w-full"
                    >
                      <option value="">{t('common.all')}</option>
                      {districts.map((d: any) => (
                        <option key={d.slug} value={d.slug}>{d.name_uz ?? d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Map + results */}
            <div className="space-y-6">
              {(mapMarkers.length > 0 || center) && (
                <MapView
                  center={center ?? (mapMarkers[0] ? [mapMarkers[0].lat, mapMarkers[0].lng] : null)}
                  zoom={geo.kind === 'granted' ? 11 : 6}
                  markers={mapMarkers}
                  className="h-80 w-full"
                  fallbackCaption={t('marketplace.mapUnavailable' as any) ?? undefined}
                />
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
                </div>
              ) : results.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title={t('nearby.empty' as any) ?? 'No nearby listings'}
                  description={t('nearby.emptyDesc' as any) ?? 'Try adjusting the radius or category.'}
                />
              ) : (
                <>
                  <p className="text-sm text-fg-muted">{count} {t('listings.title').toLowerCase()}</p>
                  <ListingGrid
                    listings={results.map((r) => ({
                      ...r,
                      _distance_km: r.distance_km,
                    })) as any}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
