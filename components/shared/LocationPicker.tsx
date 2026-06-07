'use client';

/**
 * LocationPicker — premium interactive map with reverse geocoding.
 *
 * - Click on the map to drop / move a pin
 * - "Use my location" button uses the browser geolocation API
 * - After every pin placement, Nominatim reverse-geocodes the coordinates
 *   and fires onAddress({ location, region, district }) so the form fields
 *   are filled automatically — the user never has to type an address
 * - NEVER displays raw lat/lng numbers to the user
 * - Shows the resolved address name as the status badge
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Crosshair, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
  loadLeaflet,
} from '@/lib/utils/leaflet';

export interface ResolvedAddress {
  /** Human-readable street / neighbourhood / place name */
  location: string;
  /** Uzbekistan region name (viloyat) */
  region: string;
  /** District name (tuman) */
  district: string;
}

export interface LocationPickerProps {
  value: { lat: number | null; lng: number | null };
  onChange: (next: { lat: number; lng: number } | null) => void;
  /** Called after reverse geocoding completes — use to auto-fill form fields */
  onAddress?: (addr: ResolvedAddress) => void;
  className?: string;
}

// ── Nominatim reverse geocoder ────────────────────────────────────────────────
// Free, no API key, respects OSM usage policy (1 req/s, User-Agent required).
async function reverseGeocode(lat: number, lng: number): Promise<ResolvedAddress> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz,ru,en&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SAYIN.Global/1.0 (sayinglobal.vercel.app)' },
    });
    if (!res.ok) throw new Error('nominatim_error');
    const data = await res.json();
    const a = data.address ?? {};

    // Build human-readable location: prefer specific place names over generic ones
    const location =
      a.road ||
      a.neighbourhood ||
      a.suburb ||
      a.village ||
      a.town ||
      a.city_district ||
      a.city ||
      a.county ||
      data.display_name?.split(',')[0] ||
      '';

    // Region: state / province
    const region =
      a.state ||
      a.province ||
      a.region ||
      '';

    // District: county / district
    const district =
      a.county ||
      a.district ||
      a.city_district ||
      '';

    return {
      location: location.trim(),
      region: region.trim(),
      district: district.trim(),
    };
  } catch {
    return { location: '', region: '', district: '' };
  }
}

