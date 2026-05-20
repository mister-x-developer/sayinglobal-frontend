'use client';

/**
 * Interactive location picker for listing create/edit.
 *
 * - Click on the map to drop / move a pin.
 * - "Use my location" button runs the browser geolocation API.
 * - Reads/writes `latitude` and `longitude` via `value` + `onChange`.
 *
 * Map tiles are loaded lazily from the OSM CDN — if the script fails,
 * the component degrades to a "lat / lng" pair of inputs so the user
 * can still type coordinates manually (or skip them entirely).
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crosshair, Loader2, MapPin } from 'lucide-react';
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

  // Current pin position derived from props
  const lat = value.lat;
  const lng = value.lng;

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        Lref.current = L;
        const initialCenter: [number, number] =
          lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER;

        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView(initialCenter, lat != null && lng != null ? 14 : DEFAULT_ZOOM);

        L.tileLayer(TILE_URL, {
          maxZoom: 19,
          attribution: TILE_ATTRIBUTION,
        }).addTo(mapRef.current);

        if (lat != null && lng != null) {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
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
            markerRef.current = L.marker([clat, clng], { draggable: true }).addTo(mapRef.current);
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
    // we want to (re)initialise only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value → marker
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
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const p = e.target.getLatLng();
        onChange({ lat: p.lat, lng: p.lng });
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.panTo([lat, lng]);
  }, [lat, lng, onChange]);

  // Cleanup
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

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs text-fg-subtle inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
          {lat != null && lng != null
            ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : t('marketplace.mapTapToSetPin' as any) ?? 'Tap on the map to set the pin'}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="btn btn-secondary btn-sm"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {t('marketplace.useMyLocation' as any) ?? 'Use my location'}
        </button>
      </div>

      {failed ? (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="0.000001"
            placeholder="Latitude"
            value={lat ?? ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v) && lng != null) onChange({ lat: v, lng });
              else if (!e.target.value && lng == null) onChange(null);
            }}
            className="input-base"
          />
          <input
            type="number"
            step="0.000001"
            placeholder="Longitude"
            value={lng ?? ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v) && lat != null) onChange({ lat, lng: v });
              else if (!e.target.value && lat == null) onChange(null);
            }}
            className="input-base"
          />
        </div>
      ) : (
        <div ref={containerRef} className={`${className} overflow-hidden rounded-2xl border border-border`} />
      )}
    </div>
  );
}
