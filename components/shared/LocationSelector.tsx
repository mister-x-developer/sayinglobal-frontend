'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { referenceApi, type District } from '@/lib/api/reference';
import { useRegions } from '@/lib/hooks/useReferenceData';

/**
 * Fallback region slugs — used when backend is unavailable.
 * Display names come from t('regions.{slug}') — NOT from inline locale maps.
 * Slugs must match the keys in messages/*.json under "regions".
 */
const FALLBACK_REGION_SLUGS = [
  'tashkent',
  'tashkentRegion',
  'samarkand',
  'bukhara',
  'andijan',
  'fergana',
  'namangan',
  'kashkadarya',
  'surkhandarya',
  'jizzakh',
  'navoi',
  'sirdarya',
  'khorezm',
  'karakalpakstan',
] as const;

interface LocationSelectorProps {
  regionValue: string;
  districtValue: string;
  locationValue: string;
  onRegionChange: (slug: string, name: string) => void;
  onDistrictChange: (slug: string, name: string) => void;
  onLocationChange: (value: string) => void;
  errors?: { region?: string; district?: string; location?: string };
  required?: boolean;
}

/**
 * Dependent region → district selector.
 * - District is disabled until region is selected
 * - Changing region resets district
 * - Data is backend-driven; falls back to translation keys
 * - No inline locale maps
 */
export function LocationSelector({
  regionValue,
  districtValue,
  locationValue,
  onRegionChange,
  onDistrictChange,
  onLocationChange,
  errors = {},
  required = false,
}: LocationSelectorProps) {
  const t = useTranslations();
  const { regions: backendRegions } = useRegions();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Load districts when region changes
  useEffect(() => {
    if (!regionValue) {
      setDistricts([]);
      return;
    }

    // Try to find region in backend data
    const region = backendRegions.find(
      (r) => r.slug === regionValue || r.slug.includes(regionValue)
    );

    if (region?.districts?.length) {
      setDistricts(region.districts);
      return;
    }

    // Fetch from API
    setLoadingDistricts(true);
    referenceApi.getDistricts(regionValue)
      .then((data) => setDistricts(data))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [regionValue, backendRegions]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    // Find display name from backend data or fall back to translation key
    const region = backendRegions.find((r) => r.slug === slug);
    const name = region ? (region.name || region.name_uz) : t(`regions.${slug}` as any) || slug;
    onRegionChange(slug, name);
    onDistrictChange('', '');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    const district = districts.find((d) => d.slug === slug);
    const name = district ? (district.name || district.name_uz) : slug;
    onDistrictChange(slug, name);
  };

  const districtDisabled = !regionValue || loadingDistricts;

  // Build region options: prefer backend data, fall back to translation keys
  const regionOptions =
    backendRegions.length > 0
      ? backendRegions.map((r) => ({
          slug: r.slug,
          label: r.name || r.name_uz,
        }))
      : FALLBACK_REGION_SLUGS.map((slug) => ({
          slug,
          label: t(`regions.${slug}` as any),
        }));

  return (
    <div className="space-y-4">
      {/* Region */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">
          {t('listings.region')}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
            strokeWidth={1.75}
          />
          <select
            value={regionValue}
            onChange={handleRegionChange}
            className="input-base w-full cursor-pointer pl-11"
            aria-label={t('listings.region')}
          >
            <option value="">{t('listings.region')}</option>
            {regionOptions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {errors.region && <p className="mt-1 text-xs text-danger">{errors.region}</p>}
      </div>

      {/* District — disabled until region selected */}
      <div>
        <label
          className={`mb-1.5 block text-sm font-medium ${
            districtDisabled ? 'text-fg-subtle' : 'text-fg'
          }`}
        >
          {t('listings.district')}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
        <div className="relative">
          <select
            value={districtValue}
            onChange={handleDistrictChange}
            disabled={districtDisabled}
            className={`input-base w-full cursor-pointer transition-opacity ${
              districtDisabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
            aria-label={t('listings.district')}
            aria-disabled={districtDisabled}
          >
            <option value="">
              {districtDisabled && !loadingDistricts
                ? t('validation.regionRequired')
                : t('listings.district')}
            </option>
            {districts.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name || d.name_uz}
              </option>
            ))}
          </select>
          {districtDisabled && !loadingDistricts && (
            <div
              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-border/50"
              aria-hidden="true"
            />
          )}
        </div>
        {!regionValue && (
          <p className="mt-1 text-xs text-fg-subtle">
            {t('validation.regionRequired')}
          </p>
        )}
        {errors.district && <p className="mt-1 text-xs text-danger">{errors.district}</p>}
      </div>
    </div>
  );
}
