'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Camera,
  Save,
  Loader2,
  MapPin,
  User,
  FileText,
  Phone,
  CheckCircle2,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { LocationSelector } from '@/components/shared/LocationSelector';
import { useAuthStore } from '@/lib/store/auth';
import { usersApi } from '@/lib/api/users';

const REGIONS_PLACEHOLDER: string[] = []; // legacy — replaced by LocationSelector below

export default function EditProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    bio: user?.bio ?? '',
    region: '',
    region_name: '',
    district: '',
    district_name: '',
    location: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? '',
        bio: user.bio ?? '',
        region: '',
        region_name: '',
        district: '',
        district_name: '',
        location: '',
      });
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('errors.fileTooLarge'));
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError(t('errors.required'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name.trim());
      if (form.bio) fd.append('bio', form.bio);
      if (form.region) fd.append('region', form.region);
      if (form.district) fd.append('district', form.district);
      if (form.location) fd.append('location', form.location);
      if (avatarFile) fd.append('avatar', avatarFile);

      const updated = await usersApi.updateProfile(fd);
      updateUser(updated);
      setSaved(true);
      setTimeout(() => router.push('/profile'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-2xl"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-ghost btn-sm -ml-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              {t('common.back')}
            </button>

            <p className="text-eyebrow">{t('profile.profile')}</p>
            <h1 className="display-md mt-2">{t('profile.editProfile')}</h1>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Avatar */}
              <div className="surface-elevated p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                  {t('profile.avatar')}
                </h2>
                <div className="mt-4 flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={avatarPreview ?? user?.avatar_url ?? user?.avatar ?? null}
                      name={form.full_name || user?.full_name}
                      size="xl"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-elevated bg-brand-primary text-white shadow-sm transition-transform hover:scale-105"
                      aria-label={t('profile.uploadAvatar')}
                    >
                      <Camera className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-fg">{t('profile.uploadAvatar')}</p>
                    <p className="mt-1 text-xs text-fg-muted">JPG, PNG, WebP · max 5 MB</p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="btn btn-secondary btn-sm mt-3"
                    >
                      <Camera className="h-4 w-4" strokeWidth={1.75} />
                      {t('profile.uploadAvatar')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <div className="surface-elevated p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                  {t('profile.profile')}
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-fg">
                      {t('profile.fullName')} <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        required
                        placeholder={t('profile.fullName')}
                        className="input-base w-full pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-fg">
                      {t('profile.bio')}
                    </label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        rows={4}
                        maxLength={500}
                        placeholder={t('profile.biography')}
                        className="input-base w-full resize-none pl-11 pt-3"
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-fg-subtle">
                      {form.bio.length}/500
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone — immutable */}
              <div className="surface-elevated p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                  {t('profile.phone')}
                </h2>
                <div className="mt-4">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
                    <input
                      type="tel"
                      value={user?.phone ?? ''}
                      readOnly
                      className="input-base w-full cursor-not-allowed pl-11 opacity-60"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-fg-subtle">
                    Telefon raqam oʻzgartirib boʻlmaydi
                  </p>
                </div>
              </div>

              {/* Location — backend-driven dependent selector */}
              <div className="surface-elevated p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                  {t('listings.location')}
                </h2>
                <div className="mt-4">
                  <LocationSelector
                    regionValue={form.region}
                    districtValue={form.district}
                    locationValue={form.location}
                    onRegionChange={(slug, name) =>
                      setForm((p) => ({ ...p, region: slug, region_name: name, district: '', district_name: '' }))
                    }
                    onDistrictChange={(slug, name) =>
                      setForm((p) => ({ ...p, district: slug, district_name: name }))
                    }
                    onLocationChange={(v) => setForm((p) => ({ ...p, location: v }))}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={saving}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving || saved}
                  className="btn btn-primary flex-1"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                      {t('success.saved')}
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" strokeWidth={1.75} />
                      {t('common.save')}
                    </>
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
