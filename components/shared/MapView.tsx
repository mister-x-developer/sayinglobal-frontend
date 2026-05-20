'use client';

/**
 * Read-only map for showing a single listing pin or a cluster of nearby
 * listings. Loads Leaflet from CDN on demand and falls back gracefully
 * when the script can't be reached (offline, CSP) — in that case the
 * component renders the textual location instead of a broken map iframe.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
  loadLeaflet,
} from '@/lib/utils/leaflet';

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  label?: string;
  href?: string;
  popupHtml?: string;
}

export interface MapViewProps {
  /** Primary point to focus on. */
  center?: [number, number] | null;
  zoom?: number;
  markers?: MapMarker[];
  /** Tailwind size; default tall enough to be useful on desktop. */
  className?: string;
  /** Fallback caption shown when no coords / no Leaflet. */
  fallbackCaption?: string;
}

export function MapView({
  center,
  zoom = 13,
  markers = [],
  className = 'h-72 w-full',
  fallbackCaption,
}: MapViewProps) {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);

  // The viewable center: explicit prop, first marker, or app default.
  const focus: [number, number] = center
    ?? (markers[0] ? [markers[0].lat, markers[0].lng] : DEFAULT_CENTER);

  useEffect(() => {
    let cancelled = false;
    if (!ref.current) return;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        if (!mapRef.current) {
          mapRef.current = L.map(ref.current, {
            zoomControl: true,
            scrollWheelZoom: false,
            attributionControl: true,
          }).setView(focus, center ? zoom : DEFAULT_ZOOM);
          L.tileLayer(TILE_URL, {
            maxZoom: 19,
            attribution: TILE_ATTRIBUTION,
          }).addTo(mapRef.current);
          layerRef.current = L.layerGroup().addTo(mapRef.current);
        } else {
          mapRef.current.setView(focus, center ? zoom : mapRef.current.getZoom());
          layerRef.current.clearLayers();
        }

        for (const m of markers) {
          const marker = L.marker([m.lat, m.lng]).addTo(layerRef.current);
          if (m.popupHtml) {
            marker.bindPopup(m.popupHtml);
          } else if (m.label) {
            marker.bindPopup(m.label);
          }
          if (m.href) {
            marker.on('click', () => {
              if (typeof window !== 'undefined') window.location.href = m.href!;
            });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // re-render markers when content changes
  }, [center?.[0], center?.[1], JSON.stringify(markers), zoom]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl border border-border bg-bg-subtle text-fg-muted`}>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" strokeWidth={1.75} />
          <span className="text-sm">
            {fallbackCaption ?? t('marketplace.mapUnavailable' as any) ?? 'Map unavailable'}
          </span>
        </div>
      </div>
    );
  }

  return <div ref={ref} className={`${className} overflow-hidden rounded-2xl border border-border`} />;
}
