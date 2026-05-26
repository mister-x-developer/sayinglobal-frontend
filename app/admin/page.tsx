'use client';

/**
 * Admin Dashboard — Premium operational control center.
 * Real-time stats, quick actions, moderation queue, activity feed.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Package, Flag, TrendingUp, ArrowRight, Megaphone, BarChart3,
  MessageCircle, Eye, Loader2, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Bot, Shield, Activity, Zap, ChevronRight, Bell,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { formatNumber, formatRelativeTime } from '@/lib/utils/format';
import { analyticsApi, type DashboardStats, type GrowthAnalytics } from '@/lib/api/analytics';
import apiClient from '@/lib/api/client';

// ── Simple SVG line chart (reused from analytics page) ────────────────────────
function LineChart({ data, color = '#1f7a52' }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 400;
  const H = 100;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (d.value / max) * (H - 10) - 5;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `0,${H} ${polyline} ${W},${H}`;
  return (
    <div className="relative h-28 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`dash-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#dash-grad-${color.replace('#', '')})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        <span className="text-[9px] text-fg-subtle">{data[0]?.label}</span>
        <span className="text-[9px] text-fg-subtle">{data[Math.floor(data.length / 2)]?.label}</span>
        <span className="text-[9px] text-fg-subtle">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, bg, href, delay = 0 }: {
  label: string; value: number | string; sub: string;
  icon: typeof Users; color: string; bg: string;
  href?: string; delay?: number;
}) {
  const inner = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`surface-elevated p-5 transition-all duration-200 ${href ? 'hover:-translate-y-0.5 hover:shadow-lift cursor-pointer' : ''}`}>
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
    </motion.div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, badge, color }: {
  href: string; icon: typeof Users; label: string; badge?: number; color: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-bg-subtle transition-colors">
      <div className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <span className="flex-1 text-sm font-medium text-fg">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingListings, setPendingListings] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [growth, setGrowth] = useState<GrowthAnalytics | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [dash, pending, complaints, growthData] = await Promise.allSettled([
        analyticsApi.dashboard(),
        apiClient.get('/listings/?status=pending&page_size=1'),
        apiClient.get('/moderation/complaints/?status=pending&page_size=1'),
        analyticsApi.growth(30),
      ]);
      if (dash.status === 'fulfilled') setStats(dash.value);
      if (pending.status === 'fulfilled') setPendingListings((pending.value.data as any)?.count ?? 0);
      if (complaints.status === 'fulfilled') setPendingComplaints((complaints.value.data as any)?.count ?? 0);
      if (growthData.status === 'fulfilled') setGrowth(growthData.value);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = stats ? [
    { label: "Jami foydalanuvchilar", value: stats.users.total, sub: `+${stats.users.new_today} bugun`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/admin/users', delay: 0 },
    { label: "Faol e'lonlar", value: stats.listings.active, sub: `${formatNumber(stats.listings.total)} jami`, icon: Package, color: 'text-brand-primary', bg: 'bg-brand-primary/10', href: '/admin/listings', delay: 0.05 },
    { label: "Ko'rishlar", value: stats.engagement.total_views, sub: `+${stats.engagement.views_today} bugun`, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10', delay: 0.1 },
    { label: "Xabarlar", value: stats.messages.total, sub: `+${stats.messages.today} bugun`, icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/10', delay: 0.15 },
  ] : [];

  return (
    <AdminLayout>
      <div className="container-page py-6 sm:py-8 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-eyebrow">Admin</p>
            <h1 className="display-lg mt-1">Boshqaruv paneli</h1>
            <p className="mt-1 text-sm text-fg-muted">
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="btn btn-secondary btn-sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            Yangilash
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary" strokeWidth={2} />
            <p className="text-sm text-fg-muted">Yuklanmoqda...</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {statCards.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Alert banners */}
            {(pendingListings > 0 || pendingComplaints > 0) && (
              <div className="flex flex-wrap gap-3 mb-8">
                {pendingListings > 0 && (
                  <Link href="/admin/listings?status=pending"
                    className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3 text-sm font-semibold text-warning hover:bg-warning/12 transition-colors">
                    <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                    {pendingListings} ta e'lon tasdiqlash kutmoqda
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                )}
                {pendingComplaints > 0 && (
                  <Link href="/admin/moderation"
                    className="flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm font-semibold text-danger hover:bg-danger/12 transition-colors">
                    <Flag className="h-4 w-4" strokeWidth={2} />
                    {pendingComplaints} ta shikoyat ko'rib chiqilmagan
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Quick actions */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }} className="surface-elevated overflow-hidden">
                <div className="border-b border-border px-5 py-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand-accent" strokeWidth={2} />
                  <h2 className="font-bold text-fg">Tezkor harakatlar</h2>
                </div>
                <div className="p-2 space-y-0.5">
                  <QuickAction href="/admin/users" icon={Users} label="Foydalanuvchilar" color="bg-blue-500/10 text-blue-500" />
                  <QuickAction href="/admin/listings" icon={Package} label="E'lonlar" badge={pendingListings} color="bg-brand-primary/10 text-brand-primary" />
                  <QuickAction href="/admin/moderation" icon={Flag} label="Shikoyatlar" badge={pendingComplaints} color="bg-danger/10 text-danger" />
                  <QuickAction href="/admin/broadcasts" icon={Megaphone} label="Broadcast yuborish" color="bg-purple-500/10 text-purple-500" />
                  <QuickAction href="/admin/analytics" icon={BarChart3} label="Analitika" color="bg-green-500/10 text-green-500" />
                  <QuickAction href="/admin/ai-moderation" icon={Bot} label="AI Moderatsiya" color="bg-brand-accent/10 text-brand-accent" />
                  <QuickAction href="/admin/plans" icon={Shield} label="Tariflar" color="bg-amber-500/10 text-amber-500" />
                </div>
              </motion.div>

              {/* Today's activity */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }} className="surface-elevated overflow-hidden">
                <div className="border-b border-border px-5 py-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-success" strokeWidth={2} />
                  <h2 className="font-bold text-fg">Bugungi faollik</h2>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {stats && [
                    { label: "Yangi foydalanuvchilar", value: stats.users.new_today, color: 'text-blue-500' },
                    { label: "Yangi e'lonlar", value: stats.listings.new_today, color: 'text-brand-primary' },
                    { label: "Sotilgan e'lonlar", value: stats.listings.sold, color: 'text-success' },
                    { label: "Faol foydalanuvchilar", value: stats.users.active, color: 'text-purple-500' },
                    { label: "Ko'rishlar", value: stats.engagement.views_today, color: 'text-amber-500' },
                    { label: "Xabarlar", value: stats.messages.today, color: 'text-green-500' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-bg-subtle p-3">
                      <p className="text-[11px] text-fg-subtle leading-tight">{item.label}</p>
                      <p className={`mt-1 font-display text-2xl font-black ${item.color}`}>
                        {formatNumber(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* System status */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }} className="surface-elevated overflow-hidden">
                <div className="border-b border-border px-5 py-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-primary" strokeWidth={2} />
                  <h2 className="font-bold text-fg">Tizim holati</h2>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'Backend API', status: 'online', href: '/admin/health' },
                    { label: 'Ma\'lumotlar bazasi', status: 'online', href: '/admin/health' },
                    { label: 'Redis / Cache', status: 'online', href: '/admin/health' },
                    { label: 'AI Moderatsiya', status: 'online', href: '/admin/ai-moderation' },
                  ].map((item) => (
                    <Link key={item.label} href={item.href}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 hover:bg-bg-subtle transition-colors">
                      <span className="text-sm font-medium text-fg">{item.label}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        Ishlayapti
                      </span>
                    </Link>
                  ))}
                  <Link href="/admin/health"
                    className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-bg-subtle hover:text-fg transition-colors mt-2">
                    <Activity className="h-4 w-4" strokeWidth={1.75} />
                    Batafsil ko'rish
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Bottom row: pending items */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Pending listings */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }} className="surface-elevated overflow-hidden">
                <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" strokeWidth={2} />
                    <h2 className="font-bold text-fg">Kutilayotgan e'lonlar</h2>
                    {pendingListings > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning/15 px-1.5 text-[10px] font-bold text-warning">
                        {pendingListings}
                      </span>
                    )}
                  </div>
                  <Link href="/admin/listings?status=pending" className="text-xs font-semibold text-brand-primary hover:underline">
                    Barchasini ko'rish →
                  </Link>
                </div>
                <PendingListings />
              </motion.div>

              {/* Recent complaints */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }} className="surface-elevated overflow-hidden">
                <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-danger" strokeWidth={2} />
                    <h2 className="font-bold text-fg">So'nggi shikoyatlar</h2>
                    {pendingComplaints > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger/15 px-1.5 text-[10px] font-bold text-danger">
                        {pendingComplaints}
                      </span>
                    )}
                  </div>
                  <Link href="/admin/moderation" className="text-xs font-semibold text-brand-primary hover:underline">
                    Barchasini ko'rish →
                  </Link>
                </div>
                <RecentComplaints />
              </motion.div>
            </div>

            {/* 30-day trends */}
            {growth && (growth.users_by_day.length > 1 || growth.listings_by_day.length > 1) && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {growth.users_by_day.length > 1 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }} className="surface-elevated overflow-hidden">
                    <div className="border-b border-border px-5 py-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" strokeWidth={2} />
                      <h2 className="font-bold text-fg">Foydalanuvchilar (30 kun)</h2>
                    </div>
                    <div className="p-4">
                      <LineChart
                        data={growth.users_by_day.slice(-30).map((r) => ({ label: r.date.slice(5), value: r.count }))}
                        color="#3b82f6"
                      />
                    </div>
                  </motion.div>
                )}
                {growth.listings_by_day.length > 1 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }} className="surface-elevated overflow-hidden">
                    <div className="border-b border-border px-5 py-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-brand-primary" strokeWidth={2} />
                      <h2 className="font-bold text-fg">E'lonlar (30 kun)</h2>
                    </div>
                    <div className="p-4">
                      <LineChart
                        data={growth.listings_by_day.slice(-30).map((r) => ({ label: r.date.slice(5), value: r.count }))}
                        color="#1f7a52"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ── Pending listings mini-list ────────────────────────────────────────────────
