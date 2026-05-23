'use client';

import Link from 'next/link';

/**
 * Admin Moderation Dashboard — production V2.
 *
 * Real operational moderation workspace:
 *  - Filterable queue (status, severity, report type, reason)
 *  - Two-pane layout: list on the left, full detail on the right
 *  - Live actions: start review, resolve valid, resolve invalid
 *  - Notes are required to resolve.
 *  - Renders translated reasons + severities + statuses.
 *  - Shows seller status, the affected listing, and timestamps.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Loader2,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  ShieldQuestion,
  User as UserIcon,
  XCircle,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';
import {
  moderationApi,
  type AdminQueueParams,
  type AdminReportRecord,
  type ReportSeverity,
  type ReportStatus,
} from '@/lib/api/moderation';

// ── Visual maps ──────────────────────────────────────────────────────────────

const STATUS_VISUAL: Record<
  ReportStatus,
  { bg: string; fg: string; icon: typeof Clock; label: string }
> = {
  pending: {
    bg: 'bg-amber-50 ring-amber-200',
    fg: 'text-amber-700',
    icon: Clock,
    label: 'pending',
  },
  under_review: {
    bg: 'bg-blue-50 ring-blue-200',
    fg: 'text-blue-700',
    icon: ShieldAlert,
    label: 'under_review',
  },
  resolved_valid: {
    bg: 'bg-emerald-50 ring-emerald-200',
    fg: 'text-emerald-700',
    icon: CheckCircle2,
    label: 'resolved_valid',
  },
  resolved_invalid: {
    bg: 'bg-slate-50 ring-slate-200',
    fg: 'text-slate-600',
    icon: XCircle,
    label: 'resolved_invalid',
  },
};

const SEVERITY_VISUAL: Record<ReportSeverity, { bg: string; fg: string }> = {
  low:      { bg: 'bg-emerald-50 ring-emerald-200', fg: 'text-emerald-700' },
  medium:   { bg: 'bg-amber-50 ring-amber-200',     fg: 'text-amber-700' },
  high:     { bg: 'bg-orange-50 ring-orange-200',   fg: 'text-orange-700' },
  critical: { bg: 'bg-red-50 ring-red-200',         fg: 'text-red-700' },
};

const SELLER_STATUS_VISUAL: Record<
  string,
  { bg: string; fg: string; icon: typeof ShieldCheck }
> = {
  good:       { bg: 'bg-emerald-50',  fg: 'text-emerald-700', icon: ShieldCheck },
  warning:    { bg: 'bg-amber-50',    fg: 'text-amber-700',   icon: ShieldAlert },
  restricted: { bg: 'bg-red-50',      fg: 'text-red-700',     icon: ShieldBan },
  blocked:    { bg: 'bg-slate-100',   fg: 'text-slate-700',   icon: ShieldBan },
};

const ALL_REPORT_TYPES = ['listing', 'seller'] as const;
const ALL_STATUSES: ReportStatus[] = [
  'pending', 'under_review', 'resolved_valid', 'resolved_invalid',
];
const ALL_SEVERITIES: ReportSeverity[] = ['low', 'medium', 'high', 'critical'];

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReportStatus }) {
  const t = useTranslations();
  const v = STATUS_VISUAL[status] ?? STATUS_VISUAL.pending;
  const Icon = v.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1',
        v.bg, v.fg,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {t(`report.status.${status}`)}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  const t = useTranslations();
  const v = SEVERITY_VISUAL[severity] ?? SEVERITY_VISUAL.medium;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
        v.bg, v.fg,
      )}
    >
      {t(`report.severity.${severity}`)}
    </span>
  );
}

function SellerStatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const v = SELLER_STATUS_VISUAL[status] ?? SELLER_STATUS_VISUAL.good;
  const Icon = v.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        v.bg, v.fg,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.25} />
      {t(`profileInfo.statusBody`).split('\n')[0] /* ignore */ ? null : null}
      {t(`adminMod.sellerStatus.${status}`, { defaultValue: status })}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminModerationPage() {
  const t = useTranslations();
  const [filters, setFilters] = useState<AdminQueueParams>({ page: 1, page_size: 30 });
  const [items, setItems] = useState<AdminReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<AdminReportRecord | null>(null);
  const [acting, setActing] = useState<null | 'start' | 'valid' | 'invalid'>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [severityChoice, setSeverityChoice] = useState<ReportSeverity | ''>('');
  const [outcomeError, setOutcomeError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await moderationApi.adminList(filters);
      setItems(data.results);
      setCount(data.count);
      // If selection no longer in list, clear; else refresh selection.
      if (selected) {
        const next = data.results.find((r) => r.public_id === selected.public_id);
        setSelected(next ?? null);
      } else if (data.results.length > 0) {
        setSelected(data.results[0]);
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const counters = useMemo(() => {
    const map: Record<string, number> = { pending: 0, under_review: 0, resolved_valid: 0, resolved_invalid: 0 };
    items.forEach((it) => { map[it.status] = (map[it.status] || 0) + 1; });
    return map;
  }, [items]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const onStartReview = async () => {
    if (!selected) return;
    setActing('start');
    setOutcomeError(null);
    try {
      const updated = await moderationApi.adminStartReview(selected.public_id);
      setSelected(updated);
      setItems((prev) => prev.map((p) => (p.public_id === updated.public_id ? updated : p)));
      toast.success(t('adminMod.startedReview'));
    } catch (e: any) {
      setOutcomeError(e?.message || t('common.error'));
    } finally {
      setActing(null);
    }
  };

  const onResolve = async (kind: 'valid' | 'invalid') => {
    if (!selected) return;
    if (moderatorNotes.trim().length < 5) {
      setOutcomeError(t('adminMod.notesTooShort'));
      return;
    }
    setActing(kind);
    setOutcomeError(null);
    try {
      if (kind === 'valid') {
        const res = await moderationApi.adminResolveValid(
          selected.public_id,
          moderatorNotes,
          // Pass admin-chosen severity only when reason is "other".
          selected.reason_code === 'other' && severityChoice
            ? severityChoice
            : undefined,
        );
        setSelected(res.complaint);
        setItems((prev) =>
          prev.map((p) => (p.public_id === res.complaint.public_id ? res.complaint : p))
        );
        if (res.seller_status_changed_to) {
          toast.success(
            t('adminMod.statusChangedTo', {
              status: res.seller_status_changed_to,
            }),
          );
        } else {
          toast.success(t('adminMod.resolvedValid'));
        }
      } else {
        const updated = await moderationApi.adminResolveInvalid(selected.public_id, moderatorNotes);
        setSelected(updated);
        setItems((prev) => prev.map((p) => (p.public_id === updated.public_id ? updated : p)));
        toast.success(t('adminMod.resolvedInvalid'));
      }
      setModeratorNotes('');
      setSeverityChoice('');
    } catch (e: any) {
      setOutcomeError(e?.message || t('common.error'));
    } finally {
      setActing(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-fg">
              {t('adminMod.title')}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">{t('adminMod.subtitle')}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQueue}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(['pending', 'under_review', 'resolved_valid', 'resolved_invalid'] as ReportStatus[]).map((s) => {
            const v = STATUS_VISUAL[s];
            const Icon = v.icon;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, status: f.status === s ? undefined : s, page: 1 }))}
                className={cn(
                  'surface-elevated flex items-center gap-3 rounded-xl p-3 text-left transition',
                  filters.status === s && 'ring-2 ring-brand-accent/40',
                )}
              >
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg ring-1', v.bg, v.fg)}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                    {t(`report.status.${s}`)}
                  </p>
                  <p className="font-display text-2xl font-bold text-fg">{counters[s] ?? 0}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters bar */}
        <div className="surface-elevated flex flex-wrap items-center gap-2 p-3">
          {/* Type */}
          <FilterChip
            label={t('adminMod.allTypes')}
            active={!filters.report_type}
            onClick={() => setFilters((f) => ({ ...f, report_type: undefined, page: 1 }))}
          />
          {ALL_REPORT_TYPES.map((rt) => (
            <FilterChip
              key={rt}
              label={t(rt === 'listing' ? 'report.subjectListing' : 'report.subjectSeller')}
              active={filters.report_type === rt}
              onClick={() => setFilters((f) => ({ ...f, report_type: rt, page: 1 }))}
            />
          ))}

          <span className="mx-2 h-5 w-px bg-border" aria-hidden />

          {/* Severity */}
          <FilterChip
            label={t('adminMod.allSeverities')}
            active={!filters.severity}
            onClick={() => setFilters((f) => ({ ...f, severity: undefined, page: 1 }))}
          />
          {ALL_SEVERITIES.map((s) => (
            <FilterChip
              key={s}
              label={t(`report.severity.${s}`)}
              active={filters.severity === s}
              tone={s}
              onClick={() => setFilters((f) => ({ ...f, severity: s, page: 1 }))}
            />
          ))}
        </div>

        {/* Two-pane layout */}
        <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
          {/* Queue */}
          <div className="surface-elevated overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
              <span>{t('adminMod.queue')}</span>
              <span className="text-fg-subtle">
                {count} {t('adminMod.totalReports')}
              </span>
            </div>
            <div className="max-h-[68vh] overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-fg-subtle">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-fg-subtle" />
                  <p className="text-sm font-semibold text-fg-muted">{t('adminMod.emptyTitle')}</p>
                  <p className="text-xs text-fg-subtle">{t('adminMod.emptyBody')}</p>
                </div>
              ) : (
                <ul>
                  {items.map((it) => (
                    <li key={it.public_id}>
                      <button
                        type="button"
                        onClick={() => { setSelected(it); setModeratorNotes(''); setSeverityChoice(''); setOutcomeError(null); }}
                        className={cn(
                          'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-bg-subtle',
                          selected?.public_id === it.public_id && 'bg-bg-subtle',
                        )}
                      >
                        <div className="mt-0.5">
                          {it.report_type === 'listing'
                            ? <Package className="h-4 w-4 text-fg-muted" strokeWidth={2} />
                            : <UserIcon className="h-4 w-4 text-fg-muted" strokeWidth={2} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-fg">
                              {t(`report.reasons.${it.reason_code}`)}
                            </p>
                            <SeverityBadge severity={it.severity} />
                          </div>
                          <p className="mt-1 truncate text-xs text-fg-muted">
                            {it.report_type === 'listing'
                              ? it.listing?.title ?? `#${it.listing?.public_id}`
                              : it.reported_user?.full_name ?? `#${it.reported_user?.public_id}`}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <StatusBadge status={it.status} />
                            <span className="text-[11px] text-fg-subtle">
                              {formatRelativeTime(it.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-fg-subtle" />
                        </div>
                      </button>
                      <div className="flex justify-end border-b border-border -mt-px px-4 pb-1">
                        <Link
                          href={`/admin/moderation/${it.public_id}`}
                          className="text-[10px] font-semibold text-brand-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Full detail →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Detail */}
          <div className="surface-elevated">
            {selected ? (
              <ReportDetailPane
                report={selected}
                acting={acting}
                moderatorNotes={moderatorNotes}
                setModeratorNotes={setModeratorNotes}
                severityChoice={severityChoice}
                setSeverityChoice={setSeverityChoice}
                outcomeError={outcomeError}
                onStartReview={onStartReview}
                onResolveValid={() => onResolve('valid')}
                onResolveInvalid={() => onResolve('invalid')}
              />
            ) : (
              <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                  <Flag className="mx-auto h-8 w-8 text-fg-subtle" />
                  <p className="mt-2 text-sm font-semibold text-fg-muted">
                    {t('adminMod.selectFromQueue')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function FilterChip({
  label, active, onClick, tone,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  tone?: ReportSeverity;
}) {
  const toneClass = tone ? SEVERITY_VISUAL[tone] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        active
          ? toneClass
            ? cn(toneClass.bg, toneClass.fg, 'border-transparent ring-1 ring-current')
            : 'border-brand-accent bg-brand-accent/10 text-brand-accent'
          : 'border-border text-fg-muted hover:bg-bg-subtle',
      )}
    >
      {label}
    </button>
  );
}

// ── Detail pane ──────────────────────────────────────────────────────────────

function ReportDetailPane({
  report, acting, moderatorNotes, setModeratorNotes,
  severityChoice, setSeverityChoice,
  outcomeError,
  onStartReview, onResolveValid, onResolveInvalid,
}: {
  report: AdminReportRecord;
  acting: null | 'start' | 'valid' | 'invalid';
  moderatorNotes: string;
  setModeratorNotes: (s: string) => void;
  severityChoice: ReportSeverity | '';
  setSeverityChoice: (s: ReportSeverity | '') => void;
  outcomeError: string | null;
  onStartReview: () => void;
  onResolveValid: () => void;
  onResolveInvalid: () => void;
}) {
  const t = useTranslations();
  const isResolved =
    report.status === 'resolved_valid' || report.status === 'resolved_invalid';

  return (
    <motion.div
      key={report.public_id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <div className="border-b border-border p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={report.status} />
            <SeverityBadge severity={report.severity} />
          </div>
          <span className="text-xs text-fg-subtle">#{report.public_id}</span>
        </div>
        <h2 className="mt-3 font-display text-xl font-bold text-fg">
          {t(`report.reasons.${report.reason_code}`)}
        </h2>
        <p className="mt-1 text-xs text-fg-muted">
          {report.report_type === 'listing'
            ? t('report.titleListing')
            : t('report.titleSeller')}
          {' · '}
          {formatRelativeTime(report.created_at)}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Reporter */}
        <Section icon={Flag} title={t('adminMod.reporter')}>
          <UserRow user={report.complainant} />
        </Section>

        {/* Subject */}
        {report.report_type === 'listing' ? (
          <Section icon={Package} title={t('adminMod.reportedListing')}>
            <div className="rounded-xl bg-bg-subtle p-3">
              <p className="text-sm font-semibold text-fg">
                {report.listing?.title ?? '—'}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                #{report.listing?.public_id ?? '—'}
              </p>
            </div>
            {report.reported_user ? (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  {t('adminMod.listingOwner')}
                </p>
                <UserRow user={report.reported_user} showStatus />
              </div>
            ) : null}
          </Section>
        ) : (
          <Section icon={UserIcon} title={t('adminMod.reportedSeller')}>
            {report.reported_user
              ? <UserRow user={report.reported_user} showStatus />
              : <p className="text-sm text-fg-muted">—</p>}
          </Section>
        )}

        {/* Description */}
        {report.description ? (
          <Section icon={AlertTriangle} title={t('adminMod.description')}>
            <p className="whitespace-pre-line rounded-xl bg-bg-subtle p-3 text-sm text-fg">
              {report.description}
            </p>
          </Section>
        ) : null}

        {/* Resolution */}
        {isResolved && report.resolution_notes ? (
          <Section icon={ShieldCheck} title={t('adminMod.moderatorNotes')}>
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
              <p className="whitespace-pre-line">{report.resolution_notes}</p>
              {report.resolved_by ? (
                <p className="mt-2 text-xs text-emerald-700/80">
                  {t('adminMod.resolvedBy')}: {report.resolved_by.full_name}
                  {' · '}
                  {report.resolved_at ? formatRelativeTime(report.resolved_at) : ''}
                </p>
              ) : null}
            </div>
          </Section>
        ) : null}

        {/* Actions */}
        {!isResolved ? (
          <Section icon={ShieldQuestion} title={t('adminMod.takeAction')}>
            <textarea
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              placeholder={t('adminMod.notesPlaceholder')}
              className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
            />

            {/* When the reason is "other" the auto-assigned severity is meaningless;
                require admin to set a real severity before accepting the report. */}
            {report.reason_code === 'other' ? (
              <div className="mt-3 rounded-xl border border-border bg-bg-subtle/50 p-3">
                <p className="mb-2 text-xs font-semibold text-fg-subtle">
                  {t('adminMod.severityFromAdmin' as any) ?? "Sababingiz «boshqa» bo'lgani uchun darajani siz belgilang:"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((s) => {
                    const active = severityChoice === s;
                    const tone = SEVERITY_VISUAL[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverityChoice(s)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold ring-1 transition',
                          active ? `${tone.bg} ${tone.fg}` : 'bg-bg ring-border text-fg-subtle hover:bg-bg-subtle',
                        )}
                      >
                        {t(`report.severity.${s}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {outcomeError ? (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{outcomeError}</span>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {report.status === 'pending' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onStartReview}
                  isLoading={acting === 'start'}
                >
                  <ShieldAlert className="mr-1.5 h-4 w-4" />
                  {t('adminMod.startReview')}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="primary"
                onClick={onResolveValid}
                isLoading={acting === 'valid'}
                disabled={
                  moderatorNotes.trim().length < 5 ||
                  (report.reason_code === 'other' && !severityChoice)
                }
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {t('adminMod.resolveValid')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onResolveInvalid}
                isLoading={acting === 'invalid'}
                disabled={moderatorNotes.trim().length < 5}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                {t('adminMod.resolveInvalid')}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-fg-subtle">
              {t('adminMod.notesRequiredHint')}
            </p>
          </Section>
        ) : null}
      </div>
    </motion.div>
  );
}

function Section({
  icon: Icon, title, children,
}: { icon: typeof Flag; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function UserRow({
  user,
  showStatus,
}: {
  user: { public_id: number; full_name: string; avatar_url?: string; phone?: string | null; status?: string };
  showStatus?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-bg-subtle p-3">
      <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg">{user.full_name}</p>
        <p className="truncate text-xs text-fg-muted">
          #{user.public_id}
          {user.phone ? ` · ${user.phone}` : ''}
        </p>
      </div>
      {showStatus && user.status ? <SellerStatusBadge status={user.status} /> : null}
    </div>
  );
}
