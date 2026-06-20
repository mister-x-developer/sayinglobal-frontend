'use client';

import { useTranslations } from 'next-intl';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { listingsApi } from '@/lib/api/listings';

const LoadingMap = () => {
  const t = useTranslations();
  return (
    <div className="w-full h-full bg-bg-subtle animate-pulse rounded-lg flex items-center justify-center">
      <p className="text-fg-subtle">{t('Map.loadingMap')}</p>
    </div>
  );
};

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: LoadingMap
});

interface MapDiscoveryProps {
  className?: string;
}

export default function MapDiscovery({ className = "h-[500px] w-full" }: MapDiscoveryProps) {
  const t = useTranslations();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Center (Tashkent default)
  const [lat, setLat] = useState(41.2995);
  const [lng, setLng] = useState(69.2401);
  const [radius, setRadius] = useState(100);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => console.warn("Geolocation failed or denied, using default Tashkent.", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const data = await listingsApi.nearby({ lat, lng, radius_km: radius, page_size: 100 });
        setListings(data.results || []);
      } catch (err) {
        console.error("Error fetching map listings", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [lat, lng, radius]);

  return (
    <div className={`relative ${className}`}>
      <ErrorBoundary>
        <Map listings={listings} centerLat={lat} centerLng={lng} radius={radius} />
      </ErrorBoundary>
      
      {/* Overlay controls — uses design system colors */}
      <div className="absolute top-4 right-4 z-[400] bg-bg-elevated p-3 rounded-lg shadow-lift border border-border w-64">
        <h3 className="font-semibold text-sm mb-2 text-fg">{t('Map.searchRadius')}</h3>
        <input 
          type="range" 
          min="10" 
          max="500" 
          step="10" 
          value={radius} 
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-brand-primary"
        />
        <div className="flex justify-between text-xs text-fg-muted mt-1">
          <span>10 km</span>
          <span className="font-bold text-brand-primary">{radius} km</span>
          <span>500 km</span>
        </div>
        <p className="text-xs text-fg-subtle mt-3 border-t border-border pt-2">
          {loading ? '...' : t('marketplace.showResults', { count: listings.length })}
        </p>
      </div>
    </div>
  );
}
