'use client';

/**
 * ReportDialog — unified complaint submission modal.
 *
 * Supports 3 contexts:
 *   - listing  → listing-specific reasons
 *   - seller   → seller-specific reasons
 *   - chat     → chat/message-specific reasons
 *
 * Rules:
 *   - "other" reason always requires a non-empty description (≥10 chars)
 *   - Each reason shows its severity badge
 *   - On success auto-closes after 1.6s
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Flag, MessageSquareText, Package, ShieldAlert, User as UserIcon, MessageSquare, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  moderationApi,
  type ReportReason,
  type ReportSeverity,
} from '@/lib/api/moderation';
import { cn } from '@/lib/utils/cn';

export type ReportTarget =
  | { kind: 'listing'; publicId: number; title?: string }
  | { kind: 'seller'; publicId: number; fullName?: string }
  | { kind: 'chat'; publicId: number; fullName?: string }
  | { kind: 'comment'; publicId: number | string; fullName?: string }
  | { kind: 'rating'; publicId: number | string; fullName?: string };

interface Props {
  open: boolean;
  target: ReportTarget | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

const SEVERITY_CLASSES: Record<ReportSeverity, string> = {
  low:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium:   'bg-amber-50 text-amber-700 ring-amber-200',
  high:     'bg-orange-50 text-orange-700 ring-orange-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
};

const KIND_ICON = {
  listing: Package,
  seller: UserIcon,
  chat: MessageSquareText,
  comment: MessageSquare,
  rating: Star,
};

export function ReportDialog({ open, target, onClose, onSubmitted }: Props) {
  const t = useTranslations();
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !target) return;
    setReasonCode(null);
    setDescription('');
    setSubmitted(false);
    setError(null);
    setLoading(true);
    moderationApi
      .getReasons()
      .then((cat) => {
        if (target.kind === 'listing') setReasons(cat.listing_reasons);
        else if (target.kind === 'seller') setReasons(cat.seller_reasons);
        else setReasons(cat.chat_reasons ?? []);
      })
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  }, [open, target, t]);

  const requiresDescription = reasonCode === 'other';
  const descriptionFilled = description.trim().length >= 10;
  const canSubmit =
    !!reasonCode &&
    !submitting &&
    (!requiresDescription || descriptionFilled);

  const onSubmit = async () => {
    if (!target || !reasonCode) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        reason_code: reasonCode,
        description: description.trim() || undefined,
      };
      if (target.kind === 'listing') {
        await moderationApi.reportListing(target.publicId, payload);
      } else if (target.kind === 'seller') {
        await moderationApi.reportSeller(target.publicId, payload);
      } else if (target.kind === 'comment') {
        await moderationApi.reportComment(target.publicId as number, payload);
      } else if ((target as any).kind === 'rating') {
        await moderationApi.reportRating(target.publicId as number, payload);
      } else {
        await moderationApi.reportChat(target.publicId as number, payload);
      }
      setSubmitted(true);
      onSubmitted?.();
      setTimeout(() => onClose(), 1600);
    } catch (e: any) {
      const code = e?.response?.data?.error;
      if (code === 'cannot_report_self') setError(t('report.errorSelf'));
      else if (code === 'cannot_report_own_listing') setError(t('report.errorOwn'));
      else setError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!target) return null;

  const KindIcon = KIND_ICON[target.kind] ?? MessageSquare;

  const titleKey =
    target.kind === 'listing' ? 'report.titleListing' :
    target.kind === 'seller'  ? 'report.titleSeller' :
    target.kind === 'comment' ? 'report.titleComment' :
    (target as any).kind === 'rating' ? 'report.titleRating' :
                                'report.titleChat';
  const title = t(titleKey as any) ?? (target.kind === 'comment' ? 'Izohni shikoyat qilish' : 'Shikoyat');

  const subjectName =
    target.kind === 'listing' ? (target.title ?? `#${target.publicId}`) :
                                ((target as any).fullName ?? `#${target.publicId}`);

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {/* Subject preview */}
        <div className="flex items-center gap-2.5 rounded-xl bg-bg-subtle px-3 py-2">
          <KindIcon className="h-4 w-4 flex-shrink-0 text-fg-muted" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-fg-muted capitalize">
              {target.kind}
            </div>
            <div className="truncate text-sm font-semibold text-fg">{subjectName}</div>
          </div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-brand-accent" />
            <h3 className="mt-3 text-lg font-bold">{t('report.successTitle')}</h3>
            <p className="mt-1 max-w-sm text-sm text-fg-muted">{t('report.successBody')}</p>
          </div>
        ) : (
          <>
            {/* Reason list */}
            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">{t('report.chooseReason')}</p>
              {loading ? (
                <p className="py-3 text-sm text-fg-muted">{t('common.loading')}</p>
              ) : (
                <div className="grid gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {reasons.map((r) => {
                    const active = reasonCode === r.code;
                    return (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => setReasonCode(r.code)}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                          active
                            ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/30'
                            : 'border-border hover:bg-bg-subtle',
                        )}
                      >
                        <span className="flex-1 text-sm font-medium text-fg break-words text-left leading-snug pe-2">
                          {t(`report.reasons.${r.code}` as any) ?? r.code}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 flex-shrink-0',
                            SEVERITY_CLASSES[r.default_severity],
                          )}
                        >
                          {t(`report.severity.${r.default_severity}` as any) ?? r.default_severity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">
                {requiresDescription
                  ? t('report.descriptionRequired')
                  : t('report.descriptionOptional')}
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('report.descriptionPlaceholder')}
                className={cn(
                  'min-h-[88px] w-full resize-none rounded-xl border bg-bg-subtle px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand-accent/40',
                  requiresDescription && !descriptionFilled && description.length > 0
                    ? 'border-danger/50'
                    : 'border-border',
                )}
                rows={3}
              />
              {requiresDescription && !descriptionFilled && description.length > 0 && (
                <p className="mt-1 text-xs text-danger">
                  {t('report.descriptionMinLength' as any) ?? 'At least 10 characters required'}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="button"
              size="lg"
              fullWidth
              onClick={onSubmit}
              disabled={!canSubmit}
              isLoading={submitting}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              {t('report.submit')}
            </Button>
            <p className="text-center text-xs text-fg-subtle">{t('report.privacyNote')}</p>
          </>
        )}
      </div>
    </Modal>
  );
}
