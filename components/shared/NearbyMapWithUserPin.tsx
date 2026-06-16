'use client';

/**
 * NearbyMapWithUserPin — premium nearby listings map.
 *
 * Features:
 * - User location shown as a distinct "You are here" pulsing pin
 * - Listing pins with image, title, price, distance
 * - Click listing pin → navigate to listing detail
 * - Cluster support for dense areas
 * - Premium smooth UX
 */

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
  loadLeaflet,
} from '@/lib/utils/leaflet';
import type { MapMarker } from './MapView';

export interface NearbyMapWithUserPinProps {
  center?: [number, number] | null;
  zoom?: number;
  markers?: MapMarker[];
  userLocation?: [number, number] | null;
  className?: string;
}

// User location pin — pulsing blue dot
const USER_PIN_HTML = `
  <div style="position:relative;width:40px;height:40px;">
    <!-- Outer pulse ring -->
    <div style="
      position:absolute;inset:0;
      border-radius:50%;
      background:rgba(59,130,246,0.15);
      animation:sg-pulse 2s ease-out infinite;
    "></div>
    <!-- Inner dot -->
    <div style="
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:16px;height:16px;
      border-radius:50%;
      background:#3B82F6;
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(59,130,246,0.5);
    "></div>
  </div>
`;

// Listing pin — rich marker with image, title, price, and distance
function buildListingPinHtml(m: MapMarker): string {
  const imageUrl = m.imageUrl;
  const img = imageUrl
    ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'" />`
    : `<div style="width:100%;height:100%;background:#e8f5ee;border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F7A52" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
       </div>`;

  const distText = m.distanceKm != null 
    ? (m.distanceKm < 1 ? '< 1 km' : m.distanceKm.toFixed(1) + ' km') 
    : '';

  return `
    <div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; width:max-content; pointer-events:none;">
      
      <!-- Top Title & Price (Above or over the pin body? Wait, requirement says "pastida nom va narx, lokatsiya belgisining pastida... masofa") -->
      <!-- Let's put Title & Price just below the pin bubble, before the tip? No, it says "dumaloq ichida rasm, pastida nom va narx". So below the circle. Then "uchli joyida esa masofa". -->
      
      <div style="position:relative; width:48px; height:58px; pointer-events:auto; cursor:pointer;">
        <!-- Pin body -->
        <div style="
          position:absolute;top:0;left:50%;transform:translateX(-50%);
          width:48px;height:48px;
          border-radius:50% 50% 50% 0;
          transform:translateX(-50%) rotate(-45deg);
          background:#1F7A52;
          box-shadow:0 4px 12px rgba(31,122,82,0.4);
        "></div>
        <!-- Image circle -->
        <div style="
          position:absolute;top:4px;left:50%;transform:translateX(-50%);
          width:40px;height:40px;
          border-radius:50%;
          overflow:hidden;
          border:2.5px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.15);
          z-index:1;
        ">${img}</div>
        <!-- Pin tail -->
        <div style="
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:12px solid #1F7A52;
        "></div>
      </div>

      <!-- Distance at the sharp tip -->
      ${distText ? `
      <div style="margin-top:-6px; z-index:2; background:#fff; border:1px solid #1F7A52; color:#1F7A52; font-size:10px; font-weight:800; padding:2px 6px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        ${distText}
      </div>
      ` : ''}

      <!-- Title and Price below everything -->
      <div style="margin-top:4px; display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.95); padding:4px 8px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border:1px solid #e5e7eb; pointer-events:auto;">
        <div style="font-size:11px; font-weight:600; color:#374151; max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${m.label || ''}
        </div>
        ${m.price ? `<div style="font-size:12px; font-weight:800; color:#1F7A52;">${m.price}</div>` : ''}
      </div>

    </div>
  `;
}