function PendingListings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/listings/?status=pending&page_size=5')
      .then((r) => setItems((r.data as any)?.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-brand-primary" /></div>;
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.5} />
      <p className="text-sm text-fg-muted">Kutilayotgan e'lonlar yo'q</p>
    </div>
  );

  return (
    <div className="divide-y divide-border">
      {items.map((item: any) => (
        <Link key={item.public_id} href={`/admin/listings/${item.public_id}`}
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-subtle transition-colors group">
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-bg-subtle overflow-hidden">
            {item.primary_image?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.primary_image.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-fg-subtle">
                <Package className="h-4 w-4" strokeWidth={1.75} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg truncate group-hover:text-brand-primary transition-colors">{item.title}</p>
            <p className="text-xs text-fg-muted">{item.seller?.full_name} · {formatRelativeTime(item.created_at)}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-fg-subtle flex-shrink-0" strokeWidth={2} />
        </Link>
      ))}
    </div>
  );
}

// ── Recent complaints mini-list ───────────────────────────────────────────────
function RecentComplaints() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/moderation/complaints/?status=pending&page_size=5')
      .then((r) => {
        const data = r.data as any;
        setItems(Array.isArray(data) ? data : data?.results ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-brand-primary" /></div>;
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.5} />
      <p className="text-sm text-fg-muted">Shikoyatlar yo'q</p>
    </div>
  );

  const severityColor: Record<string, string> = {
    critical: 'text-danger bg-danger/10',
    high: 'text-warning bg-warning/10',
    medium: 'text-amber-500 bg-amber-500/10',
    low: 'text-fg-muted bg-bg-subtle',
  };

  return (
    <div className="divide-y divide-border">
      {items.map((item: any) => (
        <Link key={item.id} href={`/admin/moderation/${item.id}`}
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-subtle transition-colors group">
          <div className={`flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${severityColor[item.severity] ?? severityColor.low}`}>
            {(item.severity || 'L')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg truncate group-hover:text-brand-primary transition-colors">
              {item.report_type?.replace(/_/g, ' ') || 'Shikoyat'}
            </p>
            <p className="text-xs text-fg-muted">{formatRelativeTime(item.created_at)}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-fg-subtle flex-shrink-0" strokeWidth={2} />
        </Link>
      ))}
    </div>
  );
}
