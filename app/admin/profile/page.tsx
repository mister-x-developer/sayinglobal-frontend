'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { User, Shield, Key, LogOut, Save, Loader2, Camera } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/auth';
import { usersApi } from '@/lib/api/users';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export default function AdminProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [bio, setBio] = useState((user as any)?.bio ?? '');
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('errors.fileTooLarge'));
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('full_name', fullName.trim());
      if (bio) fd.append('bio', bio);
      if (avatarFile) fd.append('avatar', avatarFile);

      const updated = await usersApi.updateProfile(fd);
      updateUser(updated);
      toast.success(t('success.saved'));
    } catch {
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <AdminLayout>
      <div className="container-page py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-6 w-6 text-brand-primary" strokeWidth={1.75} />
            <div>
              <p className="text-eyebrow">{t('Admin.admin')}</p>
              <h1 className="display-md mt-1">{t('profile.myProfile')}</h1>
            </div>
          </div>

          {/* Avatar + info */}
          <div className="surface-elevated p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <Avatar
                  src={avatarPreview ?? user?.avatar_url ?? user?.avatar ?? null}
                  name={user?.full_name}
                  size="xl"
                  ring
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
                <p className="text-xl font-bold text-fg">{user?.full_name}</p>
                <p className="text-sm text-fg-muted">{user?.phone}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                  <Shield className="h-3.5 w-3.5" strokeWidth={2} />
                  Administrator
                </div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="surface-elevated p-6 mb-6">
            <h2 className="display-sm mb-4 flex items-center gap-2">
              <User className="h-4 w-4" strokeWidth={1.75} />
              {t('profile.editProfile')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg">{t('profile.fullName')}</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg">{t('profile.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="input-base w-full resize-none py-3"
                />
              </div>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Save className="h-4 w-4" strokeWidth={1.75} />}
                {t('common.save')}
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="surface-elevated p-6 mb-6">
            <h2 className="display-sm mb-4 flex items-center gap-2">
              <Key className="h-4 w-4" strokeWidth={1.75} />
              {t('settings.security')}
            </h2>
            <p className="text-sm text-fg-muted mb-4">
              Kirish Telegram bot orqali amalga oshiriladi. Parol o&apos;rnatish shart emas.
            </p>
            <div className="flex items-center gap-3 rounded-xl bg-bg-subtle p-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <Shield className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">{t('General.telegramOtp')}</p>
                <p className="text-xs text-fg-muted">{t('General.secureLoginActive')}</p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary w-full text-danger border-danger/30 hover:bg-danger/8"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {t('nav.logout')}
          </button>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
