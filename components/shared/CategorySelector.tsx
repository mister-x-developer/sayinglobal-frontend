'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCategories, useBreeds } from '@/lib/hooks/useReferenceData';
import type { Category, Breed } from '@/lib/api/reference';

/**
 * Fallback category slugs — used when backend is unavailable.
 * Display names come from t('categories.{slug}') — NOT from inline locale maps.
 */
const FALLBACK_SLUGS = [
  'cattle', 'sheep', 'goats', 'horses', 'camels', 'poultry',
] as const;

interface CategorySelectorProps {
  value: string;
  onChange: (slug: string) => void;
  error?: string;
  required?: boolean;
}

export function CategorySelector({ value, onChange, error, required }: CategorySelectorProps) {
  const t = useTranslations();
  const { categories: backendCats } = useCategories();
  const locale = useLocale();

  // Helper to get localized name directly from object as fallback
  const getLocalizedName = (obj: any, loc: string) => {
    if (loc === 'ru') return obj.name_ru || obj.name_uz;
    if (loc === 'en') return obj.name_en || obj.name_uz;
    if (loc === 'uz-cyrl') return obj.name_uz_cyrl || obj.name_uz;
    return obj.name_uz;
  };

  const items: Array<{ slug: string; label: string }> =
    backendCats.length > 0
      ? backendCats.map((c: Category) => ({
          slug: c.slug,
          label: getLocalizedName(c, locale) || c.name || t(`categories.${c.slug}` as any),
        }))
      : FALLBACK_SLUGS.map((slug) => ({
          slug,
          label: t(`categories.${slug}` as any),
        }));

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-fg">
        {t('listings.category')}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((cat) => {
          const active = value === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onChange(cat.slug)}
              className={`flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? 'border-brand-primary bg-brand-primary/8 text-brand-primary'
                  : 'border-border bg-bg-elevated text-fg hover:border-fg-subtle'
              }`}
            >
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

interface BreedSelectorProps {
  categorySlug: string;
  value: string;
  customValue?: string;
  onChange: (value: string) => void;
  onCustomChange?: (value: string) => void;
  placeholder?: string;
}

const OTHER_VALUE = '__other__';

export function BreedSelector({
  categorySlug,
  value,
  customValue = '',
  onChange,
  onCustomChange,
  placeholder,
}: BreedSelectorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { breeds } = useBreeds(categorySlug);

  if (breeds.length === 0) {
    return (
      <input
        value={customValue || value}
        onChange={(e) => {
          if (onCustomChange) onCustomChange(e.target.value);
          else onChange(e.target.value);
        }}
        placeholder={placeholder ?? t('animal.breed')}
        className="input-base w-full"
      />
    );
  }

  const isOther = value === OTHER_VALUE || (value !== '' && !breeds.find((b) => b.slug === value));

  const getLocalizedName = (breed: Breed, loc: string) => {
    if (loc === 'ru') return breed.name_ru || breed.name_uz;
    if (loc === 'en') return breed.name_en || breed.name_uz;
    if (loc === 'uz-cyrl') return breed.name_uz_cyrl || breed.name_uz;
    return breed.name_uz;
  };

  return (
    <div className="space-y-2">
      <select
        value={isOther ? OTHER_VALUE : value}
        onChange={(e) => {
          if (e.target.value === OTHER_VALUE) {
            onChange(OTHER_VALUE);
          } else {
            onChange(e.target.value);
            if (onCustomChange) onCustomChange('');
          }
        }}
        className="input-base w-full cursor-pointer"
      >
        <option value="">{t('animal.selectBreed' as any) || t('animal.breed')}</option>
        {breeds.map((b) => (
          <option key={b.slug} value={b.slug}>
            {getLocalizedName(b, locale) || b.name}
          </option>
        ))}
        <option value={OTHER_VALUE}>{t('common.other' as any) || 'Boshqa...'}</option>
      </select>

      {isOther && (
        <input
          value={customValue}
          onChange={(e) => onCustomChange?.(e.target.value)}
          placeholder={t('animal.enterBreed' as any) || "Zot nomini kiriting..."}
          className="input-base w-full"
          autoFocus
        />
      )}
    </div>
  );
}
