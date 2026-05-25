'use client';

/**
 * Nearby Listings — premium redesign.
 * Clean, luxury feel. No sidebar. Floating controls. Text-only categories.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Compass, Loader2, ArrowLeft, Navigation } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { MapView } from '@/components/shared/MapView';
import { NearbyMapWithUserPin } from '@/components/shared/NearbyMapWithUserPin';
import { listingsApi, type Listing } from '@/lib/api/listings';
import { referenceApi } from '@/lib/api/reference';

const ALL_CATS = ['cattle', 'sheep', 'goats', 'horses', 'camels', 'poultry', 'rabbits', 'bees', 'fish'] as const;
const RADIUS_OPTIONS = [5, 25, 50, 100, 250] as const;

type GeoState =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'granted'; lat: number; lng: number }
  | { kind: 'denied' };

export default function NearbyListingsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category') ?? null;

  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' });
  const [category, setCategory] = useState<string | null>(initialCat);
  const [radius, setRadius] = useState<typeof RADIUS_OPTIONS[number]>(50);
  const [regions, setRegions] = useState<any[]>([]);
  const [region, setRegion] = useState<string>('');
  const [results, setResults] = useState<(Listing & { distance_km?: number })[]>([]);
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<'gps' | 'region'>('region');
  const [loading, setLoading] = useState(false);

  // Request location
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ kind: 'denied' }); return;
    }
    setGeo({ kind: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ kind: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ kind: 'denied' }),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    referenceApi.getRegions().then(setRegions).catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    if (geo.kind === 'requesting' || geo.kind === 'idle') return;
    let alive = true;
    setLoading(true);
    const params: any = { category: category || undefined, page_size: 30 };
    if (geo.kind === 'granted') {
      params.lat = geo.lat; params.lng = geo.lng; params.radius_km = radius;
    } else if (region) {
      params.region = region;
    }
    listingsApi.nearby(params)
      .then((data) => {
        if (!alive) return;
        setResults(data.results); setCount(data.count); setMode(data.mode);
      })
      .catch(() => alive && (setResults([]), setCount(0)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [geo, category, radius, region]);

  const mapMarkers = useMemo(() =>
    results.filter((r) => r.latitude != null && r.longitude != null).map((r) => ({
      id: r.public_id,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      label: r.title,
      href: `/listings/${r.public_id}`,
      imageUrl: r.primary_image?.image ?? r.images?.[0]?.image ?? undefined,
      price: r.price ? new Intl.NumberFormat('uz-UZ').format(Number(r.price)) + " so'm" : undefined,
      distanceKm: typeof r.distance_km === 'number' ? r.distance_km : undefined,
    })), [results]);

  const center: [number, number] | null =
    geo.kind === 'granted' ? [geo.lat, geo.lng] : null;

  const requestGeo = () => {
    if (!navigator.geolocation) return;
    setGeo({ kind: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ kind: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ kind: 'denied' }),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <AppNav />

      <main className="flex-1">
        {/* Hero header */}
        <div className="border-b border-border bg-bg-elevated">
          <div className="container-page py-6">
            <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg mb-4">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              {t('common.back')}
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="display-md">{t('nearby.title' as any) ?? 'Yaqin atrofdagi eʼlonlar'}</h1>
                <p className="mt-1.5 text-sm text-fg-muted inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-accent" strokeWidth={1.75} />
                  {geo.kind === 'granted'
                    ? (t('nearby.modeGps' as any, { km: radius } as any) ?? `${radius} km radius`)
                    : (t('nearby.modeRegion' as any) ?? 'Viloyat bo\'yicha')}
                  {count > 0 && (
                    <span className="ml-2 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-bold text-brand-primary">
                      {count}
                    </span>
                  )}
                </p>
              </div>

              {/* GPS / location controls */}
              <div className="flex items-center gap-2">
                {geo.kind === 'requesting' && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    {t('nearby.requesting' as any) ?? 'Joylashuv aniqlanmoqda...'}
                  </span>
                )}
                {geo.kind === 'denied' && (
                  <button
                    type="button"
                    onClick={requestGeo}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/30 bg-brand-primary/8 px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/12 transition-colors"
                  >
                    <Navigation className="h-4 w-4" strokeWidth={2} />
                    {t('nearby.tryAgain' as any) ?? 'GPS yoqish'}
                  </button>
                )}
                {geo.kind === 'granted' && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                    <Navigation className="h-3.5 w-3.5" strokeWidth={2.5} />
                    GPS faol
                  </span>
                )}
              </div>
            </div>

            {/* Category chips — text only */}
            <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`inline-flex h-9 flex-shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-all ${
                  category === null
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-border bg-bg-elevated text-fg hover:border-brand-primary/40'
                }`}
              >
                {t('common.all')}
              </button>
              {ALL_CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c === category ? null : c)}
                  className={`inline-flex h-9 flex-shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-all ${
                    c === category
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-border bg-bg-elevated text-fg hover:border-brand-primary/40'
                  }`}
                >
                  {t(`categories.${c}`)}
                </button>
              ))}
            </div>

            {/* Radius (GPS mode) */}
            {geo.kind === 'granted' && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">
                  {t('nearby.radius' as any) ?? 'Radius'}:
                </span>
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      r === radius
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            )}

            {/* Region fallback */}
            {geo.kind === 'denied' && (
              <div className="mt-4">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="input-base h-10 w-full max-w-xs text-sm"
                >
                  <option value="">{t('listings.region')} — {t('common.all')}</option>
                  {regions.map((r: any) => (
                    <option key={r.slug} value={r.slug}>{r.name_uz ?? r.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="container-page py-8">
          {/* Map */}
          {(mapMarkers.length > 0 || center) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 overflow-hidden rounded-2xl border border-border shadow-soft"
            >
              <NearbyMapWithUserPin
                center={center}
                zoom={geo.kind === 'granted' ? 11 : 6}
                markers={mapMarkers}
                userLocation={geo.kind === 'granted' ? [geo.lat, geo.lng] : null}
                className="h-72 w-full sm:h-96"
              />
            </motion.div>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-2 border-brand-primary/20" />
                <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-brand-primary" strokeWidth={2} />
              </div>
              <p className="text-sm text-fg-muted">{t('common.loading')}</p>
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title={t('nearby.empty' as any) ?? 'Yaqin atrofda eʼlon topilmadi'}
              description={t('nearby.emptyDesc' as any) ?? 'Radius yoki kategoriyani o\'zgartiring.'}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p className="mb-6 text-sm text-fg-muted">
                <span className="font-bold text-fg">{count}</span> ta eʼlon topildi
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((listing, i) => (
                  <motion.div
                    key={listing.public_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="relative"
                  >
                    <ListingCard listing={listing as any} />
                    {typeof listing.distance_km === 'number' && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-bg-elevated/92 px-2.5 py-1 text-[11px] font-bold text-fg backdrop-blur-sm shadow-sm">
                        <MapPin className="h-3 w-3 text-brand-accent" strokeWidth={2.5} />
                        {listing.distance_km < 1
                          ? '< 1 km'
                          : `${listing.distance_km.toFixed(1)} km`}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
