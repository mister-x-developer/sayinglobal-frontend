/**
 * Lazy CDN loader for Leaflet.
 *
 * The platform uses Leaflet via CDN so:
 *   - We do not require a build-time `npm install leaflet` (works in
 *     environments without network access at build time).
 *   - Tiles are fetched from the public OpenStreetMap network at runtime
 *     when the user opens a map.
 *   - Code paths that don't render a map never load the script.
 *
 * `loadLeaflet()` returns the global `L` namespace once it is available,
 * and is idempotent: parallel callers share one in-flight promise.
 */

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

let promise: Promise<any> | null = null;

export function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('leaflet_unavailable_ssr'));
  }
  // Already loaded once via this module.
  const existing = (window as any).L;
  if (existing && existing.map) return Promise.resolve(existing);
  if (promise) return promise;

  promise = new Promise<any>((resolve, reject) => {
    // CSS — append once.
    if (!document.querySelector(`link[data-leaflet="${LEAFLET_VERSION}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.dataset.leaflet = LEAFLET_VERSION;
      document.head.appendChild(link);
    }
    // JS — append once.
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-leaflet="${LEAFLET_VERSION}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).L));
      existingScript.addEventListener('error', () => reject(new Error('leaflet_load_failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.dataset.leaflet = LEAFLET_VERSION;
    script.onload = () => {
      const L = (window as any).L;
      if (!L) {
        reject(new Error('leaflet_global_missing'));
        return;
      }
      resolve(L);
    };
    script.onerror = () => reject(new Error('leaflet_load_failed'));
    document.head.appendChild(script);
  });

  return promise;
}

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Distance between two coordinates in km, Haversine. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Default view fallback when user has no GPS — Tashkent. */
export const DEFAULT_CENTER: [number, number] = [41.2995, 69.2401];
export const DEFAULT_ZOOM = 6;
