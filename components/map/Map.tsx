'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedListingTitle } from '@/lib/utils/format';

interface Listing {
  id: string;
  id: string;
  title: string;
  title_uz?: string;
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  price: number;
  currency: string;
  latitude: string | number;
  longitude: string | number;
  category: { name: string; name_uz: string };
  images: { url: string; is_primary: boolean }[];
}

interface MapProps {
  listings: Listing[];
  centerLat?: number;
  centerLng?: number;
  radius?: number;
}

export default function Map({ listings, centerLat = 41.2995, centerLng = 69.2401, radius = 50 }: MapProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  return (
    <MapContainer 
      center={[centerLat, centerLng]} 
      zoom={8} 
      scrollWheelZoom={false} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {listings.filter(l => l.latitude && l.longitude).map(listing => (
        <Marker 
          key={listing.public_id} 
          position={[Number(listing.latitude), Number(listing.longitude)]}
        >
          <Popup>
            <div className="w-48">
              {listing.images && listing.images.length > 0 && (
                <div className="relative w-full h-24 mb-2 rounded overflow-hidden">
                  <Image 
                    src={listing.images.find(img => img.is_primary)?.url || listing.images[0].url} 
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-sm truncate">{getLocalizedListingTitle(listing as any, locale)}</h3>
              <p className="text-emerald-600 font-bold mt-1">
                {Number(listing.price).toLocaleString()} {listing.currency}
              </p>
              <button 
                onClick={() => router.push(`/listings/detail?id=${listing.public_id}`)}
                className="mt-2 w-full bg-emerald-600 text-white text-xs py-1.5 rounded hover:bg-emerald-700 transition"
              >
                {t('common.view')}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
