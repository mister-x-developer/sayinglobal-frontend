'use client';

import { useTranslations } from 'next-intl';
import { useCategories, useBreeds } from '@/lib/hooks/useReferenceData';
import type { Category } from '@/lib/api/reference';

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

  // When backend data is available, use it (name field is locale-resolved by backend).
  // When not, fall back to slugs + t() for display names.
  const items: Array<{ slug: string; label: string }> =
    backendCats.length > 0
      ? backendCats.map((c: Category) => ({
          slug: c.slug,
          label: c.name || t(`categories.${c.slug}` as any),
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
  const { breeds } = useBreeds(categorySlug);

  // If no breeds from backend, show only freetext input
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

  // Check if current value matches a known breed
  const isOther = value === OTHER_VALUE || (value !== '' && !breeds.find((b) => (b.name || b.name_uz) === value));

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
          <option key={b.slug} value={b.name || b.name_uz}>
            {b.name || b.name_uz}
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
