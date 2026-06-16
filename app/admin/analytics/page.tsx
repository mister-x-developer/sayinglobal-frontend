'use client';

/**
 * Admin Analytics Page — Real-time platform analytics with charts.
 * Uses actual API data from analytics endpoints.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Users, Package, BarChart3, TrendingUp, Activity, RefreshCw,
  Eye, MessageCircle, Flag, CheckCircle2, XCircle, Loader2,
  ArrowUpRight, ArrowDownRight, Star, ShoppingCart, Zap,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { analyticsApi, type DashboardStats, type GrowthAnalytics, type ActivityAnalytics } from '@/lib/api/analytics';
import apiClient from '@/lib/api/client';
import { formatNumber, formatRelativeTime } from '@/lib/utils/format';

// ── Mini SVG Line Chart ──────────────────────────────────────────────────────
function MiniLineChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  if (!data || data.length < 2) return <div className="h-16 flex items-center justify-center text-xs text-fg-subtle">{t('Analytics.notEnoughData')}</div>;
  const W = 300;
  const H = 60;
  const max = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (d.count / max) * (H - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <div className="h-16 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#g-${color.slice(1)})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ── Full SVG Line Chart ──────────────────────────────────────────────────────
function FullLineChart({ 
  data1, data2, label1, label2, color1, color2
}: { 
  data1: { date: string; count: number }[];
  data2?: { date: string; count: number }[];
  label1: string;
  label2?: string;
  color1: string;
  color2?: string;
}) {
  const allVals = [...(data1.map(d => d.count)), ...(data2?.map(d => d.count) ?? [])];
  const max = Math.max(...allVals, 1);
  const W = 600;
  const H = 140;
  const pad = { t: 8, r: 8, b: 28, l: 32 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const toPoints = (data: { date: string; count: number }[]) =>
    data.map((d, i) => {
      const x = pad.l + (i / Math.max(data.length - 1, 1)) * iW;
      const y = pad.t + iH - (d.count / max) * iH;
      return `${x},${y}`;
    }).join(' ');

  const toArea = (data: { date: string; count: number }[]) => {
    const pts = data.map((d, i) => {
      const x = pad.l + (i / Math.max(data.length - 1, 1)) * iW;
      const y = pad.t + iH - (d.count / max) * iH;
      return `${x},${y}`;
    });
    const first = pts[0].split(',');
    const last = pts[pts.length - 1].split(',');
    return `${first[0]},${pad.t + iH} ${pts.join(' ')} ${last[0]},${pad.t + iH}`;
  };

  // Y axis labels
  const yLabels = [0, Math.floor(max / 2), max];
  // X axis labels (show first, mid, last)
  const showDates = data1.length > 0 ? [data1[0], data1[Math.floor(data1.length / 2)], data1[data1.length - 1]] : [];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`fa-${color1.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color1} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color1} stopOpacity="0" />
          </linearGradient>
          {color2 && (
            <linearGradient id={`fa-${color2.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color2} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color2} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>
        {/* Grid lines */}
        {yLabels.map((v, i) => {
          const y = pad.t + iH - (v / max) * iH;
          return <line key={i} x1={pad.l} y1={y} x2={pad.l + iW} y2={y} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />;
        })}
        {/* Area */}
        {data1.length > 1 && <polygon points={toArea(data1)} fill={`url(#fa-${color1.slice(1)})`} />}
        {data2 && data2.length > 1 && color2 && <polygon points={toArea(data2)} fill={`url(#fa-${color2.slice(1)})`} />}
        {/* Lines */}
        {data1.length > 1 && <polyline points={toPoints(data1)} fill="none" stroke={color1} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {data2 && data2.length > 1 && color2 && <polyline points={toPoints(data2)} fill="none" stroke={color2} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5,3" />}
        {/* Y labels */}
        {yLabels.map((v, i) => {
          const y = pad.t + iH - (v / max) * iH;
          return <text key={i} x={pad.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.4">{v > 999 ? (v/1000).toFixed(0) + 'k' : v}</text>;
        })}
        {/* X labels */}
        {showDates.map((d, i) => {
          const idx = data1.indexOf(d);
          const x = pad.l + (idx / Math.max(data1.length - 1, 1)) * iW;
          return <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.4">{d.date.slice(5)}</text>;
        })}
      </svg>
      {/* Legend */}
      <div className="mt-1 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
          <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: color1 }} />
          {label1}
        </span>
        {label2 && color2 && (
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <span className="inline-block h-0.5 w-4 rounded-full border-dashed" style={{ backgroundColor: color2 }} />
            {label2}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ 
  label, value, sub, icon: Icon, color, bg, href, delay, chartData, chartColor
}: {
  label: string; value: number | string; sub: string;
  icon: typeof Users; color: string; bg: string;
  href?: string; delay?: number;
  chartData?: { date: string; count: number }[];
  chartColor?: string;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay ?? 0 }}
      className={`surface-elevated overflow-hidden ${href ? 'hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 cursor-pointer' : ''}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle truncate">{label}</p>
            <p className="mt-2 font-display text-3xl font-black text-fg">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
            <p className="mt-1 text-xs text-fg-muted">{sub}</p>
          </div>
          <div className={`flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.75} />
          </div>
        </div>
      </div>
      {chartData && chartData.length > 1 && chartColor && (
        <div className="px-5 pb-4">
          <MiniLineChart data={chartData} color={chartColor} />
        </div>
      )}
    </motion.div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Funnel Bar ───────────────────────────────────────────────────────────────
function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-fg-muted">{label}</span>
        <span className="font-semibold text-fg">{formatNumber(value)} <span className="font-normal text-fg-subtle">({pct}%)</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-bg-subtle">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growth, setGrowth] = useState<GrowthAnalytics | null>(null);
  const [activity, setActivity] = useState<ActivityAnalytics | null>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [listingStats, setListingStats] = useState<any>(null);
  const [period, setPeriod] = useState(30);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [dashRes, growthRes, activityRes, funnelRes, listingRes] = await Promise.allSettled([
        analyticsApi.dashboard(),
        analyticsApi.growth(period),
        analyticsApi.activity(period),
        apiClient.get('/analytics/funnel/', { params: { days: period } }),
        analyticsApi.listings(),
      ]);

      if (dashRes.status === 'fulfilled') setStats(dashRes.value);
      if (growthRes.status === 'fulfilled') setGrowth(growthRes.value);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value);
      if (funnelRes.status === 'fulfilled') setFunnel((funnelRes.value.data as any));
      if (listingRes.status === 'fulfilled') setListingStats(listingRes.value);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const statCards = stats ? [
    {
      label: t('admin.totalUsers'),
      value: stats.users.total,
      sub: `+${stats.users.new_today} ${t('analytics.today' as any)}`,
      icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10',
      href: '/admin/users', delay: 0,
      chartData: growth?.users_by_day?.slice(-14),
      chartColor: '#3b82f6',
    },
    {
      label: t('admin.activeListings'),
      value: stats.listings.active,
      sub: `${formatNumber(stats.listings.pending ?? 0)} ${t('admin.pending').toLowerCase()}`,
      icon: Package, color: 'text-brand-primary', bg: 'bg-brand-primary/10',
      href: '/admin/listings', delay: 0.05,
      chartData: growth?.listings_by_day?.slice(-14),
      chartColor: '#1f7a52',
    },
    {
      label: t('analytics.totalViews' as any) ?? "Ko'rishlar",
      value: stats.engagement.total_views,
      sub: `+${stats.engagement.views_today} ${t('analytics.today' as any)}`,
      icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10',
      delay: 0.1,
    },
    {
      label: t('nav.chat'),
      value: stats.messages.total,
      sub: `+${stats.messages.today} ${t('analytics.today' as any)}`,
      icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/10',
      delay: 0.15,
    },
  ] : [];

  // Status distribution
  const statusDist = listingStats?.status_distribution ?? [];
  const totalListings = statusDist.reduce((s: number, x: any) => s + x.count, 0) || 1;

  return (
    <AdminLayout>
      <div className="container-page py-6 sm:py-8 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-eyebrow">{t('Admin.admin')}</p>
            <h1 className="display-lg mt-1">{t('admin.analytics')}</h1>
            <p className="mt-1 text-sm text-fg-muted">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="input-base h-9 text-sm cursor-pointer"
            >
              <option value={7}>{t('Analytics.7days')}</option>
              <option value={14}>{t('Analytics.14days')}</option>
              <option value={30}>{t('Analytics.30days')}</option>
              <option value={90}>{t('Analytics.90days')}</option>
            </select>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              {t('common.refresh')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary" strokeWidth={2} />
            <p className="text-sm text-fg-muted">{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {statCards.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Growth Charts */}
            {growth && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="surface-elevated p-5 mb-6"
              >
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-4 w-4 text-brand-primary" strokeWidth={2} />
                  <h2 className="font-bold text-fg">O&apos;sish dinamikasi — {period} kun</h2>
                </div>
                {((growth.users_by_day?.length ?? 0) > 1 || (growth.listings_by_day?.length ?? 0) > 1) ? (
                  <FullLineChart
                    data1={growth.users_by_day ?? []}
                    data2={growth.listings_by_day ?? []}
                    label1="Foydalanuvchilar"
                    label2="Eʼlonlar"
                    color1="#3b82f6"
                    color2="#1f7a52"
                  />
                ) : (
                  <p className="py-8 text-center text-sm text-fg-muted">
                    Grafik uchun yetarli ma&apos;lumot yo&apos;q (Kun bo&apos;yicha statistika yig&apos;ilishi kerak)
                  </p>
                )}
              </motion.div>
            )}

            <div className="grid gap-6 lg:grid-cols-3 mb-6">
              {/* Listing Status Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="surface-elevated p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-brand-primary" strokeWidth={2} />
                  <h2 className="font-bold text-fg">{t('Analytics.listingStatuses')}</h2>
                </div>
                <div className="space-y-3">
                  {statusDist.length > 0 ? statusDist.map((s: any) => (
                    <div key={s.status} className="flex items-center justify-between rounded-xl bg-bg-subtle px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          s.status === 'active' ? 'bg-success' :
                          s.status === 'pending' ? 'bg-warning' :
                          s.status === 'sold' ? 'bg-blue-500' :
                          s.status === 'rejected' ? 'bg-danger' : 'bg-fg-subtle'
                        }`} />
                        <span className="text-sm font-medium text-fg capitalize">{
                          s.status === 'active' ? 'Faol' :
                          s.status === 'pending' ? 'Kutilmoqda' :
                          s.status === 'sold' ? 'Sotilgan' :
                          s.status === 'rejected' ? 'Rad etilgan' :
                          s.status === 'draft' ? 'Qoralama' : s.status
                        }</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-fg">{formatNumber(s.count)}</span>
                        <span className="text-xs text-fg-subtle">
                          {Math.round((s.count / totalListings) * 100)}%
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-fg-muted py-4 text-center">{t('Analytics.noData')}</p>
                  )}
                </div>
              </motion.div>

              {/* Auth Funnel */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="surface-elevated p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-warning" strokeWidth={2} />
                  <h2 className="font-bold text-fg">Auth Funnel — {period} kun</h2>
                </div>
                {funnel ? (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">{t('Analytics.login')}</p>
                      <div className="space-y-2">
                        <FunnelBar
                          label="Muvaffaqiyatli"
                          value={funnel.auth_funnel?.login_success ?? 0}
                          max={(funnel.auth_funnel?.login_success ?? 0) + (funnel.auth_funnel?.login_failure ?? 0)}
                          color="#1f7a52"
                        />
                        <FunnelBar
                          label="Muvaffaqiyatsiz"
                          value={funnel.auth_funnel?.login_failure ?? 0}
                          max={(funnel.auth_funnel?.login_success ?? 0) + (funnel.auth_funnel?.login_failure ?? 0)}
                          color="#b04040"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">{t('Analytics.createListing')}</p>
                      <div className="space-y-2">
                        <FunnelBar
                          label="Boshlandi"
                          value={funnel.listing_funnel?.started ?? 0}
                          max={funnel.listing_funnel?.started ?? 1}
                          color="#3b82f6"
                        />
                        <FunnelBar
                          label="Yakunlandi"
                          value={funnel.listing_funnel?.completed ?? 0}
                          max={funnel.listing_funnel?.started ?? 1}
                          color="#1f7a52"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-subtle p-3">
                      <p className="text-xs text-fg-subtle">{t('Analytics.moderation')}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="text-center">
                          <p className="font-display text-lg font-black text-success">{funnel.moderation?.approved ?? 0}</p>
                          <p className="text-[10px] text-fg-subtle">{t('Analytics.approved')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-display text-lg font-black text-danger">{funnel.moderation?.rejected ?? 0}</p>
                          <p className="text-[10px] text-fg-subtle">{t('Analytics.rejected')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-fg-muted">{t('Analytics.noData')}</p>
                  </div>
                )}
              </motion.div>

              {/* Activity Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="surface-elevated p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-success" strokeWidth={2} />
                  <h2 className="font-bold text-fg">Faollik turlari — {period} kun</h2>
                </div>
                {activity?.event_distribution && activity.event_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {activity.event_distribution.slice(0, 8).map((ev: any) => (
                      <div key={ev.event_type} className="flex items-center justify-between rounded-xl bg-bg-subtle px-3 py-2">
                        <span className="text-xs text-fg-muted truncate max-w-[140px]">
                          {ev.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-fg ml-2">{formatNumber(ev.count)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-fg-muted">{t('Analytics.noData')}</p>
                )}
              </motion.div>
            </div>

            {/* Quick Actions Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6"
            >
              {[
                { href: '/admin/users', icon: Users, label: t('admin.users'), color: 'text-blue-500 bg-blue-500/10' },
                { href: '/admin/listings', icon: Package, label: t('admin.listings'), color: 'text-brand-primary bg-brand-primary/10' },
                { href: '/admin/moderation', icon: Flag, label: t('admin.complaints'), color: 'text-danger bg-danger/10' },
                { href: '/admin/ai-moderation', icon: BarChart3, label: 'AI Moderatsiya', color: 'text-purple-500 bg-purple-500/10' },
                { href: '/admin/ratings', icon: Star, label: 'Sharhlar', color: 'text-warning bg-warning/10' },
                { href: '/admin/health', icon: Activity, label: t('admin.systemHealth'), color: 'text-success bg-success/10' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="surface-elevated flex flex-col items-center gap-2 p-4 text-center hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                    <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-semibold text-fg">{item.label}</span>
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
