'use client';

import { useTranslations } from 'next-intl';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { useCategories, useBreeds } from '@/lib/hooks/useReferenceData';
import type { Category } from '@/lib/api/reference';

/**
 * Fallback category slugs — used when backend is unavailable.
 * Display names come from t('categories.{slug}') — NOT from inline locale maps.
 */
const FALLBACK_SLUGS = [
  { slug: 'cattle',  icon: 'cattle'  },
  { slug: 'sheep',   icon: 'sheep'   },
  { slug: 'goats',   icon: 'goats'   },
  { slug: 'horses',  icon: 'horses'  },
  { slug: 'camels',  icon: 'camels'  },
  { slug: 'poultry', icon: 'poultry' },
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
  const items: Array<{ slug: string; icon: string; label: string }> =
    backendCats.length > 0
      ? backendCats.map((c: Category) => ({
          slug: c.slug,
          icon: c.icon || c.slug,
          label: c.name || t(`categories.${c.slug}` as any),
        }))
      : FALLBACK_SLUGS.map((c) => ({
          slug: c.slug,
          icon: c.icon,
          label: t(`categories.${c.slug}` as any),
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
              className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? 'border-brand-primary bg-brand-primary/8 text-brand-primary'
                  : 'border-border bg-bg-elevated text-fg hover:border-fg-subtle'
              }`}
            >
              <CategoryIcon name={cat.icon as any} className="h-5 w-5 flex-shrink-0" />
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
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BreedSelector({ categorySlug, value, onChange, placeholder }: BreedSelectorProps) {
  const t = useTranslations();
  const { breeds } = useBreeds(categorySlug);

  if (breeds.length === 0) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('animal.breed')}
        className="input-base w-full"
      />
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-base w-full cursor-pointer"
    >
      <option value="">{t('animal.breed')}</option>
      {breeds.map((b) => (
        <option key={b.slug} value={b.name || b.name_uz}>
          {/* name is locale-resolved by backend; name_uz is fallback */}
          {b.name || b.name_uz}
        </option>
      ))}
    </select>
  );
}
