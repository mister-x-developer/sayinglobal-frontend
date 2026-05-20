'use client';

/**
 * User-facing "My reports" list. Lets a signed-in user see every report
 * they have filed (against listings or sellers) along with the current
 * status and any moderator response.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Clock, Flag, Loader2, Package, ShieldAlert, User as UserIcon } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuthStore } from '@/lib/store/auth';
import { moderationApi, type ReportRecord, type ReportStatus } from '@/lib/api/moderation';
import { formatRelativeTime } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';

const STATUS_BADGE: Record<ReportStatus, { variant: any; key: string }> = {
  pending: { variant: 'warning', key: 'adminMod.status_pending' },
  under_review: { variant: 'info', key: 'adminMod.status_under_review' },
  resolved_valid: { variant: 'success', key: 'adminMod.status_resolved_valid' },
  resolved_invalid: { variant: 'default', key: 'adminMod.status_resolved_invalid' },
};

export default function MyReportsPage() {
  const t = useTranslations();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [hydrated, setHydrated] = useState(false);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/auth');
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    moderationApi
      .myReports()
      .then((data) => alive && setReports(data))
      .catch(() => alive && setReports([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-eyebrow">{t('profile.title' as any)}</p>
            <h1 className="display-md mt-2">{t('profile.myReports' as any) ?? 'My reports'}</h1>
            <p className="mt-2 text-fg-muted">{reports.length}</p>
          </motion.div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                icon={Flag}
                title={t('profile.noReports' as any) ?? 'No reports yet'}
                description={t('profile.noReportsDesc' as any) ?? ''}
              />
            ) : (
              <ul className="space-y-3">
                {reports.map((r) => {
                  const cfg = STATUS_BADGE[r.status];
                  return (
                    <li key={r.public_id}>
                      <Link
                        href={`/profile/reports/${r.public_id}`}
                        className="surface-elevated group flex items-start gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                      >
                        <div className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-bg-subtle text-fg-muted">
                          {r.report_type === 'listing' ? (
                            <Package className="h-5 w-5" strokeWidth={1.75} />
                          ) : (
                            <UserIcon className="h-5 w-5" strokeWidth={1.75} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-fg">
                              {r.report_type === 'listing'
                                ? r.listing?.title ?? `#${r.listing?.public_id}`
                                : r.reported_user?.full_name ?? `#${r.reported_user?.public_id}`}
                            </p>
                            <Badge variant={cfg.variant} size="sm">{t(cfg.key as any)}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-fg-muted line-clamp-2">{r.description || t(`adminMod.reason_${r.reason_code}` as any) || r.reason_code}</p>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-fg-subtle">
                            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                            {formatRelativeTime(r.created_at)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
