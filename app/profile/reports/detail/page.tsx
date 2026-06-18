'use client';

/**
 * User-facing report detail.
 *
 * The user who filed a report can see the full record: subject, reason,
 * status timeline, and the moderator's resolution notes (if any) with an
 * inline TranslateButton so it can be read in the user's interface
 * language regardless of the language the moderator wrote it in.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Clock,
  Flag,
  Loader2,
  Package,
  ShieldAlert,
  User as UserIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TranslatableText } from '@/components/shared/TranslateButton';
import { moderationApi, type ReportRecord } from '@/lib/api/moderation';
import { formatRelativeTime, formatDate } from '@/lib/utils/format';

const STATUS_VISUAL: Record<string, { variant: any; key: string; icon: any }> = {
  pending: { variant: 'warning', key: 'adminMod.status_pending', icon: Clock },
  under_review: { variant: 'info', key: 'adminMod.status_under_review', icon: ShieldAlert },
  resolved_valid: { variant: 'success', key: 'adminMod.status_resolved_valid', icon: CheckCircle2 },
  resolved_invalid: { variant: 'default', key: 'adminMod.status_resolved_invalid', icon: XCircle },
};

export default function ReportDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));

  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    let alive = true;
    setLoading(true);
    moderationApi
      .detail(id)
      .then((data) => alive && setReport(data))
      .catch(() => alive && setReport(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm -ml-2"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            {t('common.back')}
          </button>

          {loading ? (
            <div className="mt-8 flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
            </div>
          ) : !report ? (
            <div className="mt-8 surface-elevated p-8 text-center text-fg-muted">
              {t('marketplace.noResults')}
            </div>
          ) : (
            (() => {
              const cfg = STATUS_VISUAL[report.status] ?? STATUS_VISUAL.pending;
              const Icon = cfg.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 grid gap-6 lg:grid-cols-3"
                >
                  <div className="space-y-6 lg:col-span-2">
                    <div className="surface-elevated p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-eyebrow">{t('report.title')}</p>
                          <h1 className="display-sm mt-2">
                            {report.report_type === 'listing'
                              ? t('report.titleListing' as any)
                              : t('report.titleSeller' as any)}
                          </h1>
                          <p className="mt-1 text-sm text-fg-muted">
                            #{report.public_id} · {formatDate(report.created_at)}
                          </p>
                        </div>
                        <Badge variant={cfg.variant} size="md" className="flex items-center gap-1">
                          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                          {t(cfg.key as any)}
                        </Badge>
                      </div>

                      {/* Reason */}
                      <div className="mt-6">
                        <h2 className="text-eyebrow">{t('report.reasonLabel')}</h2>
                        <p className="mt-2 font-semibold text-fg">
                          {t(`adminMod.reason_${report.reason_code}` as any) ?? report.reason_code}
                        </p>
                        {report.description && (
                          <div className="mt-3">
                            <TranslatableText
                              text={report.description}
                              textClassName="whitespace-pre-line text-sm leading-relaxed text-fg-muted"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Moderator response */}
                    {report.resolution_notes && (
                      <div className="surface-elevated p-6">
                        <h2 className="text-eyebrow">{t('report.adminResponse')}</h2>
                        <div className="mt-3">
                          <TranslatableText
                            text={report.resolution_notes}
                            textClassName="whitespace-pre-line text-sm leading-relaxed text-fg-muted"
                          />
                        </div>
                        {report.resolved_at && (
                          <p className="mt-3 text-xs text-fg-subtle">
                            {formatDate(report.resolved_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sidebar — subject */}
                  <div className="space-y-6">
                    <div className="surface-elevated p-6">
                      <h3 className="text-eyebrow">{t('report.subject')}</h3>
                      {report.report_type === 'listing' ? (
                        report.listing ? (
                          <Link
                            href={`/listings/detail?id=${report.listing.public_id}`}
                            className="mt-3 flex items-center gap-3 group"
                          >
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle">
                              <Package className="h-5 w-5 text-fg-muted" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-fg group-hover:text-brand-primary truncate">{report.listing.title}</p>
                              <p className="text-xs text-fg-muted">#{report.listing.public_id}</p>
                            </div>
                          </Link>
                        ) : (
                          <p className="mt-3 text-sm text-fg-muted">—</p>
                        )
                      ) : report.reported_user ? (
                        <Link
                          href={`/sellers/detail?id=${report.reported_user.public_id}`}
                          className="mt-3 flex items-center gap-3 group"
                        >
                          <Avatar src={report.reported_user.avatar_url} name={report.reported_user.full_name} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-fg group-hover:text-brand-primary truncate">{report.reported_user.full_name}</p>
                            <p className="text-xs text-fg-muted">#{report.reported_user.public_id}</p>
                          </div>
                        </Link>
                      ) : (
                        <p className="mt-3 text-sm text-fg-muted">—</p>
                      )}
                    </div>

                    <div className="surface-elevated p-6">
                      <h3 className="text-eyebrow">{t('report.statusLabel')}</h3>
                      <ul className="mt-3 space-y-3 text-sm">
                        <li className="flex items-center gap-2 text-fg-muted">
                          <span className="inline-block h-2 w-2 rounded-full bg-fg-subtle" />
                          {t('report.created')} · {formatRelativeTime(report.created_at)}
                        </li>
                        {report.resolved_at && (
                          <li className="flex items-center gap-2 text-success">
                            <span className="inline-block h-2 w-2 rounded-full bg-success" />
                            {t('report.resolved')} · {formatRelativeTime(report.resolved_at)}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })()
          )}
        </div>
      </main>
    </div>
  );
}
