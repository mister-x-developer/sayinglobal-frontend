'use client';

/**
 * MapView — premium read-only map.
 *
 * Used to show a single listing pin or a cluster of nearby listings.
 * Custom branded pin (green + gold) with drop shadow.
 * Rich popup: listing image, title, price, distance badge.
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
  /** Listing image URL for rich popup */
  imageUrl?: string;
  /** Formatted price string */
  price?: string;
  /** Distance in km */
  distanceKm?: number;
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

/** Build rich popup HTML for a listing marker */
function buildListingPopup(m: MapMarker): string {
  const img = m.imageUrl
    ? `<img src="${m.imageUrl}" alt="" style="width:100%;height:80px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" />`
    : `<div style="width:100%;height:80px;background:#f0f4f2;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
       </div>`;

  const dist = m.distanceKm != null
    ? `<span style="display:inline-flex;align-items:center;gap:3px;background:#f0fdf4;color:#1F7A52;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;margin-top:4px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${m.distanceKm < 1 ? '< 1 km' : m.distanceKm.toFixed(1) + ' km'}
       </span>`
    : '';

  const price = m.price
    ? `<div style="font-size:13px;font-weight:800;color:#0C1F17;margin-top:2px;">${m.price}</div>`
    : '';

  return `
    <div style="width:180px;font-family:Inter,system-ui,sans-serif;cursor:pointer;" onclick="window.location.href='${m.href ?? '#'}'">
      ${img}
      <div style="padding:8px 10px 10px;">
        <div style="font-size:12px;font-weight:700;color:#0C1F17;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${m.label ?? ''}</div>
        ${price}
        ${dist}
      </div>
    </div>
  `;
}

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
          popupAnchor: [0, -48],
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

          // Rich popup for listing markers, simple popup for single pin
          const hasRichData = m.imageUrl || m.price || m.distanceKm != null;
          if (hasRichData || m.href) {
            const popupContent = m.popupHtml ?? buildListingPopup(m);
            marker.bindPopup(L.popup({
              maxWidth: 200,
              minWidth: 180,
              className: 'sg-listing-popup',
              closeButton: false,
              offset: [0, -4],
            }).setContent(popupContent));
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