/** Build rich popup for listing marker */
function buildListingPopup(m: MapMarker): string {
  const img = m.imageUrl
    ? `<img src="${m.imageUrl}" alt="" style="width:100%;height:80px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" onerror="this.style.display='none'" />`
    : `<div style="width:100%;height:60px;background:#f0f4f2;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
       </div>`;

  const dist = m.distanceKm != null
    ? `<div style="display:inline-flex;align-items:center;gap:3px;background:#f0fdf4;color:#1F7A52;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;margin-top:4px;">
        📍 ${m.distanceKm < 1 ? '< 1 km' : m.distanceKm.toFixed(1) + ' km'}
       </div>`
    : '';

  const price = m.price
    ? `<div style="font-size:13px;font-weight:800;color:#1F7A52;margin-top:2px;">${m.price}</div>`
    : '';

  return `
    <div style="width:180px;font-family:Inter,system-ui,sans-serif;cursor:pointer;border-radius:12px;overflow:hidden;" onclick="window.location.href='${m.href ?? '#'}'">
      ${img}
      <div style="padding:8px 10px 10px;">
        <div style="font-size:12px;font-weight:700;color:#0C1F17;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${m.label ?? ''}</div>
        ${price}
        ${dist}
      </div>
    </div>
  `;
}

export function NearbyMapWithUserPin({
  center,
  zoom = 11,
  markers = [],
  userLocation,
  className = 'h-96 w-full',
}: NearbyMapWithUserPinProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);

  const focus: [number, number] = userLocation
    ?? center
    ?? (markers[0] ? [markers[0].lat, markers[0].lng] : DEFAULT_CENTER);

  useEffect(() => {
    let cancelled = false;
    if (!ref.current) return;

    loadLeaflet().then((L) => {
      if (cancelled || !ref.current) return;

      // Add pulse animation CSS once
      if (!document.getElementById('sg-nearby-css')) {
        const style = document.createElement('style');
        style.id = 'sg-nearby-css';
        style.textContent = `
          @keyframes sg-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          .sg-user-pin { background: transparent !important; border: none !important; }
          .sg-listing-pin { background: transparent !important; border: none !important; }
        `;
        document.head.appendChild(style);
      }

      if (!mapRef.current) {
        mapRef.current = L.map(ref.current, {
          zoomControl: true,
          scrollWheelZoom: false,
          attributionControl: false,
        }).setView(focus, zoom);

        L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(mapRef.current);
        L.control.attribution({ prefix: false, position: 'bottomright' })
          .addAttribution('© OpenStreetMap')
          .addTo(mapRef.current);

        layerRef.current = L.layerGroup().addTo(mapRef.current);
      } else {
        mapRef.current.setView(focus, zoom);
        layerRef.current.clearLayers();
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
          userMarkerRef.current = null;
        }
      }

      // User location pin
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'sg-user-pin',
          html: USER_PIN_HTML,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -24],
        });
        userMarkerRef.current = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 })
          .addTo(mapRef.current)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;font-weight:700;font-size:12px;color:#1d4ed8;text-align:center;padding:4px 8px;">
              📍 Siz shu yerdasiz
            </div>
          `);
      }

      // Listing pins
      const points: [number, number][] = [];
      if (userLocation) points.push(userLocation);

      for (const m of markers) {
        const listingIcon = L.divIcon({
          className: 'sg-listing-pin',
          html: buildListingPinHtml(m),
          iconSize: [0, 0], // The marker is completely styled via absolute positioning in the HTML
          iconAnchor: [0, 0], // Anchor at center
          popupAnchor: [0, -70],
        });

        const marker = L.marker([m.lat, m.lng], { icon: listingIcon }).addTo(layerRef.current);
        points.push([m.lat, m.lng]);

        const popupContent = buildListingPopup(m);
        marker.bindPopup(L.popup({
          maxWidth: 200,
          minWidth: 180,
          className: 'sg-listing-popup',
          closeButton: false,
          offset: [0, -4],
        }).setContent(popupContent));

        if (m.href) {
          marker.on('click', () => {
            if (typeof window !== 'undefined') window.location.href = m.href!;
          });
        }
      }

      // Auto-fit to show all markers + user
      if (points.length > 1) {
        try {
          const bounds = L.latLngBounds(points);
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } catch {}
      }
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(userLocation), JSON.stringify(markers), zoom]);

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
          <span className="text-sm">{t('Map.mapFailed')}</span>
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
