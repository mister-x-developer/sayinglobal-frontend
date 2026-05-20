'use client';

/**
 * Edit Listing — production rewrite.
 *
 * - Loads the real listing via listingsApi.detail(publicId)
 * - Pre-fills the form from the loaded record
 * - Submits via listingsApi.update; backend automatically sends edited
 *   active listings back to moderation
 * - Includes LocationSelector + LocationPicker so coordinates can be
 *   added/edited
 * - Handles delete (admin or owner): listingsApi.remove
 *
 * No demo data. No fake state. The page redirects to /auth if the user
 * is not signed in, or to /listings/my with a toast if they don't own
 * this listing and are not an admin.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  Image as ImageIcon,
  X,
  Upload,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { CategorySelector, BreedSelector } from '@/components/shared/CategorySelector';
import { LocationSelector } from '@/components/shared/LocationSelector';
import { LocationPicker } from '@/components/shared/LocationPicker';
import { useAuthStore } from '@/lib/store/auth';
import { listingsApi, type Listing } from '@/lib/api/listings';

interface EditForm {
  category: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  is_negotiable: boolean;
  age_years: string;
  age_months: string;
  weight_kg: string;
  gender: string;
  breed: string;
  health_status: string;
  vaccination_status: string;
  region: string;
  region_name: string;
  district: string;
  district_name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
}

export default function EditListingPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const publicId = Number(params?.id ?? 0);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [listing, setListing] = useState<Listing | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace(`/auth?next=/listings/${publicId}/edit`);
  }, [hydrated, isAuthenticated, router, publicId]);

  // Load listing
  useEffect(() => {
    if (!Number.isFinite(publicId) || !publicId) return;
    let alive = true;
    setLoading(true);
    listingsApi
      .detail(publicId)
      .then((data) => {
        if (!alive) return;
        if (!data) {
          setListing(null);
          setForm(null);
          return;
        }
        // Permission check (client-side; the server still enforces).
        const isOwner = (data as any).seller?.public_id === user?.public_id;
        const isAdmin = !!user?.is_admin;
        if (!isOwner && !isAdmin) {
          toast.error(t('errors.permissionDenied' as any) ?? 'Permission denied');
          router.replace('/listings/my');
          return;
        }
        setListing(data);
        setForm({
          category: (data.category as any)?.name ?? (data.category as any) ?? '',
          title: data.title ?? '',
          description: data.description ?? '',
          price: data.price != null ? String(data.price) : '',
          currency: data.currency ?? 'UZS',
          is_negotiable: !!data.is_negotiable,
          age_years: data.age_years != null ? String(data.age_years) : '',
          age_months: data.age_months != null ? String(data.age_months) : '',
          weight_kg: data.weight_kg != null ? String(data.weight_kg) : '',
          gender: (data as any).gender ?? '',
          breed: data.breed ?? '',
          health_status: data.health_status ?? '',
          vaccination_status: data.vaccination_status ?? '',
          region: '', // selector requires slug; we fall back to region_name
          region_name: data.region ?? '',
          district: '',
          district_name: data.district ?? '',
          location: data.location ?? '',
          latitude: data.latitude != null ? Number(data.latitude) : null,
          longitude: data.longitude != null ? Number(data.longitude) : null,
        });
      })
      .catch(() => {
        if (alive) {
          setListing(null);
          setForm(null);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [publicId, user?.public_id, user?.is_admin, router, t]);

  const update = (patch: Partial<EditForm>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !listing) return;
    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        currency: form.currency,
        is_negotiable: form.is_negotiable,
        age_years: form.age_years ? Number(form.age_years) : undefined,
        age_months: form.age_months ? Number(form.age_months) : undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        gender: form.gender || undefined,
        breed: form.breed.trim() || undefined,
        health_status: form.health_status.trim() || undefined,
        vaccination_status: form.vaccination_status.trim() || undefined,
        region: form.region_name || form.region || undefined,
        district: form.district_name || form.district || undefined,
        location: form.location.trim(),
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
      };
      await listingsApi.update(publicId, payload);
      toast.success(t('success.updated'));
      router.push(`/listings/${publicId}`);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await listingsApi.remove(publicId);
      toast.success(t('success.deleted' as any) ?? t('success.updated'));
      router.push('/listings/my');
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (!hydrated) return null;

  if (loading || !form) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppNav />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-sm -ml-2">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            {t('common.back')}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-3 flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <p className="text-eyebrow">{t('listings.editListing' as any) ?? 'Edit listing'}</p>
              <h1 className="display-md mt-2">{form.title || `#${publicId}`}</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDelete(true)}
              className="border-danger/40 text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              {t('common.delete')}
            </Button>
          </motion.div>

          <form onSubmit={handleSave} className="mt-6 space-y-6">
            {/* Category */}
            <div className="surface-elevated p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                {t('listings.category')}
              </h2>
              <CategorySelector
                value={form.category}
                onChange={(slug) => update({ category: slug })}
              />
              {form.category && (
                <div className="mt-4">
                  <BreedSelector
                    categorySlug={form.category}
                    value={form.breed}
                    onChange={(name) => update({ breed: name })}
                  />
                </div>
              )}
            </div>

            {/* Title + description */}
            <div className="surface-elevated p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                {t('create.stepBasics' as any) ?? t('listings.title')}
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder={t('listings.titlePlaceholder')}
                  className="input-base h-12 w-full"
                  required
                />
                <textarea
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder={t('listings.descriptionPlaceholder')}
                  rows={6}
                  className="input-base h-auto w-full py-3"
                  required
                />
              </div>
            </div>

            {/* Specs */}
            <div className="surface-elevated p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                {t('listings.specifications')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  value={form.age_years}
                  onChange={(e) => update({ age_years: e.target.value })}
                  placeholder={t('listings.age')}
                  className="input-base h-12 w-full"
                  min="0"
                />
                <input
                  type="number"
                  value={form.weight_kg}
                  onChange={(e) => update({ weight_kg: e.target.value })}
                  placeholder={t('listings.weight') + ' (kg)'}
                  className="input-base h-12 w-full"
                  min="0"
                />
                <select
                  value={form.gender}
                  onChange={(e) => update({ gender: e.target.value })}
                  className="input-base h-12 w-full"
                >
                  <option value="">{t('listings.gender')}</option>
                  <option value="male">{t('listings.male' as any) ?? 'Male'}</option>
                  <option value="female">{t('listings.female' as any) ?? 'Female'}</option>
                </select>
                <input
                  type="text"
                  value={form.health_status}
                  onChange={(e) => update({ health_status: e.target.value })}
                  placeholder={t('listings.healthStatus' as any) ?? 'Health'}
                  className="input-base h-12 w-full"
                />
              </div>
            </div>

            {/* Location + map pin */}
            <div className="surface-elevated p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                {t('create.stepLocation')}
              </h2>
              <LocationSelector
                regionValue={form.region}
                districtValue={form.district}
                locationValue={form.location}
                onRegionChange={(slug, name) => update({ region: slug, region_name: name, district: '', district_name: '' })}
                onDistrictChange={(slug, name) => update({ district: slug, district_name: name })}
                onLocationChange={(v) => update({ location: v })}
                errors={{}}
                required
              />
              <div className="mt-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  {t('create.mapPinLabel' as any)}
                </label>
                <p className="mt-1 mb-3 text-xs text-fg-muted">
                  {t('create.mapPinHelp' as any)}
                </p>
                <LocationPicker
                  value={{ lat: form.latitude, lng: form.longitude }}
                  onChange={(next) => update({
                    latitude: next?.lat ?? null,
                    longitude: next?.lng ?? null,
                  })}
                />
              </div>
            </div>

            {/* Price */}
            <div className="surface-elevated p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                {t('create.stepPrice')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update({ price: e.target.value })}
                  placeholder={t('listings.price')}
                  className="input-base h-12 w-full"
                  min="0"
                  step="any"
                  required
                />
                <select
                  value={form.currency}
                  onChange={(e) => update({ currency: e.target.value })}
                  className="input-base h-12 w-full"
                >
                  <option value="UZS">UZS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <label className="mt-4 inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_negotiable}
                  onChange={(e) => update({ is_negotiable: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-brand-primary"
                />
                {t('listings.negotiable')}
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary"
                disabled={saving}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={2.25} />
                )}
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Delete confirmation modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)}>
        <div className="p-6">
          <h3 className="font-display text-lg font-semibold">{t('common.delete')}</h3>
          <p className="mt-2 text-sm text-fg-muted">
            {t('listings.deleteConfirm' as any) ?? 'Are you sure?'}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
              className="btn btn-secondary flex-1"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-danger flex-1"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              )}
              {t('common.delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
