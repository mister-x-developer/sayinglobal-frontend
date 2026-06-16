import MapDiscovery from '@/components/map/MapDiscovery';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Geo-Discovery | SAYIN GLOBAL',
  description: "Oʻz atrofingizdagi eʼlonlarni xarita orqali qidiring.",
};

export default async function DiscoveryPage() {
  const t = await getTranslations();
  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('Map.geoDiscovery')}</h1>
          <p className="text-slate-500 mt-2">
            Oʻzingizga eng yaqin masofadagi barcha chorva eʼlonlarini xaritada ko'ring va qidiring.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <MapDiscovery className="h-[600px] w-full" />
        </div>
      </div>
    </div>
  );
}
