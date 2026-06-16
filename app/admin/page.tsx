'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Users, Package, Flag, Activity, RefreshCw, Clock, Bot,
  Shield, BarChart3, Terminal, Cpu, Database, Network, ChevronRight, Zap
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { formatNumber } from '@/lib/utils/format';
import { analyticsApi, type DashboardStats } from '@/lib/api/analytics';
import apiClient from '@/lib/api/client';

// ── SVG Charts with Dynamic Glow ─────────────────────────────────────────────

function AreaChart({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 300;
  const H = 80;
  
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d - min) / range) * H;
    return `${x},${y}`;
  });
  
  const polyline = pts.join(' ');
  const polygon = `${pts[0].split(',')[0]},${H} ${polyline} ${pts[pts.length-1].split(',')[0]},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${color.replace('#', '')}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <polygon points={polygon} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter={`url(#glow-${color.replace('#', '')})`} />
    </svg>
  );
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const W = 300;
  const H = 80;
  const barWidth = (W / data.length) * 0.6;
  const gap = (W / data.length) * 0.4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <filter id={`glow-bar-${color.replace('#', '')}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {data.map((d, i) => {
        const barH = (d / max) * H;
        const x = i * (barWidth + gap) + gap/2;
        const y = H - barH;
        return (
          <rect key={i} x={x} y={y} width={barWidth} height={barH} fill={color} rx="3" className="transition-all duration-700 ease-out hover:opacity-100 opacity-80" filter={`url(#glow-bar-${color.replace('#', '')})`} />
        );
      })}
    </svg>
  );
}

// ── Enterprise Stat Card ──────────────────────────────────────────────────────

