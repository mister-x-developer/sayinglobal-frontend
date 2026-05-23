'use client';

/**
 * MapView — premium read-only map.
 *
 * Used to show a single listing pin or a cluster of nearby listings.
 * Custom branded pin (green + gold) with drop shadow.
 * Smart auto-fit when multiple markers are passed.
 * Click on pin → navigate to listing detail.
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
  center?: [number, number] | null;
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  fallbackCaption?: string;
  /** When true, auto-fit bounds to all markers. */
  autoFit?: boolean;
}

const PIN_HTML = `
  <div style="position:relative;width:36px;height:46px;filter:drop-shadow(0 4px 6px rgba(31,122,82,0.35));">
    <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#1F7A52"/>
      <circle cx="18" cy="18" r="7" fill="#fff"/>
      <circle cx="18" cy="18" r="3.5" fill="#F2B100"/>
    </svg>
  </div>
`;

export function MapView({
  center,
  zoom = 13,
  markers = [],
  className = 'h-72 w-full',
  fallbackCaption,
  autoFit = true,
}: MapViewProps) {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);

  const focus: [number, number] = center
    ?? (markers[0] ? [markers[0].lat, markers[0].lng] : DEFAULT_CENTER);

  useEffect(() => {
    let cancelled = false;
    if (!ref.current) return;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        const pinIcon = L.divIcon({
          className: 'sg-map-pin',
          html: PIN_HTML,
          iconSize: [36, 46],
          iconAnchor: [18, 46],
          popupAnchor: [0, -42],
        });

        if (!mapRef.current) {
          mapRef.current = L.map(ref.current, {
            zoomControl: true,
            scrollWheelZoom: false,
            attributionControl: false,
          }).setView(focus, center ? zoom : DEFAULT_ZOOM);
          L.tileLayer(TILE_URL, {
            maxZoom: 19,
            attribution: TILE_ATTRIBUTION,
          }).addTo(mapRef.current);
          L.control.attribution({ prefix: false, position: 'bottomright' })
            .addAttribution('© OpenStreetMap')
            .addTo(mapRef.current);
          layerRef.current = L.layerGroup().addTo(mapRef.current);
        } else {
          mapRef.current.setView(focus, center ? zoom : mapRef.current.getZoom());
          layerRef.current.clearLayers();
        }

        const points: any[] = [];
        for (const m of markers) {
          const marker = L.marker([m.lat, m.lng], { icon: pinIcon }).addTo(layerRef.current);
          points.push([m.lat, m.lng]);
          if (m.popupHtml) {
            marker.bindPopup(m.popupHtml);
          } else if (m.label) {
            marker.bindPopup(
              `<div style="font-family:Poppins,Inter,sans-serif;font-weight:600;font-size:13px;color:#0C1F17">${m.label}</div>`,
            );
          }
          if (m.href) {
            marker.on('click', () => {
              if (typeof window !== 'undefined') window.location.href = m.href!;
            });
          }
        }

        // Auto-fit bounds if multiple markers
        if (autoFit && points.length > 1) {
          try {
            const bounds = L.latLngBounds(points);
            mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
          } catch {}
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1], JSON.stringify(markers), zoom]);

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
            {fallbackCaption ?? t('marketplace.mapUnavailable' as any) ?? 'Xarita yuklanmadi'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`${className} overflow-hidden rounded-2xl border border-border shadow-soft ring-1 ring-black/5`}
    />
  );
}
