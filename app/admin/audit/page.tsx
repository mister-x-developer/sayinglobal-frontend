'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ScrollText, ShieldCheck, Users, Package, Flag, Settings, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatRelativeTime } from '@/lib/utils/format';
import apiClient from '@/lib/api/client';

interface AuditLog {
  id: string;
  action_type: string;
  moderator: { full_name: string } | null;
  target_user: { full_name: string } | null;
  listing: { title: string; id: number } | null;
  reason: string;
  created_at: string;
}

const TYPE_ICON: Record<string, typeof ShieldCheck> = {
  user_warned: Users,
  user_restricted: Users,
  user_blocked: Users,
  user_unblocked: Users,
  listing_removed: Package,
  listing_restored: Package,
  comment_removed: Flag,
  complaint_resolved: Flag,
};

const TYPE_TONE: Record<string, string> = {
  user_warned: 'bg-warning/12 text-warning',
  user_restricted: 'bg-danger/12 text-danger',
  user_blocked: 'bg-danger/12 text-danger',
  user_unblocked: 'bg-success/12 text-success',
  listing_removed: 'bg-brand-primary/10 text-brand-primary',
  listing_restored: 'bg-success/12 text-success',
  comment_removed: 'bg-info/12 text-info',
  complaint_resolved: 'bg-brand-accent/12 text-brand-accent',
};

export default function AdminAuditPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/moderation/actions/', { params: { page_size: 50 } });
      const data = res.data;
      setLogs(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
            <h1 className="display-md mt-2">{t('admin.auditLogs')}</h1>
            <p className="mt-2 text-fg-muted">{logs.length} {t('admin.auditLogs').toLowerCase()}</p>
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

        <div className="surface-elevated mt-6 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <div className="skeleton h-9 w-9 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton mt-1.5 h-3 w-1/4" />
                  </div>
                  <div className="skeleton h-3 w-20" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={ScrollText} title={t('empty.noActivity')} description={t('empty.noActivityDescription')} />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log, i) => {
                const Icon = TYPE_ICON[log.action_type] ?? ShieldCheck;
                const tone = TYPE_TONE[log.action_type] ?? 'bg-bg-subtle text-fg-muted';
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.04 }}
                    className="flex items-start gap-4 px-5 py-4"
                  >
                    <div className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-fg">{log.action_type.replace(/_/g, ' ')}</p>
                        {log.moderator && <Badge variant="outline" size="sm">{log.moderator.full_name}</Badge>}
                      </div>
                      {log.target_user && (
                        <p className="mt-0.5 text-sm text-fg-muted">{log.target_user.full_name}</p>
                      )}
                      {log.listing && (
                        <p className="mt-0.5 text-sm text-fg-muted">{log.listing.title}</p>
                      )}
                      {log.reason && (
                        <p className="mt-0.5 text-xs text-fg-subtle">{log.reason}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-fg-subtle">{formatRelativeTime(log.created_at)}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
