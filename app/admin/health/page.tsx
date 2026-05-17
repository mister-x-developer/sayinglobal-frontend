'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Activity,
  Database,
  Server,
  Users,
  Package,
  Bell,
  Flag,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import apiClient from '@/lib/api/client';

interface HealthDeep {
  status: 'ok' | 'degraded';
  checks: Record<string, string>;
  response_ms: number;
  timestamp: number;
}

interface OperationalStatus {
  platform: {
    users_total: number;
    users_new_24h: number;
    listings_active: number;
    listings_pending: number;
    listings_rejected: number;
  };
  notifications: {
    unread_total: number;
    created_24h: number;
  };
  moderation: {
    open_complaints: number;
  };
  timestamp: number;
}

function StatusBadge({ value }: { value: string }) {
  if (value === 'ok') return <Badge variant="success" size="sm">OK</Badge>;
  if (value === 'miss') return <Badge variant="warning" size="sm">Cache miss</Badge>;
  if (value.startsWith('error')) return <Badge variant="error" size="sm">Error</Badge>;
  return <Badge variant="default" size="sm">{value}</Badge>;
}

function StatusIcon({ status }: { status: 'ok' | 'degraded' | 'unknown' }) {
  if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={2} />;
  if (status === 'degraded') return <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={2} />;
  return <XCircle className="h-5 w-5 text-fg-subtle" strokeWidth={2} />;
}

export default function AdminHealthPage() {
  const t = useTranslations();
  const [health, setHealth] = useState<HealthDeep | null>(null);
  const [ops, setOps] = useState<OperationalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, opsRes] = await Promise.allSettled([
        apiClient.get<HealthDeep>('/../../health/deep/'),
        apiClient.get<OperationalStatus>('/../../health/status/'),
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (opsRes.status === 'fulfilled') setOps(opsRes.value.data);
      setLastRefresh(new Date());
    } catch {
      // silently handle — show last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const kpis = ops ? [
    { icon: Users,   label: 'Total users',        value: ops.platform.users_total,    sub: `+${ops.platform.users_new_24h} today`, tone: 'bg-brand-primary/10 text-brand-primary' },
    { icon: Package, label: 'Active listings',     value: ops.platform.listings_active, sub: `${ops.platform.listings_pending} pending`, tone: 'bg-success/12 text-success' },
    { icon: Bell,    label: 'Unread notifications', value: ops.notifications.unread_total, sub: `${ops.notifications.created_24h} today`, tone: 'bg-info/12 text-info' },
    { icon: Flag,    label: 'Open complaints',     value: ops.moderation.open_complaints, sub: ops.moderation.open_complaints > 0 ? 'Needs attention' : 'All clear', tone: ops.moderation.open_complaints > 0 ? 'bg-danger/12 text-danger' : 'bg-success/12 text-success' },
  ] : [];

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-end justify-between gap-3"
        >
          <div>
            <p className="text-eyebrow">{t('admin.title')}</p>
            <h1 className="display-md mt-2">{t('admin.systemHealth')}</h1>
            {lastRefresh && (
              <p className="mt-1 text-xs text-fg-subtle">
                Last updated: {lastRefresh.toLocaleTimeString()} — auto-refreshes every 30s
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={load}
            className="btn btn-secondary btn-sm"
            aria-label={t('common.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>
        </motion.div>

        {/* Infrastructure health */}
        <div className="mt-6 surface-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-fg">Infrastructure</h2>
            {health && (
              <span className="ml-auto">
                <StatusIcon status={health.status} />
              </span>
            )}
          </div>
          {health ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(health.checks).map(([name, value]) => (
                <div key={name} className="flex items-center justify-between rounded-xl bg-bg-subtle px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
                    <span className="text-sm font-medium text-fg capitalize">{name}</span>
                  </div>
                  <StatusBadge value={value} />
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-bg-subtle px-4 py-3 sm:col-span-3">
                <span className="text-xs text-fg-subtle">Response time</span>
                <span className="text-sm font-semibold text-fg">{health.response_ms}ms</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-danger" />}
              {loading ? 'Checking…' : 'Could not reach health endpoint'}
            </div>
          )}
        </div>

        {/* Operational KPIs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.length > 0 ? kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="surface-elevated flex items-center gap-4 p-5"
              >
                <div className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${kpi.tone}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-fg-subtle truncate">{kpi.label}</p>
                  <p className="font-display text-2xl font-bold text-fg">{kpi.value}</p>
                  <p className="text-xs text-fg-subtle truncate">{kpi.sub}</p>
                </div>
              </motion.div>
            );
          }) : loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-elevated flex items-center gap-4 p-5">
                <div className="skeleton h-11 w-11 rounded-xl" />
                <div className="flex-1">
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton mt-2 h-7 w-16" />
                </div>
              </div>
            ))
          ) : null}
        </div>

        {/* Pending items attention banner */}
        {ops && ops.platform.listings_pending > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" strokeWidth={2} />
            <p className="text-sm text-fg">
              <span className="font-semibold">{ops.platform.listings_pending}</span> listing(s) awaiting moderation review.{' '}
              <a href="/admin/listings" className="font-semibold text-brand-primary hover:underline">
                Review now →
              </a>
            </p>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
