'use client';

/**
 * Enterprise Admin Operations Hub.
 * Premium, data-dense layout with SVG charts and telemetry.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Users, Package, Flag, Activity, MessageCircle, RefreshCw, Clock, Bot,
  Shield, BarChart3, Megaphone, Terminal, Cpu, Database, Network, ChevronRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { formatNumber } from '@/lib/utils/format';
import { analyticsApi, type DashboardStats } from '@/lib/api/analytics';
import apiClient from '@/lib/api/client';

// ── SVG Charts ───────────────────────────────────────────────────────────────

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
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={polygon} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
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
      {data.map((d, i) => {
        const barH = (d / max) * H;
        const x = i * (barWidth + gap) + gap/2;
        const y = H - barH;
        return (
          <rect key={i} x={x} y={y} width={barWidth} height={barH} fill={color} rx="2" className="transition-all duration-500 hover:opacity-80" />
        );
      })}
    </svg>
  );
}

// ── Enterprise Stat Card ──────────────────────────────────────────────────────

function EnterpriseStatCard({ label, value, sub, subValue, trend, icon: Icon, color, hexColor, bg, chartType, chartData }: any) {
  const isPositive = trend >= 0;
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-border-hover hover:shadow-md">
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{label}</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display text-2xl font-black tracking-tight text-fg">{value}</span>
              {trend !== undefined && (
                <span className={`text-xs font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 h-12 w-full z-0 opacity-80">
        {chartType === 'area' ? (
          <AreaChart data={chartData} color={hexColor} />
        ) : (
          <BarChart data={chartData} color={hexColor} />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 z-10">
        <div className="text-xs font-medium text-fg-subtle">
          {sub}: <span className="font-bold text-fg">{subValue}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingListings, setPendingListings] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<Record<string, string>>({});

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [dash, pending, complaints, healthData, activity] = await Promise.allSettled([
        analyticsApi.dashboard(),
        apiClient.get('/listings/?status=pending&page_size=1'),
        apiClient.get('/moderation/v2/admin/reports/?status=pending&page_size=1'),
        (async () => {
          const base = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
          const r = await fetch(`${base}/health/deep/`);
          return r.json();
        })(),
        apiClient.get('/moderation/v2/admin/reports/?page_size=6&ordering=-created_at'),
      ]);
      if (dash.status === 'fulfilled') setStats(dash.value);
      if (pending.status === 'fulfilled') setPendingListings((pending.value.data as any)?.count ?? 0);
      if (complaints.status === 'fulfilled') setPendingComplaints((complaints.value.data as any)?.count ?? 0);
      if (healthData.status === 'fulfilled') setHealthStatus((healthData.value as any)?.checks ?? {});
      else setHealthStatus({ database: 'error', cache: 'error', broker: 'error' });
      if (activity.status === 'fulfilled') setRecentActivity((activity.value.data as any)?.results ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sparklineMock1 = [12, 14, 13, 16, 20, 24, 25, 28, 30, 35];
  const sparklineMock2 = [5, 8, 12, 10, 15, 14, 18, 22, 20, 25];
  const sparklineMock3 = [100, 120, 115, 140, 160, 200, 210, 190, 230, 250];

  return (
    <AdminLayout noPadding>
      <div className="min-h-screen bg-bg">
        {/* Top Operations Bar */}
        <div className="sticky top-0 z-30 border-b border-border bg-surface/95 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 border border-brand-primary/20 shadow-inner">
                <Terminal className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black leading-none text-fg tracking-tight">{t('Admin.commandCenter')}</h1>
                <p className="mt-1.5 text-[11px] font-mono text-fg-muted uppercase tracking-wider">
                  SYS_TIME: {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-xs font-mono shadow-sm">
                <div className={`h-2.5 w-2.5 rounded-full ${Object.values(healthStatus).includes('error') ? 'bg-danger animate-pulse' : 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`} />
                <span className="text-fg-muted">{t('Admin.clusterState')}</span>
                <span className={Object.values(healthStatus).includes('error') ? 'text-danger font-bold' : 'text-success font-bold'}>
                  {Object.values(healthStatus).includes('error') ? 'DEGRADED' : 'OPTIMAL'}
                </span>
              </div>
              <button onClick={() => load(true)} disabled={refreshing} className="flex h-10 items-center gap-2 rounded-lg bg-brand-primary px-5 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                SYNC DATA
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            
            {/* Main Analytics Column */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <EnterpriseStatCard
                  label="Active Users" value={formatNumber(stats?.users.active ?? 0)}
                  sub="New Today" subValue={`+${stats?.users.new_today ?? 0}`} trend={12.4}
                  icon={Users} color="text-blue-500" hexColor="#3b82f6" bg="bg-blue-500/10"
                  chartType="area" chartData={sparklineMock1}
                />
                <EnterpriseStatCard
                  label="Marketplace Volume" value={formatNumber(stats?.listings.active ?? 0)}
                  sub="Listings Created" subValue={`+${stats?.listings.new_today ?? 0}`} trend={8.2}
                  icon={Package} color="text-brand-primary" hexColor="#10b981" bg="bg-brand-primary/10"
                  chartType="bar" chartData={sparklineMock2}
                />
              </div>

              {/* Operations Queue Table */}
              <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-bg-subtle/50 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-fg">
                    <Clock className="h-5 w-5 text-warning" />
                    Operations Queue
                  </h2>
                  <span className="rounded bg-bg px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-fg-muted border border-border">{t('Admin.triageRequired')}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-bg text-[11px] font-bold uppercase tracking-wider text-fg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-3">{t('Admin.priority')}</th>
                        <th className="px-6 py-3">{t('Admin.entityType')}</th>
                        <th className="px-6 py-3">{t('Admin.count')}</th>
                        <th className="px-6 py-3">{t('Admin.actionRequired')}</th>
                        <th className="px-6 py-3 text-right">{t('Admin.route')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-bg-subtle/50 transition-colors group">
                        <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-md bg-danger/10 px-2.5 py-1 text-xs font-black text-danger border border-danger/20"><span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse"></span>CRITICAL</span></td>
                        <td className="px-6 py-4 font-bold text-fg">{t('Admin.userComplaints')}</td>
                        <td className="px-6 py-4 font-mono text-fg-muted">{pendingComplaints}</td>
                        <td className="px-6 py-4 text-fg-subtle">{t('Admin.reviewContent')}</td>
                        <td className="px-6 py-4 text-right"><Link href="/admin/moderation" className="inline-flex items-center gap-1 font-bold text-brand-primary group-hover:underline">Resolve <ChevronRight className="h-4 w-4" /></Link></td>
                      </tr>
                      <tr className="hover:bg-bg-subtle/50 transition-colors group">
                        <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1 text-xs font-black text-warning border border-warning/20"><span className="h-1.5 w-1.5 rounded-full bg-warning"></span>HIGH</span></td>
                        <td className="px-6 py-4 font-bold text-fg">{t('Admin.pendingListings')}</td>
                        <td className="px-6 py-4 font-mono text-fg-muted">{pendingListings}</td>
                        <td className="px-6 py-4 text-fg-subtle">{t('Admin.approveOrReject')}</td>
                        <td className="px-6 py-4 text-right"><Link href="/admin/listings?status=pending" className="inline-flex items-center gap-1 font-bold text-brand-primary group-hover:underline">Review <ChevronRight className="h-4 w-4" /></Link></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Sidebar / Tools */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Platform Health Matrix */}
              <div className="rounded-2xl border border-border bg-[#0a0a0a] shadow-lg overflow-hidden">
                <div className="border-b border-neutral-800 bg-neutral-900 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-neutral-100">
                    <Activity className="h-4 w-4 text-brand-primary" />
                    System Telemetry
                  </h2>
                </div>
                <div className="p-2">
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
                      <div key={item.label} className="flex items-center justify-between rounded-lg px-4 py-3 hover:bg-neutral-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-neutral-500" />
                          <span className="font-mono text-xs font-medium text-neutral-300">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {isOk ? 'NOMINAL' : isChecking ? 'SYNC...' : 'FAULT'}
                          </span>
                          <span className={`h-2 w-2 rounded-sm ${isOk ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]' : isChecking ? 'bg-neutral-500' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/ai-agent" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-6 text-center hover:border-brand-primary hover:shadow-md transition-all group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 group-hover:bg-brand-primary/20 transition-colors">
                    <Bot className="h-6 w-6 text-brand-primary" />
                  </div>
                  <span className="text-sm font-bold text-fg">{t('Admin.aiCoPilot')}</span>
                </Link>
                <Link href="/admin/analytics" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-6 text-center hover:border-blue-500 hover:shadow-md transition-all group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-fg">{t('Admin.analytics')}</span>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
