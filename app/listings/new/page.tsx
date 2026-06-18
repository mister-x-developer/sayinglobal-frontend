'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Save,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Image as ImageIcon,
  X,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { AgeInput, type AnimalAge } from '@/components/listings/AgeInput';
import { CategorySelector, BreedSelector } from '@/components/shared/CategorySelector';
import { LocationSelector } from '@/components/shared/LocationSelector';
import { LocationPicker } from '@/components/shared/LocationPicker';
import { toast } from '@/components/ui/Toast';
import { listingsApi } from '@/lib/api/listings';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';

const GENDERS = [
  { value: 'male', key: 'animal.male' },
  { value: 'female', key: 'animal.female' },
] as const;

const HEALTH_KEYS = ['animal.healthExcellent', 'animal.healthGood', 'animal.healthAverage'] as const;
const VACCINATION_KEYS = ['animal.vaccinatedYes', 'animal.vaccinatedPartial', 'animal.vaccinatedNo'] as const;

interface ImagePreview {
  id: string;
  preview: string;
  file: File;
  isPrimary: boolean;
}

export default function NewListingPage() {
  const t = useTranslations();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (user && (!user.full_name || user.full_name === user.phone)) {
      toast.error(t('profile.fullNameRequired') || "Iltimos, e'lon berishdan oldin ism-familiyangizni kiriting!");
      router.push('/profile/edit');
    }
  }, [isAuthenticated, user, router, t]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ImagePreview[]>([]);

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    price: '',
    currency: 'UZS',
    is_negotiable: true,
    weight_kg: '',
    quantity: '1',
    gender: '',
    breed: '',
    breed_custom: '',
    health_status: '',
    vaccination_status: '',
    region: '',
    region_name: '',
    district: '',
    district_name: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [age, setAge] = useState<AnimalAge>({ years: undefined, months: undefined, days: undefined });

  const set = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.category) e.category = t('errors.required');
    if (!form.title.trim()) e.title = t('errors.required');
    else if (form.title.trim().length > 100) e.title = t('validation.titleTooLong');
    if (!form.description.trim()) e.description = t('errors.required');
    else if (form.description.trim().length > 2000) e.description = t('validation.descriptionTooLong');
    const priceNum = Number(form.price);
    if (!form.price || isNaN(priceNum) || priceNum < 0.01 || priceNum > 999999999.99) e.price = t('errors.required');
    if (!form.region) e.region = t('errors.required');
    if (!form.district) e.district = t('errors.required');
    if (!form.health_status) e.health_status = t('errors.required');
    // Breed is required: either a dropdown selection or a custom value
    const isOtherBreed = form.breed === '__other__';
    if (!form.breed.trim() || (isOtherBreed && !form.breed_custom.trim())) {
      e.breed = t('errors.required');
    }
    if (!form.gender) e.gender = t('errors.required');
    if (!form.weight_kg || isNaN(Number(form.weight_kg)) || Number(form.weight_kg) <= 0) e.weight_kg = t('errors.required');
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) e.quantity = t('errors.required');
    if (form.latitude == null || form.longitude == null) e.location = t('errors.required');
    if (!age.years && !age.months && !age.days) e.age = t('validation.atLeastOneFieldRequired');
    if (images.length < 3) e.images = "Kamida 3 ta rasm kiritish majburiy";
    if (images.length > 5) e.images = "Koʻpi bilan 5 ta rasm kiritish mumkin";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - images.length;
    const toAdd = files.slice(0, remaining);
    const previews: ImagePreview[] = toAdd.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      preview: URL.createObjectURL(file),
      file,
      isPrimary: images.length === 0 && i === 0,
    }));
    setImages((prev) => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const setPrimary = (id: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;


    setSaving(true);
    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currency: form.currency,
        is_negotiable: form.is_negotiable,
        age_years: age.years ?? 0,
        age_months: age.months ?? 0,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        quantity: form.quantity ? Number(form.quantity) : 1,
        gender: form.gender || undefined,
        // breed: send null when 'Other' is selected (breed_custom is used instead)
        breed: (form.breed && form.breed !== '__other__') ? form.breed.trim() : undefined,
        breed_custom: form.breed_custom.trim() || undefined,
        health_status: form.health_status || undefined,
        vaccination_status: form.vaccination_status || undefined,
        region: form.region_name || form.region,
        district: form.district_name || form.district,
        // Prefer the explicitly entered location text, otherwise fallback to region, district
        location: form.location.trim() || [form.region_name || form.region, form.district_name || form.district]
          .filter(Boolean).join(', ') || form.region_name || form.region,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
      };
      const listing = await listingsApi.create(payload as any);
      
      // Upload images with error handling
      let uploadedCount = 0;
      for (const img of images) {
        try {
          await listingsApi.uploadImage(String(listing.public_id), img.file, img.isPrimary);
          uploadedCount++;
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
        }
      }
      
      if (uploadedCount === 0 && images.length > 0) {
        toast.error(t('errors.uploadFailed'));
      }
      
      setSaved(true);
      toast.success(t('create.publishSuccess'));
      // Use window.location for the same atomic navigation as in auth.
      if (typeof window !== 'undefined') {
        window.location.href = `/listings/detail?id=${listing.public_id}`;
      } else {
        router.push(`/listings/detail?id=${listing.public_id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('errors.saveFailed');
      let displayMsg = msg;
      if (msg.startsWith('api_error.')) {
        const key = msg.split('.')[1];
        if (key === 'network' || key === 'timeout') displayMsg = t('errors.networkError');
        else if (key === 'permissionDenied') displayMsg = t('errors.forbidden');
        else if (key === 'unknown') displayMsg = t('errors.somethingWrong');
        else displayMsg = t(`errors.${key}` as any) ?? t('errors.somethingWrong');
      }
      toast.error(displayMsg);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1">
        <div className="container-page py-6 pb-40 sm:py-8 sm:pb-10"> {/* generous mobile bottom padding so the full form (incl. map pin + price + submit) is visible above bottom nav + AI button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-2xl"
          >
            <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-sm -ml-2 mb-4">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              {t('common.back')}
            </button>
            <p className="text-eyebrow">{t('listings.title')}</p>
            <h1 className="display-md mt-2">{t('create.title')}</h1>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6 sm:space-y-8" noValidate>
              {/* Category */}
              <div className="surface-elevated p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">1</span>
                  <h2 className="text-lg font-bold tracking-tight text-fg">{t('create.stepCategory')}</h2>
                </div>
                <CategorySelector
                  value={form.category}
                  onChange={(slug) => set('category', slug)}
                  error={errors.category}
                  required
                />
              </div>

              {/* Details */}
              <div className="surface-elevated p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">2</span>
                  <h2 className="text-lg font-bold tracking-tight text-fg">{t('create.stepDetails')}</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-fg-subtle">
                      {t('listings.title2')} <span className="text-danger">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => set('title', e.target.value)}
                      placeholder={t('create.titlePlaceholder')}
                      className="input-base w-full"
                    />
                    {errors.title && <p className="mt-1.5 text-xs font-medium text-danger">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-fg-subtle">
                      {t('listings.description')} <span className="text-danger">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder={t('create.descriptionPlaceholder')}
                      rows={5}
                      className="input-base w-full resize-none py-3 h-auto"
                    />
                    {errors.description && <p className="mt-1.5 text-xs font-medium text-danger">{errors.description}</p>}
                  </div>

                  {/* Structured age */}
                  <AgeInput value={age} onChange={setAge} error={errors.age} required />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">
                          {t('listings.quantity')} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.quantity}
                          onChange={(e) => set('quantity', e.target.value)}
                          placeholder="1"
                          className="input-base w-full"
                        />
                        {errors.quantity && <p className="mt-1 text-xs text-danger">{errors.quantity}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">
                          {t('animal.weight')} ({t('animal.kg')}) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={form.weight_kg}
                          onChange={(e) => set('weight_kg', e.target.value)}
                          placeholder="0"
                          className="input-base w-full"
                        />
                        {errors.weight_kg && <p className="mt-1 text-xs text-danger">{errors.weight_kg}</p>}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">
                        {t('animal.gender')} <span className="text-danger">*</span>
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => set('gender', e.target.value)}
                        className="input-base w-full cursor-pointer"
                      >
                        <option value="">—</option>
                        {GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>{t(g.key as any)}</option>
                        ))}
                      </select>
                      {errors.gender && <p className="mt-1 text-xs text-danger">{errors.gender}</p>}
                    </div>
                  </div>

                  {/* Breed — dropdown + "Other" freetext option */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-fg">
                      {t('animal.breed')} <span className="text-danger">*</span>
                    </label>
                    <BreedSelector
                      categorySlug={form.category}
                      value={form.breed}
                      customValue={form.breed_custom}
                      onChange={(v) => set('breed', v)}
                      onCustomChange={(v) => set('breed_custom', v)}
                      placeholder={t('animal.breed')}
                    />
                    {errors.breed && <p className="mt-1 text-xs text-danger">{errors.breed}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-fg">
                        {t('animal.health')} <span className="text-danger">*</span>
                      </label>
                      <select
                        value={form.health_status}
                        onChange={(e) => set('health_status', e.target.value)}
                        className="input-base w-full cursor-pointer"
                      >
                        <option value="">—</option>
                        {HEALTH_KEYS.map((k) => (
                          <option key={k} value={t(k as any)}>{t(k as any)}</option>
                        ))}
                      </select>
                      {errors.health_status && <p className="mt-1 text-xs text-danger">{errors.health_status}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-fg">
                        {t('animal.vaccination')}
                      </label>
                      <select
                        value={form.vaccination_status}
                        onChange={(e) => set('vaccination_status', e.target.value)}
                        className="input-base w-full cursor-pointer"
                      >
                        <option value="">—</option>
                        {VACCINATION_KEYS.map((k) => (
                          <option key={k} value={t(k as any)}>{t(k as any)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="surface-elevated p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">3</span>
                  <h2 className="text-lg font-bold tracking-tight text-fg">{t('create.stepPhotos')}</h2>
                </div>
                {images.length > 0 && (
                  <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {images.map((img) => (
                      <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border-2 border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.preview} alt="" className="h-full w-full object-cover" />
                        {img.isPrimary && (
                          <div className="absolute bottom-1 left-1 rounded-md bg-brand-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {t('listings.primaryPhoto')}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          {!img.isPrimary && (
                            <button type="button" onClick={() => setPrimary(img.id)} className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-fg">
                              {t('listings.setPrimary')}
                            </button>
                          )}
                          <button type="button" onClick={() => removeImage(img.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white">
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-bg-subtle py-8 text-fg-muted transition-colors hover:border-brand-primary hover:bg-brand-primary/4 hover:text-brand-primary"
                  >
                    <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
                    <span className="text-sm font-medium">{t('create.uploadPhotos')}</span>
                    <span className="text-xs">{t('create.photosHint')}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImages} className="hidden" />
                <p className="mt-2 text-xs text-fg-subtle">{images.length}/5 · {t('validation.minImages')}</p>
                {errors.images && <p className="mt-1 text-xs text-danger">{errors.images}</p>}
              </div>

              {/* Location — backend-driven dependent selector */}
              <div className="surface-elevated p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">4</span>
                  <h2 className="text-lg font-bold tracking-tight text-fg">{t('create.stepLocation')}</h2>
                </div>
                <LocationSelector
                  regionValue={form.region}
                  districtValue={form.district}
                  locationValue={form.location}
                  onRegionChange={(slug, name) => setForm((p) => ({ ...p, region: slug, region_name: name, district: '', district_name: '' }))}
                  onDistrictChange={(slug, name) => setForm((p) => ({ ...p, district: slug, district_name: name }))}
                  onLocationChange={(v) => set('location', v)}
                  errors={errors}
                  required
                />

                {/* Map pin — REQUIRED so nearby & map render the listing */}
                <div className="mt-6">
                  <label className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                    {t('create.mapPinLabel' as any)} <span className="text-danger">*</span>
                  </label>
                  <p className="mt-1 mb-3 text-xs text-fg-muted">
                    {t('create.mapPinHelp' as any)}
                  </p>
                  <LocationPicker
                    value={{ lat: form.latitude, lng: form.longitude }}
                    onChange={(next) => setForm((p) => ({
                      ...p,
                      latitude: next?.lat ?? null,
                      longitude: next?.lng ?? null,
                    }))}
                    onAddress={async (addr) => {
                      // Ko'cha nomini location'ga YOZMAYMIZ — faqat region/district match qilamiz
                      // location = "Viloyat, Tuman" formatida avtomatik quriladi

                      // Try to match region name → slug from backend
                      if (addr.region && !form.region) {
                        try {
                          const { referenceApi } = await import('@/lib/api/reference');
                          const regions = await referenceApi.getRegions();
                          // Match by name (case-insensitive, partial)
                          const regionName = addr.region.toLowerCase();
                          const matched = regions.find((r) => {
                            const names = [r.name_uz, r.name_ru, r.name_en, r.name].map((n) => (n || '').toLowerCase());
                            return names.some((n) => n && (n.includes(regionName) || regionName.includes(n.split(' ')[0])));
                          });
                          if (matched) {
                            setForm((p) => ({
                              ...p,
                              region: matched.slug,
                              region_name: matched.name_uz || matched.name,
                            }));
                            // Also try to match district
                            if (addr.district) {
                              const districtName = addr.district.toLowerCase();
                              const districts = await referenceApi.getDistricts(matched.slug);
                              const matchedDistrict = districts.find((d) => {
                                const dnames = [d.name_uz, d.name_ru, d.name_en, d.name].map((n) => (n || '').toLowerCase());
                                return dnames.some((n) => n && (n.includes(districtName) || districtName.includes(n.split(' ')[0])));
                              });
                              if (matchedDistrict) {
                                setForm((p) => ({
                                  ...p,
                                  district: matchedDistrict.slug,
                                  district_name: matchedDistrict.name_uz || matchedDistrict.name,
                                }));
                              }
                            }
                          }
                        } catch {
                          // Silently ignore — user can select manually
                        }
                      }
                    }}
                  />
                  {errors.location && (
                    <p className="mt-2 text-xs text-danger">{errors.location}</p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="surface-elevated p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">5</span>
                  <h2 className="text-lg font-bold tracking-tight text-fg">{t('create.stepPrice')}</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-sm font-medium text-fg">
                        {t('listings.price')} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={(e) => set('price', e.target.value)}
                        placeholder={t('create.pricePlaceholder')}
                        className="input-base w-full"
                      />
                      {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
                    </div>
                    <div className="w-28">
                      <label className="mb-1.5 block text-sm font-medium text-fg">{t('listings.currency')}</label>
                      <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className="input-base w-full cursor-pointer">
                        <option value="UZS">UZS</option>
                        <option value="USD">{t('common.usd')}</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3">
                    <div
                      role="switch"
                      aria-checked={form.is_negotiable}
                      onClick={() => set('is_negotiable', !form.is_negotiable)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${form.is_negotiable ? 'bg-brand-primary' : 'bg-border-strong'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${form.is_negotiable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm font-medium text-fg">{t('listings.negotiable')}</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => router.back()} disabled={saving} className="btn btn-secondary flex-1">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving || saved} className="btn btn-primary flex-1">
                  {saved ? (
                    <><CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />{t('success.created')}</>
                  ) : saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />{t('create.publishing')}</>
                  ) : (
                    <><Save className="h-4 w-4" strokeWidth={1.75} />{t('create.publishListing')}</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
