'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center"><p className="text-slate-400">Xarita yuklanmoqda...</p></div>
});

interface MapDiscoveryProps {
  className?: string;
}

export default function MapDiscovery({ className = "h-[500px] w-full" }: MapDiscoveryProps) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Center (Tashkent default)
  const [lat, setLat] = useState(41.2995);
  const [lng, setLng] = useState(69.2401);
  const [radius, setRadius] = useState(100);

  useEffect(() => {
    // In a real app, you would use Geolocation API here
    // navigator.geolocation.getCurrentPosition(...)
    
    const fetchListings = async () => {
      setLoading(true);
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/listings/?lat=${lat}&lng=${lng}&radius=${radius}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setListings(data.results || []);
        }
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
      <Map listings={listings} centerLat={lat} centerLng={lng} radius={radius} />
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-lg shadow-lg border border-slate-200 w-64">
        <h3 className="font-semibold text-sm mb-2 text-slate-800">Qidiruv radiusi (km)</h3>
        <input 
          type="range" 
          min="10" 
          max="500" 
          step="10" 
          value={radius} 
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>10 km</span>
          <span className="font-bold text-emerald-700">{radius} km</span>
          <span>500 km</span>
        </div>
        <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-2">
          Topilgan e&apos;lonlar: {loading ? '...' : listings.length}
        </p>
      </div>
    </div>
  );
}
