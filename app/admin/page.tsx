'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Users,
  Package,
  Flag,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Megaphone,
  BarChart3,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils/format';

function StatCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
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
          <p className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${
            trend === 'up' ? 'text-success' : 'text-danger'
          }`}>
            <TrendingUp
              className={`h-3.5 w-3.5 ${trend === 'down' ? 'rotate-180' : ''}`}
              strokeWidth={2.25}
            />
            {change}
          </p>
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
  const [timeRange, setTimeRange] = useState('7d');

  const stats = [
    { label: t('admin.totalUsers'), value: 12458, change: '+12.5%', trend: 'up' as const, icon: Users, tone: 'bg-info/12 text-info' },
    { label: t('admin.activeListings'), value: 3247, change: '+8.2%', trend: 'up' as const, icon: Package, tone: 'bg-brand-primary/10 text-brand-primary' },
    { label: t('admin.totalSales'), value: '2.4M', change: '+15.3%', trend: 'up' as const, icon: TrendingUp, tone: 'bg-success/12 text-success' },
    { label: t('admin.pendingComplaints'), value: 23, change: '-5.1%', trend: 'down' as const, icon: Flag, tone: 'bg-danger/12 text-danger' },
  ];

  const recentUsers = [
    { id: '1', full_name: 'Alisher Karimov', phone: '+998 90 123 45 67', status: 'good', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', full_name: 'Dilshod Rahimov', phone: '+998 91 234 56 78', status: 'good', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '3', full_name: 'Sardor Toshmatov', phone: '+998 93 345 67 89', status: 'warning', created_at: new Date(Date.now() - 10800000).toISOString() },
  ];

  const pendingListings = [
    { id: '1', title: 'Sogʻlom qoramol, 3 yosh', seller: 'Alisher Karimov', price: 15000000, created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: '2', title: 'Qoʻy, 2 yosh', seller: 'Dilshod Rahimov', price: 3500000, created_at: new Date(Date.now() - 3600000).toISOString() },
  ];

  const recentComplaints = [
    { id: '1', type: 'listing', title: 'Notoʻgʻri maʼlumot', reporter: 'Jamshid Yusupov', status: 'pending', created_at: new Date(Date.now() - 5400000).toISOString() },
    { id: '2', type: 'user', title: 'Firibgarlik', reporter: 'Otabek Mahmudov', status: 'investigating', created_at: new Date(Date.now() - 7200000).toISOString() },
  ];

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
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <p className="text-eyebrow">{t('admin.title')}</p>
            <h1 className="display-md mt-2">{t('admin.dashboard')}</h1>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-base h-10 cursor-pointer text-sm"
          >
            <option value="24h">{t('analytics.today')}</option>
            <option value="7d">{t('analytics.last7Days')}</option>
            <option value="30d">{t('analytics.last30Days')}</option>
            <option value="90d">{t('analytics.last90Days')}</option>
          </select>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} delay={i * 0.05} />
          ))}
        </div>

        {/* Content grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Recent users */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="surface-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="display-sm">{t('admin.users')}</h2>
              <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                {t('common.showAll')}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar src="" name={u.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{u.full_name}</p>
                    <p className="text-xs text-fg-subtle">{u.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.status === 'good' ? 'success' : 'warning'} size="sm">
                      {t(`userStatus.${u.status}` as any)}
                    </Badge>
                    <span className="text-xs text-fg-subtle">{formatRelativeTime(u.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pending moderation */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="surface-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="display-sm">{t('admin.listingModeration')}</h2>
              <Link href="/admin/listings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                {t('common.showAll')}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {pendingListings.map((l) => (
                <div key={l.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{l.title}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">{l.seller}</p>
                      <p className="mt-1 font-display text-sm font-bold text-brand-primary">
                        {formatPrice(l.price)}
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      <Clock className="h-3 w-3" strokeWidth={2} />
                      {t('admin.pending')}
                    </Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn btn-sm flex-1 bg-success/12 text-success hover:bg-success/20">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      {t('admin.approve')}
                    </button>
                    <button className="btn btn-sm flex-1 bg-danger/12 text-danger hover:bg-danger/20">
                      <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                      {t('admin.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Complaints */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="surface-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="display-sm">{t('admin.complaints')}</h2>
              <Link href="/admin/complaints" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                {t('common.showAll')}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentComplaints.map((c) => (
                <div key={c.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-danger/12 text-danger">
                    <Flag className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{c.title}</p>
                      <Badge
                        variant={c.status === 'pending' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {t(`admin.${c.status}` as any)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-fg-muted">{c.reporter}</p>
                    <p className="mt-1 text-xs text-fg-subtle">{formatRelativeTime(c.created_at)}</p>
                  </div>
                  <Link href={`/admin/complaints`} className="btn btn-secondary btn-sm flex-shrink-0">
                    {t('admin.viewDetails')}
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
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
                    <ArrowRight className="h-4 w-4 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