export function LocationPicker({
  value,
  onChange,
  onAddress,
  className = 'h-80 w-full',
}: LocationPickerProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const Lref = useRef<any>(null);

  const [failed, setFailed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [resolvedName, setResolvedName] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');

  const lat = value.lat;
  const lng = value.lng;
  const hasPin = lat != null && lng != null;

  // Reverse geocode and fire onAddress whenever coordinates change
  const handleCoords = useCallback(
    async (clat: number, clng: number) => {
      onChange({ lat: clat, lng: clng });
      if (!onAddress) return;
      setGeocoding(true);
      const addr = await reverseGeocode(clat, clng);
      setGeocoding(false);
      if (addr.location) setResolvedName(addr.location);
      onAddress(addr);
    },
    [onChange, onAddress],
  );

  // Build the branded pin icon (reused in multiple places)
  const buildPinIcon = (L: any) =>
    L.divIcon({
      className: 'sg-map-pin',
      html: `
        <div style="position:relative;width:36px;height:46px;">
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#1F7A52"/>
            <circle cx="18" cy="18" r="7" fill="#fff"/>
            <circle cx="18" cy="18" r="3.5" fill="#F2B100"/>
          </svg>
          <div style="position:absolute;left:50%;bottom:0;width:14px;height:5px;transform:translateX(-50%);background:rgba(0,0,0,0.18);border-radius:50%;filter:blur(3px);"></div>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 46],
    });

  // Initialise map once
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        Lref.current = L;

        const initialCenter: [number, number] = hasPin ? [lat!, lng!] : DEFAULT_CENTER;
        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          attributionControl: false,
        }).setView(initialCenter, hasPin ? 15 : DEFAULT_ZOOM);

        L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(mapRef.current);
        L.control.attribution({ prefix: false, position: 'bottomright' })
          .addAttribution('© OpenStreetMap')
          .addTo(mapRef.current);

        if (hasPin) {
          markerRef.current = L.marker([lat!, lng!], {
            draggable: true,
            icon: buildPinIcon(L),
          }).addTo(mapRef.current);
          markerRef.current.on('dragend', (e: any) => {
            const p = e.target.getLatLng();
            handleCoords(p.lat, p.lng);
          });
        }

        mapRef.current.on('click', (e: any) => {
          const { lat: clat, lng: clng } = e.latlng;
          const icon = buildPinIcon(L);
          if (markerRef.current) {
            markerRef.current.setLatLng([clat, clng]);
          } else {
            markerRef.current = L.marker([clat, clng], { draggable: true, icon }).addTo(mapRef.current);
            markerRef.current.on('dragend', (ev: any) => {
              const p = ev.target.getLatLng();
              handleCoords(p.lat, p.lng);
            });
          }
          handleCoords(clat, clng);
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes to the map marker
  useEffect(() => {
    const L = Lref.current;
    if (!L || !mapRef.current) return;
    if (lat == null || lng == null) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      setResolvedName('');
      return;
    }
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], {
        draggable: true,
        icon: buildPinIcon(L),
      }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const p = e.target.getLatLng();
        handleCoords(p.lat, p.lng);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.flyTo([lat, lng], 15, { duration: 0.6 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError(t('marketplace.geolocationUnsupported' as any) ?? 'Joylashuv aniqlash qo‘llab-quvvatlanmaydi');
      return;
    }
    setLocationError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        handleCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        const msg = err.code === 1
          ? (t('marketplace.geolocationPermission' as any) ?? 'Joylashuv ruxsati berilmadi. Ilova sozlamalaridan yoqing.')
          : (t('marketplace.geolocationError' as any) ?? 'Joylashuvni aniqlab bo‘lmadi. Qayta urining.');
        setLocationError(msg);
        // Auto clear error after a bit
        setTimeout(() => setLocationError(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30_000 },
    );
  };

  if (failed) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/8 p-6 text-center">
        <p className="text-sm font-semibold text-warning">
          {t('marketplace.mapUnavailable' as any) ?? 'Xarita yuklanmadi'}
        </p>
        <p className="mt-2 text-xs text-fg-muted">
          Internet aloqasini tekshiring va sahifani qayta yuklang.
        </p>
      </div>
    );
  }

  // Status label: GPS belgisi qo'yilgan yoki yo'qligini ko'rsatadi — ko'cha nomi emas
  const statusLabel = locationError
    ? locationError
    : geocoding
    ? (t('marketplace.geocoding' as any) ?? 'Joylashuv aniqlanmoqda...')
    : hasPin
    ? (t('marketplace.locationSet' as any) ?? 'GPS joylashuv belgilandi')
    : (t('marketplace.mapTapToSetPin' as any) ?? 'Xaritani bosib GPS belgisini qo\'ying');

  return (
    <div className="space-y-2">
      {/* Status + action bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          {geocoding ? (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-brand-primary" strokeWidth={2} />
          ) : hasPin ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.25} />
          ) : (
            <MapPin className="h-4 w-4 flex-shrink-0 text-fg-muted" strokeWidth={1.75} />
          )}
          <span
            className={`text-sm truncate ${
              locationError ? 'text-danger' : hasPin && !geocoding ? 'font-semibold text-success' : 'text-fg-muted'
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating || geocoding}
          className="btn btn-secondary btn-sm flex-shrink-0 gap-1.5"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          <span className="text-[11px] sm:text-xs font-medium">
            {t('marketplace.useMyLocation' as any) ?? 'Mening joyim'}
          </span>
        </button>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        className={`${className} overflow-hidden rounded-2xl border border-border shadow-soft ring-1 ring-black/5`}
      />
    </div>
  );
}
