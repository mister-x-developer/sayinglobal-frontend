'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Bell,
  Globe,
  Eye,
  Shield,
  Trash2,
  Check,
  Moon,
  Sun,
  ArrowLeft,
  MessageSquareText,
  Package,
  ShieldCheck,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/components/providers/ThemeProvider';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        on ? 'bg-brand-primary' : 'bg-border-strong'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  on,
  onToggle,
}: {
  label: string;
  description?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{label}</p>
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-elevated overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">{title}</h2>
      </div>
      <div className="divide-y divide-border px-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const [notifs, setNotifs] = useState({
    email: true,
    push: true,
    messages: true,
    listings: true,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState({
    showPhone: true,
    showEmail: false,
    showLocation: true,
    allowMessages: true,
  });

  const toggleNotif = (key: keyof typeof notifs) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const togglePrivacy = (key: keyof typeof privacy) =>
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));

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

            <p className="text-eyebrow">{t('settings.title')}</p>
            <h1 className="display-md mt-2">{t('settings.title')}</h1>
            <p className="mt-2 text-fg-muted">{t('settings.account')}</p>

            <div className="mt-8 space-y-4">
              {/* APPEARANCE */}
              <Section title={t('settings.theme')}>
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'day' as const, icon: Sun, label: t('settings.dayMode') },
                      { key: 'night' as const, icon: Moon, label: t('settings.nightMode') },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = mode === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setMode(opt.key)}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                            active
                              ? 'border-brand-primary bg-brand-primary/8 text-brand-primary'
                              : 'border-border bg-bg-elevated text-fg hover:border-fg-subtle'
                          }`}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.75} />
                          <span className="text-sm font-semibold">{opt.label}</span>
                          {active && <Check className="ml-auto h-4 w-4" strokeWidth={2.25} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Section>

              {/* LANGUAGE */}
              <Section title={t('settings.language')}>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-fg">{t('settings.language')}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">uz, uz-cyrl, ru, en</p>
                  </div>
                  <LanguageSwitcher />
                </div>
              </Section>

              {/* NOTIFICATIONS */}
              <Section title={t('settings.notifications')}>
                <SettingRow
                  label={t('settings.emailNotifications')}
                  description="Muhim yangiliklar haqida email orqali"
                  on={notifs.email}
                  onToggle={() => toggleNotif('email')}
                />
                <SettingRow
                  label={t('settings.pushNotifications')}
                  description="Brauzer orqali bildirishnomalar"
                  on={notifs.push}
                  onToggle={() => toggleNotif('push')}
                />
                <SettingRow
                  label={t('settings.messageNotifications')}
                  description="Yangi xabarlar haqida"
                  on={notifs.messages}
                  onToggle={() => toggleNotif('messages')}
                />
                <SettingRow
                  label={t('settings.favoriteNotifications')}
                  description="Eʼlonlaringiz boʻyicha faollik"
                  on={notifs.listings}
                  onToggle={() => toggleNotif('listings')}
                />
              </Section>

              {/* PRIVACY */}
              <Section title={t('settings.privacy')}>
                <SettingRow
                  label={t('settings.showPhone')}
                  description="Profilingizda telefon raqamingiz koʻrinadi"
                  on={privacy.showPhone}
                  onToggle={() => togglePrivacy('showPhone')}
                />
                <SettingRow
                  label={t('settings.showLocation')}
                  description="Eʼlonlaringizda joylashuvingiz koʻrinadi"
                  on={privacy.showLocation}
                  onToggle={() => togglePrivacy('showLocation')}
                />
                <SettingRow
                  label={t('settings.showActivity')}
                  description="Boshqa foydalanuvchilar faolligingizni koʻradi"
                  on={privacy.allowMessages}
                  onToggle={() => togglePrivacy('allowMessages')}
                />
              </Section>

              {/* SECURITY */}
              <Section title={t('settings.security')}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/12 text-brand-accent">
                      <MessageSquareText className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-fg">Telegram</p>
                      <p className="text-xs text-fg-muted">Telegram orqali kirish</p>
                    </div>
                  </div>
                  <Badge variant="success">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2.25} />
                    {t('common.confirm')}
                  </Badge>
                </div>
              </Section>

              {/* DANGER ZONE */}
              <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger/12 text-danger">
                    <Shield className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-fg">{t('settings.deleteAccount')}</h3>
                    <p className="mt-1 text-sm text-fg-muted">{t('settings.deleteAccountWarning')}</p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn btn-danger btn-sm mt-4"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      {t('settings.deleteAccount')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Delete confirm overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-lift"
          >
            <h2 className="display-sm">{t('settings.deleteAccount')}</h2>
            <p className="mt-2 text-sm text-fg-muted">{t('settings.deleteAccountWarning')}</p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-fg-muted uppercase tracking-wider">
                Tasdiqlash uchun "OʻCHIRISH" deb yozing
              </label>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="input-base w-full"
                placeholder="OʻCHIRISH"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={deleteInput !== 'OʻCHIRISH'}
                className="btn btn-danger flex-1"
              >
                {t('common.delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
