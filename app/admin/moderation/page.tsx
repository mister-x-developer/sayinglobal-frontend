'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/components/ui/Toast';
import { moderationApi, type AdminReportRecord } from '@/lib/api/moderation';
import { Flag, RefreshCw, CheckCircle2, XCircle, Eye } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function AdminModerationPage() {
  const t = useTranslations();
  const router = useRouter();
  const [reports, setReports] = useState<AdminReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'resolved_valid' | 'resolved_invalid'>('pending');
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await moderationApi.adminList({ page_size: 100, status: statusFilter === 'all' ? undefined : statusFilter as any });
      setReports(data.results || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow">{t('Moderation.trustAndSafety')}</p>
            <h1 className="display-md">{t('Moderation.complaintsReports')}</h1>
          </div>
          <button onClick={fetchReports} className="btn btn-secondary h-10" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2">{t('Moderation.refresh')}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {(['all','pending','under_review','resolved_valid','resolved_invalid'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${statusFilter === s ? 'bg-brand-primary text-white' : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated'}`}>
              {t(`adminMod.status_${s}` as any) || s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="mt-6 surface-elevated overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-fg-muted">{t('Moderation.loadingReports')}</div>
          ) : reports.length === 0 ? (
            <div className="p-8"><EmptyState icon={Flag} title={t('admin.noReports')} description={t('admin.allClearFilter')} /></div>
          ) : (
            <div className="divide-y divide-border">
              {reports.map((r) => (
                <div key={r.public_id} className="flex items-center gap-4 p-4 hover:bg-bg-subtle/60 cursor-pointer" onClick={() => router.push(`/admin/moderation/detail?id=${r.public_id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === 'pending' ? 'warning' : r.status.includes('valid') ? 'success' : 'default'} size="sm">
                        {t(`adminMod.status_${r.status}` as any) || r.status.replace(/_/g,' ')}
                      </Badge>
                      <span className="font-medium text-fg">{t(`adminMod.reason_${r.reason_code}` as any) || r.reason_code}</span>
                      <span className="text-xs text-fg-subtle">#{r.public_id || 'N/A'}</span>
                    </div>
                    <p className="text-sm text-fg-muted line-clamp-1 mt-0.5">{r.description || 'No description provided'}</p>
                    <p className="text-xs text-fg-subtle mt-1">
                      {r.complainant?.full_name} → {r.reported_user?.full_name || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">

                    <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/moderation/detail?id=${r.public_id}`); }} className="btn btn-sm btn-primary">
                      {t('common.details')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