function EnterpriseStatCard({ label, value, sub, subValue, trend, icon: Icon, color, hexColor, bg, chartType, chartData, delay }: any) {
  const isPositive = trend >= 0;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-white/20 group"
    >
      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition-opacity group-hover:opacity-60 opacity-20 ${bg}`} />

      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 shadow-inner ${bg}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white/50">{label}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl font-black tracking-tight text-white">{value}</span>
              {trend !== undefined && (
                <span className={`text-xs font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 h-16 w-full z-0 opacity-90">
        {chartType === 'area' ? (
          <AreaChart data={chartData} color={hexColor} />
        ) : (
          <BarChart data={chartData} color={hexColor} />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 z-10">
        <div className="text-xs font-bold text-white/40">
          {sub}: <span className="text-white/90">{subValue}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations();
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
        analyticsApi.dashboard(),
        apiClient.get('/listings/?status=pending&page_size=1'),
        apiClient.get('/moderation/v2/admin/reports/?status=pending&page_size=1'),
        (async () => {
          const base = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
          const r = await fetch(`${base}/health/deep/`);
          return r.json();
        })()
      ]);
      if (dash.status === 'fulfilled') setStats(dash.value);
      if (pending.status === 'fulfilled') setPendingListings((pending.value.data as any)?.count ?? 0);
      if (complaints.status === 'fulfilled') setPendingComplaints((complaints.value.data as any)?.count ?? 0);
      if (healthData.status === 'fulfilled') setHealthStatus((healthData.value as any)?.checks ?? {});
      else setHealthStatus({ database: 'error', cache: 'error', broker: 'error' });
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sparklineMock1 = [12, 14, 13, 16, 20, 24, 25, 28, 30, 35];
  const sparklineMock2 = [5, 8, 12, 10, 15, 14, 18, 22, 20, 25];

  return (
    <AdminLayout noPadding>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-primary/30 relative overflow-hidden">
        {/* Cyberpunk Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Top Operations Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 border-b border-white/10 bg-black/50 px-6 py-4 backdrop-blur-2xl"
        >
          <div className="mx-auto flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Terminal className="h-6 w-6 text-indigo-400" />
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black border border-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black leading-none text-white tracking-tight">{t('Admin.commandCenter')}</h1>
                <p className="mt-1.5 text-[10px] font-mono text-indigo-400/70 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  SYS_TIME: {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-mono shadow-inner backdrop-blur-md">
                <div className={`h-2.5 w-2.5 rounded-full ${Object.values(healthStatus).includes('error') ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'}`} />
                <span className="text-white/50 tracking-wider">{t('Admin.clusterState')}</span>
                <span className={Object.values(healthStatus).includes('error') ? 'text-rose-400 font-black tracking-widest' : 'text-emerald-400 font-black tracking-widest'}>
                  {Object.values(healthStatus).includes('error') ? 'DEGRADED' : 'OPTIMAL'}
                </span>
              </div>
              <button onClick={() => load(true)} disabled={refreshing} className="group relative flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-black transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                SYNC DATA
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto w-full p-6 lg:p-10 relative z-10">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            
            {/* Main Analytics Column */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <EnterpriseStatCard
                  label="Active Users" value={formatNumber(stats?.users.active ?? 0)}
                  sub="New Today" subValue={`+${stats?.users.new_today ?? 0}`} trend={12.4}
                  icon={Users} color="text-indigo-400" hexColor="#818cf8" bg="bg-indigo-500/20"
                  chartType="area" chartData={sparklineMock1} delay={0.1}
                />
                <EnterpriseStatCard
                  label="Marketplace Volume" value={formatNumber(stats?.listings.active ?? 0)}
                  sub="Listings Created" subValue={`+${stats?.listings.new_today ?? 0}`} trend={8.2}
                  icon={Package} color="text-emerald-400" hexColor="#34d399" bg="bg-emerald-500/20"
                  chartType="bar" chartData={sparklineMock2} delay={0.2}
                />
              </div>

              {/* Operations Queue Table */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-8 py-5">
                  <h2 className="flex items-center gap-3 font-black text-white text-lg tracking-tight">
                    <Clock className="h-5 w-5 text-rose-400" />
                    Operations Queue
                  </h2>
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                    {t('Admin.triageRequired')}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/[0.01] text-[10px] font-black uppercase tracking-[0.15em] text-white/40 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-4">{t('Admin.priority')}</th>
                        <th className="px-8 py-4">{t('Admin.entityType')}</th>
                        <th className="px-8 py-4">{t('Admin.count')}</th>
                        <th className="px-8 py-4">{t('Admin.actionRequired')}</th>
                        <th className="px-8 py-4 text-right">{t('Admin.route')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/[0.03] transition-colors group cursor-pointer">
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-2 rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-black text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse"></span>CRITICAL
                          </span>
                        </td>
                        <td className="px-8 py-5 font-bold text-white/90">{t('Admin.userComplaints')}</td>
                        <td className="px-8 py-5 font-mono text-white/70">{pendingComplaints}</td>
                        <td className="px-8 py-5 text-white/50">{t('Admin.reviewContent')}</td>
                        <td className="px-8 py-5 text-right">
                          <Link href="/admin/moderation" className="inline-flex items-center gap-1 font-black text-indigo-400 group-hover:text-indigo-300 transition-colors">
                            Resolve <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.03] transition-colors group cursor-pointer">
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>HIGH
                          </span>
                        </td>
                        <td className="px-8 py-5 font-bold text-white/90">{t('Admin.pendingListings')}</td>
                        <td className="px-8 py-5 font-mono text-white/70">{pendingListings}</td>
                        <td className="px-8 py-5 text-white/50">{t('Admin.approveOrReject')}</td>
                        <td className="px-8 py-5 text-right">
                          <Link href="/admin/listings?status=pending" className="inline-flex items-center gap-1 font-black text-indigo-400 group-hover:text-indigo-300 transition-colors">
                            Review <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>

            </div>

            {/* Sidebar / Tools */}
            <div className="xl:col-span-4 space-y-8">
              
              {/* Platform Health Matrix */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 blur-3xl rounded-full" />
                <div className="border-b border-white/10 bg-white/[0.02] px-6 py-5 relative z-10">
                  <h2 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-white/60">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    System Telemetry
                  </h2>
                </div>
                <div className="p-3 relative z-10">
                  {[
                    { label: 'API Gateway', key: '_api', icon: Network },
                    { label: 'Primary DB', key: 'database', icon: Database },
                    { label: 'Redis Cache', key: 'cache', icon: Cpu },
                    { label: 'Celery Workers', key: 'broker', icon: Activity },
                  ].map((item) => {
                    const val = item.key === '_api' ? (Object.keys(healthStatus).length > 0 ? 'ok' : loading ? 'checking' : 'error') : (healthStatus[item.key] ?? (loading ? 'checking' : 'unknown'));
                    const isOk = val === 'ok';
                    const isChecking = val === 'checking';
                    return (
                      <div key={item.label} className="flex items-center justify-between rounded-xl px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-white/30" />
                          <span className="font-mono text-xs font-bold text-white/70">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-[10px] font-black uppercase tracking-[0.15em] ${isOk ? 'text-emerald-400' : isChecking ? 'text-white/40' : 'text-rose-400'}`}>
                            {isOk ? 'NOMINAL' : isChecking ? 'SYNC...' : 'FAULT'}
                          </span>
                          <span className={`h-2.5 w-2.5 rounded-full border border-white/10 ${isOk ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : isChecking ? 'bg-white/20' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-4"
              >
                <Link href="/admin/ai-agent" className="relative flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-black/40 p-8 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Bot className="h-7 w-7 text-indigo-400" />
                  </div>
                  <span className="text-sm font-black text-white/90 uppercase tracking-widest">{t('Admin.aiCoPilot')}</span>
                </Link>
                <Link href="/admin/analytics" className="relative flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-black/40 p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                    <BarChart3 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <span className="text-sm font-black text-white/90 uppercase tracking-widest">{t('Admin.analytics')}</span>
                </Link>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
