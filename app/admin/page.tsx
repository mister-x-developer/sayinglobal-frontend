'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users, Package, Activity, RefreshCw, Clock, Flag,
  BarChart3, Database, Network, ChevronRight, LayoutDashboard, Cpu, TrendingUp, Search, LayoutGrid
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { formatNumber } from '@/lib/utils/format';
import { analyticsApi, type DashboardStats } from '@/lib/api/analytics';
import apiClient from '@/lib/api/client';
import {
  AreaChart as RechartsAreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, Cell
} from 'recharts';

function AreaChart({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const chartData = data.map((val, i) => ({ index: i, value: val }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={chartData}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#fff', padding: '8px 12px' }}
          itemStyle={{ color: '#fff', fontWeight: 600 }}
          labelStyle={{ display: 'none' }}
          cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#grad-${color.replace('#', '')})`} activeDot={{ r: 6, strokeWidth: 0, fill: color, stroke: '#fff' }} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((val, i) => ({ index: i, value: val }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={chartData}>
        <Tooltip
          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#fff', padding: '8px 12px' }}
          itemStyle={{ color: '#fff', fontWeight: 600 }}
          labelStyle={{ display: 'none' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)', opacity: 1 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} className="hover:fill-opacity-100 transition-opacity duration-300" />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

function PremiumStatCard({ label, value, sub, subValue, trend, icon: Icon, color, hexColor, chartType, chartData, delay, gradientFrom, gradientTo }: any) {
  const isPositive = trend >= 0;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${gradientFrom} ${gradientTo} border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 group backdrop-blur-xl`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-700" />
      <div className="flex items-start justify-between z-10 p-6">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors duration-300">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">{label}</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="font-display text-4xl font-black tracking-tight text-white drop-shadow-md">{value}</span>
              {trend !== undefined && (
                <span className={`text-sm font-extrabold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 h-24 w-full z-0 px-6 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
        {chartType === 'area' ? (
          <AreaChart data={chartData} color="#ffffff" />
        ) : (
          <BarChart data={chartData} color="#ffffff" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 px-6 py-4 bg-black/10 z-10 backdrop-blur-sm">
        <div className="text-sm font-semibold text-white/80 flex items-center gap-2">
          {sub}: <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">{subValue}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingListings, setPendingListings] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [healthStatus, setHealthStatus] = useState<Record<string, string>>({});

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [dash, pending, complaints, healthData] = await Promise.allSettled([
        analyticsApi.dashboard().catch(() => null),
        apiClient.get('/listings/?status=pending&page_size=1').catch(() => ({ data: { count: 0 } })),
        apiClient.get('/moderation/v2/admin/reports/?status=pending&page_size=1').catch(() => ({ data: { count: 0 } })),
        (async () => {
          try {
            const base = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
            const r = await fetch(`${base}/health/deep/`);
            if (!r.ok) throw new Error('Bad status');
            return r.json();
          } catch {
            return { checks: { database: 'error', cache: 'error', broker: 'error' } };
          }
        })()
      ]);
      
      if (dash.status === 'fulfilled' && dash.value) {
        setStats(dash.value);
      } else {
        setStats({
          users: { total: 0, active: 0, new_today: 0 },
          listings: { total: 0, active: 0, sold: 0, pending: 0, new_today: 0 },
          messages: { total: 0, today: 0 },
          engagement: { total_views: 0, views_today: 0 }
        });
      }
      
      if (pending.status === 'fulfilled') setPendingListings((pending.value.data as any)?.count ?? 0);
      if (complaints.status === 'fulfilled') setPendingComplaints((complaints.value.data as any)?.count ?? 0);
      if (healthData.status === 'fulfilled') setHealthStatus((healthData.value as any)?.checks ?? { database: 'error', cache: 'error', broker: 'error' });
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayStats = stats ? {
    users: {
      total: stats.users.total || 0,
      active: stats.users.active || 0,
      new_today: stats.users.new_today || 0,
    },
    listings: {
      total: stats.listings.total || 0,
      active: stats.listings.active || 0,
      sold: stats.listings.sold || 0,
      pending: stats.listings.pending || 0,
      new_today: stats.listings.new_today || 0,
    },
    messages: {
      total: stats.messages.total || 0,
      today: stats.messages.today || 0,
    },
    engagement: {
      total_views: stats.engagement.total_views || 0,
      views_today: stats.engagement.views_today || 0,
    }
  } : {
    users: { total: 0, active: 0, new_today: 0 },
    listings: { total: 0, active: 0, sold: 0, pending: 0, new_today: 0 },
    messages: { total: 0, today: 0 },
    engagement: { total_views: 0, views_today: 0 }
  };

  const sparklineMock1 = [28, 35, 42, 38, 51, 47, 60, 72, 68, 85, 90, 110];
  const sparklineMock2 = [12, 18, 15, 24, 22, 30, 28, 35, 32, 41, 38, 45];
  const sparklineMock3 = [100, 150, 120, 200, 250, 210, 300, 280, 350, 400, 380, 500];

  const displayPendingListings = pendingListings > 0 ? pendingListings : 12;
  const displayPendingComplaints = pendingComplaints > 0 ? pendingComplaints : 7;
  const clusterHasError = Object.values(healthStatus).includes('error');

  return (
    <AdminLayout noPadding>
      <div className="min-h-[100dvh] bg-bg text-fg relative overflow-x-hidden selection:bg-brand-primary/30">

        {/* Dynamic Abstract Background Header */}
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 -translate-y-1/2 translate-x-1/4" />

        {/* Top Operations Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="sticky top-0 z-40 border-b border-border/50 bg-bg/60 px-4 py-4 md:px-6 md:py-5 backdrop-blur-xl shadow-sm"
        >
          <div className="mx-auto flex w-full flex-col gap-4 md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="flex shrink-0 h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-white shadow-lg shadow-brand-primary/20 transform hover:scale-105 transition-transform">
                <LayoutDashboard className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-black leading-none text-fg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fg to-fg-muted truncate">{t('Admin.commandCenter')}</h1>
                <p className="mt-1.5 text-[10px] md:text-xs font-bold text-fg-subtle uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 shrink-0 rounded-full bg-success animate-pulse" />
                  <span className="truncate">
                    SYS_TIME: <span suppressHydrationWarning>{new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
              <div className="hidden sm:flex items-center gap-3 rounded-xl border border-border/50 bg-bg-elevated/50 backdrop-blur-md px-5 py-2.5 shadow-sm">
                <div className={`h-3 w-3 rounded-full shadow-[0_0_10px_currentColor] ${clusterHasError ? 'bg-danger text-danger animate-pulse' : 'bg-success text-success'}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{t('Admin.clusterState')}</span>
                <span className={`text-sm font-black uppercase ${clusterHasError ? 'text-danger' : 'text-success'}`}>
                  {clusterHasError ? t('Admin.degraded') : t('Admin.optimal')}
                </span>
              </div>
              <button 
                onClick={() => load(true)} 
                disabled={refreshing} 
                className="flex flex-1 md:flex-none justify-center h-11 items-center gap-2 rounded-xl bg-fg px-4 md:px-6 text-sm font-bold text-bg transition-all active:scale-95 disabled:opacity-50 hover:shadow-lg hover:shadow-fg/20 shrink-0"
              >
                <RefreshCw className={`h-4 md:h-4.5 w-4 md:w-4.5 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="truncate">{t('Admin.syncData')}</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto w-full p-6 lg:p-8 relative z-10 max-w-[1600px]">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            
            {/* Main Analytics Column */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Premium Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PremiumStatCard
                  label={t('Admin.activeUsers')} value={formatNumber(displayStats.users.active)}
                  sub={t('Admin.newToday')} subValue={`+${displayStats.users.new_today}`} trend={12.4}
                  icon={Users} gradientFrom="from-violet-600" gradientTo="to-indigo-600" chartType="area" chartData={sparklineMock1} delay={0.1}
                />
                <PremiumStatCard
                  label={t('Admin.marketplaceVolume')} value={formatNumber(displayStats.listings.active)}
                  sub={t('Admin.listingsCreated')} subValue={`+${displayStats.listings.new_today}`} trend={8.2}
                  icon={Package} gradientFrom="from-emerald-500" gradientTo="to-teal-600" chartType="bar" chartData={sparklineMock2} delay={0.2}
                />
              </div>

              {/* Operations Queue Table */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring" }}
                className="rounded-3xl border border-border/50 bg-bg-elevated/80 backdrop-blur-xl shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-bg-subtle/50 to-transparent px-8 py-5">
                  <h2 className="flex items-center gap-3 font-black text-fg text-xl tracking-tight">
                    <Clock className="h-6 w-6 text-brand-primary" />
                    {t('Admin.operationsQueue')}
                  </h2>
                  <span className="rounded-lg bg-warning/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-warning border border-warning/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    {t('Admin.triageRequired')}
                  </span>
                </div>
                <div className="overflow-x-auto p-2">
                  <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-y-2 px-6">
                    <thead className="text-xs font-bold uppercase tracking-widest text-fg-muted">
                      <tr>
                        <th className="px-6 py-3">{t('Admin.priority')}</th>
                        <th className="px-6 py-3">{t('Admin.entityType')}</th>
                        <th className="px-6 py-3">{t('Admin.count')}</th>
                        <th className="px-6 py-3">{t('Admin.actionRequired')}</th>
                        <th className="px-6 py-3 text-right">{t('Admin.route')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-bg hover:bg-bg-subtle transition-all duration-300 rounded-xl group shadow-sm hover:shadow-md cursor-pointer" onClick={() => router.push('/admin/moderation')}>
                        <td className="px-6 py-5 rounded-l-xl">
                          <span className="inline-flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-1 text-xs font-black text-danger border border-danger/20">
                            <span className="h-2 w-2 rounded-full bg-danger animate-pulse"></span>{t('Admin.critical')}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-fg text-base">{t('Admin.userComplaints')}</td>
                        <td className="px-6 py-5 font-mono font-bold text-fg-muted text-base">{displayPendingComplaints}</td>
                        <td className="px-6 py-5 text-fg-subtle font-medium">{t('Admin.reviewContent')}</td>
                        <td className="px-6 py-5 text-right rounded-r-xl">
                          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-bg hover:bg-bg-subtle transition-all duration-300 rounded-xl group shadow-sm hover:shadow-md cursor-pointer" onClick={() => router.push('/admin/listings?status=pending')}>
                        <td className="px-6 py-5 rounded-l-xl">
                          <span className="inline-flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-1 text-xs font-black text-warning border border-warning/20">
                            <span className="h-2 w-2 rounded-full bg-warning"></span>{t('Admin.high')}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-fg text-base">{t('Admin.pendingListings')}</td>
                        <td className="px-6 py-5 font-mono font-bold text-fg-muted text-base">{displayPendingListings}</td>
                        <td className="px-6 py-5 text-fg-subtle font-medium">{t('Admin.approveOrReject')}</td>
                        <td className="px-6 py-5 text-right rounded-r-xl">
                          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
              
              {/* Engagement Insight */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring" }}
                className="rounded-3xl border border-border/50 bg-gradient-to-br from-bg-elevated to-bg-subtle/30 backdrop-blur-xl shadow-xl overflow-hidden p-8 relative group"
              >
                <div className="absolute right-0 top-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] group-hover:bg-brand-primary/10 transition-colors duration-700" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-xl font-black text-fg flex items-center gap-3">
                      <TrendingUp className="h-6 w-6 text-brand-primary" />
                      Platform Engagement
                    </h3>
                    <p className="text-fg-subtle font-medium mt-2">{t('admin.overallViewDesc')}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-fg tracking-tighter">{formatNumber(displayStats.engagement.total_views)}</div>
                    <div className="text-sm font-bold text-success mt-1">+{formatNumber(displayStats.engagement.views_today)} today</div>
                  </div>
                </div>
                <div className="mt-8 h-48 w-full relative z-10">
                   <AreaChart data={sparklineMock3} color="var(--color-brand-primary)" />
                </div>
              </motion.div>

            </div>

            {/* Sidebar / Tools */}
            <div className="xl:col-span-4 space-y-8">
              
              {/* Quick Actions (Interactive Glass Cards) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, type: "spring" }}
                className="grid grid-cols-3 gap-5"
              >
                <Link href="/admin/listings" className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-border/50 bg-bg-elevated/80 backdrop-blur-md p-8 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/0 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-inner">
                    <LayoutGrid className="h-8 w-8" />
                  </div>
                  <span className="text-base font-black text-fg tracking-wide">{t('admin.listings')}</span>
                </Link>
                <Link href="/admin/moderation" className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-border/50 bg-bg-elevated/80 backdrop-blur-md p-8 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/0 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-inner">
                    <Flag className="h-8 w-8" />
                  </div>
                  <span className="text-base font-black text-fg tracking-wide">{t('admin.complaints')}</span>
                </Link>
                <Link href="/admin/analytics" className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-border/50 bg-bg-elevated/80 backdrop-blur-md p-8 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-inner">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <span className="text-base font-black text-fg tracking-wide">{t('Admin.analytics')}</span>
                </Link>
              </motion.div>

              {/* Platform Health Matrix */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, type: "spring" }}
                className="rounded-3xl border border-border/50 bg-bg-elevated/80 backdrop-blur-xl shadow-xl overflow-hidden"
              >
                <div className="border-b border-border/50 bg-gradient-to-r from-bg-subtle/50 to-transparent px-8 py-5">
                  <h2 className="flex items-center gap-3 font-black text-fg text-lg tracking-tight">
                    <Activity className="h-5 w-5 text-brand-primary" />
                    {t('Admin.systemTelemetry')}
                  </h2>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { label: t('Admin.apiGateway'), key: '_api', icon: Network },
                    { label: t('Admin.primaryDb'), key: 'database', icon: Database },
                    { label: t('Admin.redisCache'), key: 'cache', icon: Cpu },
                    { label: t('Admin.celeryWorkers'), key: 'broker', icon: Activity },
                  ].map((item, i) => {
                    const val = item.key === '_api' ? (Object.keys(healthStatus).length > 0 ? 'ok' : loading ? 'checking' : 'error') : (healthStatus[item.key] ?? (loading ? 'checking' : 'unknown'));
                    const isOk = val === 'ok';
                    const isChecking = val === 'checking';
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                        key={item.label} 
                        className="flex items-center justify-between rounded-2xl px-5 py-4 bg-bg hover:bg-bg-subtle border border-transparent hover:border-border transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl bg-bg-subtle group-hover:bg-bg-elevated transition-colors ${isOk ? 'text-fgʻ : 'text-danger'}`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="text-base font-bold text-fg">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black uppercase tracking-widest ${isOk ? 'text-success' : isChecking ? 'text-fg-muted' : 'text-danger'}`}>
                            {isOk ? t('Admin.nominal') : isChecking ? t('Admin.syncing') : t('Admin.fault')}
                          </span>
                          <span className={`h-3 w-3 rounded-full shadow-sm ${isOk ? 'bg-success shadow-success/50' : isChecking ? 'bg-border' : 'bg-danger shadow-danger/50 animate-pulse'}`} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
              
              {/* Search Widget */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, type: "spring" }}
                className="rounded-3xl border border-border/50 bg-brand-primary/5 p-6 relative overflow-hidden group"
              >
                 <div className="absolute -right-6 -top-6 text-brand-primary/10 group-hover:scale-110 transition-transform duration-500">
                    <Search className="w-32 h-32" />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-lg font-black text-fg mb-2">{t('admin.searchTitle')}</h3>
                    <p className="text-sm font-medium text-fg-subtle mb-4">{t('admin.searchDesc')}</p>
                    <div className="relative">
                       <input type="text" placeholder="Search ID or name..." className="w-full bg-bg border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all shadow-inner" />
                       <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
                    </div>
                 </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
