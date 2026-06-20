'use client';

import MapDiscovery from '@/components/map/MapDiscovery';
import { useTranslations } from 'next-intl';

export default function DiscoveryPage() {
  const t = useTranslations();
  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('Map.geoDiscovery')}</h1>
          <p className="text-slate-500 mt-2">
            Oʻzingizga eng yaqin masofadagi barcha chorva eʼlonlarini xaritada ko&apos;ring va qidiring.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <MapDiscovery className="h-[600px] w-full" />
        </div>
      </div>
    </div>
  );
}
