'use client';

/**
 * LocationPicker — premium interactive map.
 *
 * - Click on the map to drop / move a pin
 * - "Use my location" button uses the browser geolocation API
 * - NEVER displays raw lat/lng numbers to the user
 * - Shows a clear status: "Joylashuv aniqlandi" / "Joyni tanlang"
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crosshair, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
  loadLeaflet,
} from '@/lib/utils/leaflet';

export interface LocationPickerProps {
  value: { lat: number | null; lng: number | null };
  onChange: (next: { lat: number; lng: number } | null) => void;
  className?: string;
}

export function LocationPicker({ value, onChange, className = 'h-80 w-full' }: LocationPickerProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const Lref = useRef<any>(null);

  const [failed, setFailed] = useState(false);
  const [locating, setLocating] = useState(false);

  const lat = value.lat;
  const lng = value.lng;
  const hasPin = lat != null && lng != null;

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        Lref.current = L;

        // Custom premium pin icon (SVG)
        const pinIcon = L.divIcon({
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

        const initialCenter: [number, number] = hasPin ? [lat!, lng!] : DEFAULT_CENTER;
        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          attributionControl: false,
        }).setView(initialCenter, hasPin ? 15 : DEFAULT_ZOOM);

        L.tileLayer(TILE_URL, {
          maxZoom: 19,
          attribution: TILE_ATTRIBUTION,
        }).addTo(mapRef.current);

        L.control.attribution({ prefix: false, position: 'bottomright' })
          .addAttribution('© OpenStreetMap')
          .addTo(mapRef.current);

        if (hasPin) {
          markerRef.current = L.marker([lat!, lng!], { draggable: true, icon: pinIcon }).addTo(mapRef.current);
          markerRef.current.on('dragend', (e: any) => {
            const p = e.target.getLatLng();
            onChange({ lat: p.lat, lng: p.lng });
          });
        }

        mapRef.current.on('click', (e: any) => {
          const { lat: clat, lng: clng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([clat, clng]);
          } else {
            markerRef.current = L.marker([clat, clng], { draggable: true, icon: pinIcon }).addTo(mapRef.current);
            markerRef.current.on('dragend', (ev: any) => {
              const p = ev.target.getLatLng();
              onChange({ lat: p.lat, lng: p.lng });
            });
          }
          onChange({ lat: clat, lng: clng });
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = Lref.current;
    if (!L || !mapRef.current) return;
    if (lat == null || lng == null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }
    if (!markerRef.current) {
      const pinIcon = L.divIcon({
        className: 'sg-map-pin',
        html: `
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#1F7A52"/>
            <circle cx="18" cy="18" r="7" fill="#fff"/>
            <circle cx="18" cy="18" r="3.5" fill="#F2B100"/>
          </svg>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
      });
      markerRef.current = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const p = e.target.getLatLng();
        onChange({ lat: p.lat, lng: p.lng });
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.flyTo([lat, lng], 15, { duration: 0.6 });
  }, [lat, lng, onChange]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
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

  return (
    <div className="space-y-2">
      {/* Status + action bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          {hasPin ? (
            <>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.25} />
              <span className="text-sm font-semibold text-success truncate">
                {t('marketplace.locationSet' as any) ?? 'Joylashuv belgilandi'}
              </span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 flex-shrink-0 text-fg-muted" strokeWidth={1.75} />
              <span className="text-sm text-fg-muted truncate">
                {t('marketplace.mapTapToSetPin' as any) ?? 'Xaritani bosib joyni belgilang'}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="btn btn-secondary btn-sm flex-shrink-0"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          <span className="hidden sm:inline">
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
