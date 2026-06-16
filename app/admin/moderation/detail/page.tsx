'use client';

/**
 * Admin Report/Complaint Detail Page.
 *
 * Full moderation workspace for a single complaint — shows complainant,
 * reported entity (listing or seller), all actions (start review, resolve,
 * dismiss), moderator notes with auto-translate, and full history.
 *
 * Translate button on report description and moderator notes uses
 * TranslatableText so the admin can read in their own language.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flag,
  Languages,
  Loader2,
  MessageSquareText,
  Package,
  RefreshCw,
  ShieldAlert,
  User as UserIcon,
  XCircle,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { TranslatableText } from '@/components/shared/TranslateButton';
import {
  moderationApi,
  type AdminReportRecord,
  type ReportStatus,
} from '@/lib/api/moderation';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

const STATUS_BADGE: Record<ReportStatus, any> = {
  pending: 'warning',
  under_review: 'info',
  resolved_valid: 'success',
  resolved_invalid: 'default',
};

const STATUS_ICON: Record<ReportStatus, any> = {
  pending: Clock,
  under_review: ShieldAlert,
  resolved_valid: CheckCircle2,
  resolved_invalid: XCircle,
};

export default function AdminReportDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));

  const [report, setReport] = useState<AdminReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<'review' | 'valid' | 'invalid' | null>(null);
  const [translating, setTranslating] = useState<'description' | 'resolution_notes' | null>(null);
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translateLang, setTranslateLang] = useState<'uz' | 'uz-cyrl' | 'ru' | 'en'>('uz');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await moderationApi.adminList({ page_size: 200 });
      const found = data.results.find((r) => r.public_id === id) ?? null;
      setReport(found);
      if (found?.resolution_notes) setNotes(found.resolution_notes);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (Number.isFinite(id)) load(); }, [id, load]);

  const startReview = async () => {
    if (!report) return;
    setSubmitting('review');
    try {
      await moderationApi.adminStartReview(report.public_id);
      toast.success(t('success.updated'));
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const resolveValid = async () => {
    if (!report || !notes.trim()) {
      toast.error(t('admin.rejectionReasonRequired' as any) ?? 'Moderator note is required');
      return;
    }
    setSubmitting('valid');
    try {
      await moderationApi.adminResolveValid(report.public_id, notes.trim());
      toast.success(t('success.updated'));
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const resolveInvalid = async () => {
    if (!report || !notes.trim()) {
      toast.error(t('admin.rejectionReasonRequired' as any) ?? 'Moderator note is required');
      return;
    }
    setSubmitting('invalid');
    try {
      await moderationApi.adminResolveInvalid(report.public_id, notes.trim());
      toast.success(t('success.updated'));
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const translateField = async (field: 'description' | 'resolution_notes') => {
    if (!report) return;
    setTranslating(field);
    try {
      const result = await moderationApi.adminTranslateReportText(report.public_id, field, translateLang);
      setTranslatedTexts((prev) => ({ ...prev, [field]: result.translated }));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setTranslating(null);
    }
  };

  const StatusIcon = report ? STATUS_ICON[report.status as ReportStatus] ?? Clock : Clock;

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm -ml-2">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </button>

        {loading ? (
          <div className="mt-8 flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
          </div>
        ) : !report ? (
          <div className="mt-8 surface-elevated p-8 text-center text-fg-muted">
            {t('marketplace.noResults')}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 grid gap-6 lg:grid-cols-3"
          >
            {/* Main */}
            <div className="space-y-6 lg:col-span-2">
              {/* Header */}
              <div className="surface-elevated p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-eyebrow">
                      {t('admin.complaints')} #{report.public_id}
                    </p>
                    <h1 className="display-md mt-2">
                      {report.report_type === 'listing'
                        ? t('report.titleListing' as any) ?? 'Listing Report'
                        : t('report.titleSeller' as any) ?? 'Seller Report'}
                    </h1>
                    <p className="mt-1 text-sm text-fg-muted">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                  <Badge variant={STATUS_BADGE[report.status as ReportStatus] ?? 'default'} size="md" className="flex items-center gap-1">
                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    {t(`adminMod.status_${report.status}` as any) ?? report.status}
                  </Badge>
                </div>
              </div>

              {/* Complainant */}
              <div className="surface-elevated p-6">
                <h2 className="text-eyebrow mb-3">{t('report.complainant' as any) ?? 'Filed by'}</h2>
                <div className="flex items-center gap-3">
                  <Avatar src={report.complainant?.avatar_url} name={report.complainant?.full_name} size="lg" />
                  <div>
                    <p className="font-semibold text-fg">{report.complainant?.full_name}</p>
                    <p className="text-xs text-fg-muted">{report.complainant?.phone}</p>
                    <Link href={`/admin/users/detail?id=${report.complainant?.public_id}`} className="text-xs text-brand-primary hover:underline">
                      {t('admin.viewDetails' as any)}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="surface-elevated p-6">
                <h2 className="text-eyebrow mb-3">{t('report.subject' as any) ?? 'Reported'}</h2>
                {report.report_type === 'listing' ? (
                  report.listing ? (
                    <Link href={`/admin/listings/detail?id=${report.listing.public_id}`} className="group flex items-center gap-3 hover:text-brand-primary">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle">
                        <Package className="h-5 w-5 text-fg-muted" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="font-semibold text-fg group-hover:text-brand-primary">{report.listing.title}</p>
                        <p className="text-xs text-fg-muted">#{report.listing.public_id}</p>
                      </div>
                    </Link>
                  ) : (
                    <p className="text-sm text-fg-muted">—</p>
                  )
                ) : report.reported_user ? (
                  <Link href={`/admin/users/detail?id=${report.reported_user.public_id}`} className="group flex items-center gap-3 hover:text-brand-primary">
                    <Avatar src={report.reported_user.avatar_url} name={report.reported_user.full_name} size="lg" />
                    <div>
                      <p className="font-semibold text-fg group-hover:text-brand-primary">{report.reported_user.full_name}</p>
                      <p className="text-xs text-fg-muted">#{report.reported_user.public_id}</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-fg-muted">—</p>
                )}
              </div>

              {/* Reason + description */}
              <div className="surface-elevated p-6">
                <h2 className="text-eyebrow mb-3">{t('report.reasonLabel' as any) ?? 'Reason'}</h2>
                <p className="font-semibold text-fg">
                  {t(`adminMod.reason_${report.reason_code}` as any) ?? report.reason_code}
                </p>
                <p className="mt-1 text-xs text-fg-subtle capitalize">
                  {t('adminMod.severity' as any) ?? 'Severity'}: {report.severity}
                </p>
                {report.description && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                        {t('adminMod.description' as any) ?? 'Description'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={translateLang}
                          onChange={(e) => setTranslateLang(e.target.value as any)}
                          className="rounded-lg border border-border bg-bg-subtle px-2 py-1 text-xs text-fg"
                        >
                          <option value="uz">{t('General.uzbek')}</option>
                          <option value="uz-cyrl">Кирилл</option>
                          <option value="ru">Русский</option>
                          <option value="en">{t('General.english')}</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => translateField('description')}
                          disabled={translating !== null}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg-subtle px-2 py-1 text-xs font-medium text-fg-muted hover:bg-bg-elevated disabled:opacity-50"
                        >
                          {translating === 'description'
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Languages className="h-3 w-3" strokeWidth={1.75} />}
                          Tarjima
                        </button>
                        {translatedTexts.description && (
                          <button
                            type="button"
                            onClick={() => setTranslatedTexts((p) => ({ ...p, description: '' }))}
                            className="text-xs text-fg-subtle hover:text-fg"
                          >
                            Asl
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-line text-sm text-fg-muted leading-relaxed">
                      {translatedTexts.description || report.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Moderator note */}
              <div className="surface-elevated p-6">
                <h2 className="text-eyebrow mb-3">{t('adminMod.moderatorNotes' as any) ?? 'Moderator Notes'}</h2>
                {report.resolution_notes ? (
                  <div className="mb-4">
                    <TranslatableText
                      text={report.resolution_notes}
                      textClassName="text-sm text-fg-muted whitespace-pre-line"
                    />
                    {report.resolved_by && (
                      <p className="mt-2 text-xs text-fg-subtle">
                        — {report.resolved_by.full_name}
                        {report.resolved_at && ` · ${formatRelativeTime(report.resolved_at)}`}
                      </p>
                    )}
                  </div>
                ) : null}
                {!['resolved_valid', 'resolved_invalid'].includes(report.status) && (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('admin.rejectionReasonPlaceholder' as any) ?? 'Add your moderator note...'}
                    rows={4}
                    className="input-base h-auto w-full py-2"
                  />
                )}
              </div>
            </div>

            {/* Sidebar — actions */}
            <div className="space-y-6">
              <div className="surface-elevated p-6">
                <h3 className="text-eyebrow">{t('admin.actions' as any) ?? 'Actions'}</h3>
                <div className="mt-3 space-y-2">
                  {report.status === 'pending' && (
                    <button
                      type="button"
                      onClick={startReview}
                      disabled={submitting !== null}
                      className="btn btn-secondary w-full"
                    >
                      {submitting === 'review'
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ShieldAlert className="h-4 w-4" strokeWidth={2} />}
                      {t('adminMod.startReview' as any) ?? 'Start Review'}
                    </button>
                  )}
                  {['pending', 'under_review'].includes(report.status) && (
                    <>
                      <button
                        type="button"
                        onClick={resolveValid}
                        disabled={submitting !== null || !notes.trim()}
                        className="btn btn-primary w-full"
                      >
                        {submitting === 'valid'
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />}
                        {t('adminMod.resolveValid' as any) ?? 'Resolve: Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={resolveInvalid}
                        disabled={submitting !== null || !notes.trim()}
                        className="btn btn-secondary w-full"
                      >
                        {submitting === 'invalid'
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <XCircle className="h-4 w-4" strokeWidth={2.25} />}
                        {t('adminMod.resolveInvalid' as any) ?? 'Resolve: Dismiss'}
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs text-fg-subtle">
                  {!notes.trim() && !['resolved_valid', 'resolved_invalid'].includes(report.status)
                    ? t('admin.notesRequiredToResolve' as any) ?? 'Add a note before resolving.'
                    : ''}
                </p>
              </div>

              {/* Metadata */}
              <div className="surface-elevated p-6">
                <h3 className="text-eyebrow">{t('admin.status' as any) ?? 'Info'}</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-fg-muted">{t('adminMod.severity' as any) ?? 'Severity'}</dt>
                    <dd className="font-semibold capitalize">{report.severity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-fg-muted">{t('admin.created' as any) ?? 'Created'}</dt>
                    <dd className="font-semibold">{formatRelativeTime(report.created_at)}</dd>
                  </div>
                  {report.assigned_to && (
                    <div className="flex justify-between">
                      <dt className="text-fg-muted">{t('adminMod.assignedTo' as any) ?? 'Assigned'}</dt>
                      <dd className="font-semibold">{report.assigned_to.full_name}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Restore user status (for warning/restricted only) */}
              {report.reported_user &&
                ['warning', 'restricted'].includes(report.reported_user.status ?? '') && (
                <div className="surface-elevated p-6">
                  <h3 className="text-eyebrow mb-3">
                    Holatni tiklash
                  </h3>
                  <p className="text-xs text-fg-muted mb-3">
                    Foydalanuvchi hozirgi holati:{' '}
                    <span className="font-bold capitalize text-fg">{report.reported_user.status}</span>
                    . Bu yerdan «good» yoki past darajaga tiklash mumkin.
                    Blocked holatdan chiqarish alohida «unblock» tugmasi orqali.
                  </p>
                  <RestoreStatusPanel
                    userPublicId={report.reported_user.public_id}
                    currentStatus={report.reported_user.status as any}
                    onRestored={load}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── RestoreStatusPanel ───────────────────────────────────────────────────────

function RestoreStatusPanel({
  userPublicId,
  currentStatus,
  onRestored,
}: {
  userPublicId: number;
  currentStatus: 'warning' | 'restricted';
  onRestored?: () => void;
}) {
  const [reason, setReason] = useState('');
  const [targetStatus, setTargetStatus] = useState<'good' | 'warning'>('good');
  const [loading, setLoading] = useState(false);

  const options: { value: 'good' | 'warning'; label: string }[] =
    currentStatus === 'restricted'
      ? [{ value: 'good', label: 'good' }, { value: 'warning', label: 'warning' }]
      : [{ value: 'good', label: 'good' }];

  const handleRestore = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await moderationApi.adminRestoreStatus(userPublicId, targetStatus, reason.trim());
      onRestored?.();
    } catch {
      // toast handled by caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setTargetStatus(o.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition capitalize ${
              targetStatus === o.value
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-border text-fg-muted hover:bg-bg-subtle'
            }`}
          >
            → {o.label}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Tiklash sababi..."
        rows={2}
        className="input-base h-auto w-full py-1.5 text-xs"
      />
      <button
        type="button"
        onClick={handleRestore}
        disabled={!reason.trim() || loading}
        className="btn btn-secondary btn-sm w-full"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" strokeWidth={2} />}
        Holatni tiklash
      </button>
    </div>
  );
}
