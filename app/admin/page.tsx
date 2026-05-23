'use client';

/**
 * Admin Dashboard — real-time stats from backend.
 * No demo / hardcoded data.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Users, Package, Flag, TrendingUp, ArrowRight,
  Megaphone, BarChart3, MessageCircle, Eye, Loader2,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { formatNumber } from '@/lib/utils/format';
import { analyticsApi, type DashboardStats } from '@/lib/api/analytics';

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: typeof Users;
  tone: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="surface-elevated p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-fg">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          <p className="mt-1.5 text-xs font-semibold text-fg-subtle">{subtext}</p>
        </div>
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    analyticsApi
      .dashboard()
      .then((d) => !cancelled && setStats(d))
      .catch(
        (e: any) =>
          !cancelled &&
          setError(e?.response?.data?.detail || e?.message || 'Failed to load dashboard'),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = stats
    ? [
        {
          label: t('admin.totalUsers'),
          value: stats.users.total,
          subtext: `+${stats.users.new_today} bugun`,
          icon: Users,
          tone: 'bg-info/12 text-info',
        },
        {
          label: t('admin.activeListings'),
          value: stats.listings.active,
          subtext: `${formatNumber(stats.listings.total)} jami`,
          icon: Package,
          tone: 'bg-brand-primary/10 text-brand-primary',
        },
        {
          label: "Ko'rishlar",
          value: stats.engagement.total_views,
          subtext: `+${stats.engagement.views_today} bugun`,
          icon: Eye,
          tone: 'bg-success/12 text-success',
        },
        {
          label: 'Xabarlar',
          value: stats.messages.total,
          subtext: `+${stats.messages.today} bugun`,
          icon: MessageCircle,
          tone: 'bg-purple-500/12 text-purple-600',
        },
      ]
    : [];

  const quickLinks = [
    { href: '/admin/users', icon: Users, label: t('admin.userManagement') },
    { href: '/admin/listings', icon: Package, label: t('admin.listingModeration') },
    { href: '/admin/complaints', icon: Flag, label: t('admin.complaintsQueue') },
    { href: '/admin/broadcasts', icon: Megaphone, label: t('admin.broadcasts') },
    { href: '/admin/analytics', icon: BarChart3, label: t('admin.analytics') },
  ];

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-eyebrow">{t('admin.title')}</p>
          <h1 className="display-md mt-2">{t('admin.dashboard')}</h1>
        </motion.div>

        {error && (
          <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {loading && !stats && (
          <div className="mt-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        )}

        {stats && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((s, i) => (
                <StatCard key={s.label} {...s} delay={i * 0.05} />
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Quick links */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="surface-elevated overflow-hidden"
              >
                <div className="border-b border-border px-5 py-4">
                  <h2 className="display-sm">{t('common.settings')}</h2>
                </div>
                <div className="p-3">
                  {quickLinks.map((l) => {
                    const Icon = l.icon;
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-fg hover:bg-bg-subtle"
                      >
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bg-subtle text-fg-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary">
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <span className="flex-1">{l.label}</span>
                        <ArrowRight
                          className="h-4 w-4 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
                          strokeWidth={2}
                        />
                      </Link>
                    );
                  })}
                </div>
              </motion.div>

              {/* Live activity glance */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="surface-elevated overflow-hidden"
              >
                <div className="border-b border-border px-5 py-4">
                  <h2 className="display-sm">{t('analytics.todayShort' as any) ?? 'Bugun'}</h2>
                </div>
                <div className="grid grid-cols-2 gap-2 p-4">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs text-fg-subtle">Yangi foydalanuvchilar</p>
                    <p className="mt-1 font-display text-2xl font-bold text-brand-primary">
                      {formatNumber(stats.users.new_today)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs text-fg-subtle">Yangi e'lonlar</p>
                    <p className="mt-1 font-display text-2xl font-bold text-info">
                      {formatNumber(stats.listings.new_today)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs text-fg-subtle">Sotilgan e'lonlar</p>
                    <p className="mt-1 font-display text-2xl font-bold text-success">
                      {formatNumber(stats.listings.sold)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs text-fg-subtle">Faol foydalanuvchilar</p>
                    <p className="mt-1 font-display text-2xl font-bold text-purple-600">
                      {formatNumber(stats.users.active)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
