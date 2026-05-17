'use client';

/**
 * ReportDialog — production complaint submission UI for the website.
 *
 * Used to submit either a listing report or a seller report.
 *  - Loads the reason catalogue from /api/moderation/v2/reasons/
 *  - Shows reasons appropriate to the report type
 *  - Description required if reason = "other" (min 10 chars)
 *  - Severity badge per reason, fully translated
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
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
  | { kind: 'seller'; publicId: number; fullName?: string };

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
        setReasons(target.kind === 'listing' ? cat.listing_reasons : cat.seller_reasons);
      })
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  }, [open, target, t]);

  const requiresDescription = reasonCode === 'other';
  const canSubmit =
    !!reasonCode &&
    !submitting &&
    (!requiresDescription || description.trim().length >= 10);

  const onSubmit = async () => {
    if (!target || !reasonCode) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = { reason_code: reasonCode, description: description.trim() || undefined };
      if (target.kind === 'listing') {
        await moderationApi.reportListing(target.publicId, payload);
      } else {
        await moderationApi.reportSeller(target.publicId, payload);
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

  const title = target.kind === 'listing' ? t('report.titleListing') : t('report.titleSeller');
  const subjectLabel =
    target.kind === 'listing' ? t('report.subjectListing') : t('report.subjectSeller');
  const subjectName =
    target.kind === 'listing'
      ? target.title ?? `#${target.publicId}`
      : target.fullName ?? `#${target.publicId}`;

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {/* Subject preview */}
        <div className="rounded-xl bg-bg-subtle px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-fg-muted">{subjectLabel}</div>
          <div className="truncate font-semibold text-fg">{subjectName}</div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-brand-accent" />
            <h3 className="mt-3 text-lg font-bold">{t('report.successTitle')}</h3>
            <p className="mt-1 max-w-sm text-sm text-fg-muted">{t('report.successBody')}</p>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">{t('report.chooseReason')}</p>
              {loading ? (
                <p className="py-3 text-sm text-fg-muted">{t('common.loading')}</p>
              ) : (
                <div className="grid gap-2">
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
                        <span className="flex-1 text-sm font-medium text-fg">
                          {t(`report.reasons.${r.code}`)}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
                            SEVERITY_CLASSES[r.default_severity],
                          )}
                        >
                          {t(`report.severity.${r.default_severity}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

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
                className="min-h-[96px] w-full resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                rows={4}
              />
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

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
