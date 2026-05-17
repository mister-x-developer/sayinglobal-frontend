'use client';

import { useTranslations } from 'next-intl';

export interface AnimalAge {
  years?: number;
  months?: number;
  days?: number;
}

interface AgeInputProps {
  value: AnimalAge;
  onChange: (age: AnimalAge) => void;
  error?: string;
  required?: boolean;
}

/**
 * Structured animal age input.
 * Stores years/months/days separately — no translation ambiguity.
 * At least one field must be filled (validated by parent).
 * All labels come from translation files — no inline locale maps.
 */
export function AgeInput({ value, onChange, error, required }: AgeInputProps) {
  const t = useTranslations();

  const set = (field: keyof AnimalAge, raw: string) => {
    const n = raw === '' ? undefined : Math.max(0, parseInt(raw, 10) || 0);
    onChange({ ...value, [field]: n });
  };

  const fields: { key: keyof AnimalAge; labelKey: string; max: number }[] = [
    { key: 'years',  labelKey: 'animal.years',  max: 30 },
    { key: 'months', labelKey: 'animal.months', max: 11 },
    { key: 'days',   labelKey: 'animal.days',   max: 30 },
  ];

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-fg">
        {t('animal.age')}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {fields.map((f) => (
          <div key={f.key} className="relative">
            <input
              type="number"
              min={0}
              max={f.max}
              value={value[f.key] ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder="0"
              className="input-base w-full pr-12 text-center"
              aria-label={t(f.labelKey as any)}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-subtle">
              {t(f.labelKey as any)}
            </span>
          </div>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      <p className="mt-1.5 text-xs text-fg-subtle">
        {t('validation.atLeastOneFieldRequired')}
      </p>
    </div>
  );
}

/**
 * AgeDisplay — renders structured age using translation keys.
 * No inline locale maps. All text from messages/*.json.
 */
export function AgeDisplay({ age }: { age: AnimalAge }) {
  const t = useTranslations();
  const parts: string[] = [];

  if (age.years && age.years > 0) {
    parts.push(`${age.years}\u00A0${t(age.years === 1 ? 'animal.year' : 'animal.years' as any)}`);
  }
  if (age.months && age.months > 0) {
    parts.push(`${age.months}\u00A0${t(age.months === 1 ? 'animal.month' : 'animal.months' as any)}`);
  }
  if (age.days && age.days > 0) {
    parts.push(`${age.days}\u00A0${t(age.days === 1 ? 'animal.day' : 'animal.days' as any)}`);
  }

  if (parts.length === 0) return null;
  return <span>{parts.join(' ')}</span>;
}
