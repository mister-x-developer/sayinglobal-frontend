'use client';

/**
 * Public seller review/comment system.
 *
 * - Star rating (1-5) + public written review with auto-translation
 * - Reply / threaded discussion
 * - Edit + delete own review
 * - Helpful (one vote per user)
 * - Report (spam / abuse / off-topic)
 * - Sort: newest / highest / lowest / most useful
 * - Translate button on every review (TranslatableText)
 * - Aggregate panel (avg score + count)
 *
 * Read-only when the viewer is unauthenticated.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Star,
  MessageSquareText,
  Loader2,
  ThumbsUp,
  Flag,
  Edit2,
  Trash2,
  Send,
  CornerDownRight,
  CheckCircle2,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { TranslatableText } from '@/components/shared/TranslateButton';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { toast } from '@/components/ui/Toast';
import { ratingsApi, type RatingRecord } from '@/lib/api/ratings';
import { useAuthStore } from '@/lib/store/auth';
import { formatRelativeTime } from '@/lib/utils/format';

type SortMode = 'newest' | 'highest' | 'lowest' | 'most_useful';

interface ThreadProps {
  sellerPublicId: number;
  /** Optional listing context — when supplied, "Write a review" button posts
   *  with this listing attached so it can be linked from the seller profile. */
  listingPublicId?: number;
}

export function SellerRatingsThread({ sellerPublicId, listingPublicId }: ThreadProps) {
  const t = useTranslations();
  const locale = useLocale();
  const me = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [items, setItems] = useState<RatingRecord[]>([]);
  const [count, setCount] = useState(0);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>('newest');

  const [showCompose, setShowCompose] = useState(false);
  const [composeScore, setComposeScore] = useState(5);
  const [composeBody, setComposeBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reportTarget, setReportTarget] = useState<any>(null);

  const isSelfSeller = me?.public_id === sellerPublicId;

  const ownReview = useMemo(
    () => items.find((r) => r.buyer?.public_id === me?.public_id && !r.parent),
    [items, me?.public_id],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ratingsApi.list(sellerPublicId, { sort, pageSize: 50 });
      setItems(data.results);
      setCount(data.count);
      setAverage(data.average_score);
    } catch {
      setItems([]);
      setCount(0);
      setAverage(0);
    } finally {
      setLoading(false);
    }
  }, [sellerPublicId, sort]);

  useEffect(() => { reload(); }, [reload]);

  const handleSubmit = async () => {
    if (!composeBody.trim() && !editingId) {
      toast.error(t('errors.required'));
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await ratingsApi.update(editingId, { score: composeScore, review: composeBody.trim(), locale });
      } else {
        await ratingsApi.create({
          seller: sellerPublicId,
          listing: listingPublicId,
          score: composeScore,
          review: composeBody.trim(),
          locale,
        });
      }
      setShowCompose(false);
      setEditingId(null);
      setComposeBody('');
      setComposeScore(5);
      await reload();
      toast.success(t('reviews.posted' as any) ?? 'Review posted');
    } catch (err: any) {
      const code = err?.response?.data?.error || '';
      if (code === 'cannot_rate_self') {
        toast.error(t('reviews.cannotRateSelf' as any) ?? 'You cannot review yourself');
      } else {
        toast.error(t('errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (r: RatingRecord) => {
    setEditingId(r.public_id);
    setComposeScore(r.score || 5);
    setComposeBody(r.review || '');
    setShowCompose(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.delete') + '?')) return;
    try {
      await ratingsApi.remove(id);
      await reload();
      toast.success(t('success.deleted' as any) ?? t('success.updated'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleHelpful = async (r: RatingRecord) => {
    try {
      const fn = r.is_helpful ? ratingsApi.unhelpful : ratingsApi.helpful;
      const data = await fn(r.public_id);
      setItems((prev) => prev.map((it) =>
        it.public_id === r.public_id
          ? { ...it, is_helpful: data.is_helpful, helpful_count: data.helpful_count }
          : it,
      ));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleReport = (r: RatingRecord) => {
    setReportTarget({
      kind: 'rating',
      publicId: r.public_id,
      fullName: r.buyer?.full_name ?? (t('common.user') ?? 'User'),
    });
  };

  const handleReply = async (r: RatingRecord) => {
    const body = window.prompt(t('reviews.replyPrompt' as any) ?? 'Your reply');
    if (!body || !body.trim()) return;
    try {
      await ratingsApi.reply(r.public_id, { review: body.trim(), locale });
      await reload();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-brand-primary" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div>
      {/* Aggregate + actions */}
      <div className="surface-elevated p-5 flex flex-wrap items-center gap-4">
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="font-display text-3xl font-bold text-fg">
            {average.toFixed(1)}
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${
                  n <= Math.round(average) ? 'fill-warning text-warning' : 'text-border-strong'
                }`}
                strokeWidth={1.75}
              />
            ))}
          </div>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="flex-1 min-w-[140px]">
          <p className="text-sm text-fg-muted">{t('sellers.totalReviews' as any) ?? `${count} reviews`}</p>
          <p className="font-display text-xl font-semibold text-fg">{count}</p>
        </div>

        {isAuthenticated && !isSelfSeller && (
          <button
            type="button"
            onClick={() => {
              if (ownReview) {
                startEdit(ownReview);
              } else {
                setEditingId(null);
                setComposeBody('');
                setComposeScore(5);
                setShowCompose(true);
              }
            }}
            className="btn btn-primary btn-sm"
          >
            <Edit2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            {ownReview
              ? (t('reviews.editYourReview' as any) ?? 'Edit your review')
              : (t('reviews.writeReview' as any) ?? 'Write a review')}
          </button>
        )}
      </div>

      {/* Sort tabs */}
      {count > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(['newest', 'highest', 'lowest', 'most_useful'] as SortMode[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                s === sort
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated'
              }`}
            >
              {t(`reviews.sort_${s}` as any) ?? s}
            </button>
          ))}
        </div>
      )}

      {/* Compose */}
      {showCompose && (
        <div className="surface-elevated mt-4 p-5">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setComposeScore(n)}
                aria-label={`${n} stars`}
              >
                <Star
                  className={`h-6 w-6 ${
                    n <= composeScore ? 'fill-warning text-warning' : 'text-border-strong'
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-fg-muted">{composeScore}/5</span>
          </div>
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder={t('reviews.placeholder' as any) ?? 'Share your experience'}
            rows={4}
            className="input-base h-auto w-full mt-3 py-2"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowCompose(false); setEditingId(null); }}
              className="btn btn-secondary btn-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary btn-sm"
            >
              {submitting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                : <Send className="h-3.5 w-3.5" strokeWidth={2} />}
              {editingId ? t('common.save') : (t('reviews.post' as any) ?? 'Post')}
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {count === 0 ? (
        <div className="surface-elevated mt-4 p-8 text-center">
          <Star className="mx-auto h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
          <p className="mt-3 font-display text-lg font-semibold text-fg">
            {t('sellers.noReviews')}
          </p>
          {!isSelfSeller && (
            <p className="mt-1 text-sm text-fg-muted">
              {t('sellers.beFirstToReview')}
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((r) => (
            <RatingCard
              key={r.public_id}
              rating={r}
              myPublicId={me?.public_id}
              isSeller={isSelfSeller}
              onHelpful={() => handleHelpful(r)}
              onReply={() => handleReply(r)}
              onReport={() => handleReport(r)}
              onEdit={() => startEdit(r)}
              onDelete={() => handleDelete(r.public_id)}
            />
          ))}
        </ul>
      )}

      <ReportDialog
        open={!!reportTarget}
        target={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmitted={() => reload()}
      />
    </div>
  );
}

function RatingCard({
  rating,
  myPublicId,
  isSeller,
  onHelpful,
  onReply,
  onReport,
  onEdit,
  onDelete,
}: {
  rating: RatingRecord;
  myPublicId?: number;
  isSeller: boolean;
  onHelpful: () => void;
  onReply: () => void;
  onReport: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const isAuthor = rating.buyer?.public_id === myPublicId;

  // Always feed the original review text to TranslatableText so the
  // "translate" button actually switches between author wording and UI-lang version.
  // (Pre-translated review_xx exist but on-demand client translate makes the
  // toggle button functional and consistent with comments.)

  return (
    <li className="surface-elevated p-4">
      <div className="flex items-start gap-3">
        <Avatar src={rating.buyer?.avatar_url} name={rating.buyer?.full_name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-fg">{rating.buyer?.full_name ?? '—'}</p>
            <span className="text-xs text-fg-subtle">{formatRelativeTime(rating.created_at)}</span>
            {rating.is_edited && (
              <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
                · {t('reviews.edited' as any) ?? 'edited'}
              </span>
            )}
          </div>
          {rating.score > 0 && (
            <div className="mt-1 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-3.5 w-3.5 ${
                    n <= rating.score ? 'fill-warning text-warning' : 'text-border-strong'
                  }`}
                  strokeWidth={1.75}
                />
              ))}
            </div>
          )}
          {rating.review ? (
            <div className="mt-2">
              <TranslatableText
                text={rating.review}
                sourceLocale={rating.original_locale}
                textClassName="text-sm leading-relaxed text-fg-muted whitespace-pre-line"
              />
            </div>
          ) : null}
          {rating.listing_title && rating.listing_public_id && (
            <a
              href={`/listings/detail?id=${rating.listing_public_id}`}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] text-fg-muted hover:underline"
            >
              <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
              {rating.listing_title}
            </a>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={onHelpful}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-colors ${
                rating.is_helpful
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated'
              }`}
            >
              <ThumbsUp className="h-3 w-3" strokeWidth={2} />
              {rating.helpful_count ?? 0}
              <span className="hidden sm:inline ml-0.5">
                {t('reviews.helpful' as any) ?? 'Helpful'}
              </span>
            </button>

            {isSeller && !isAuthor && rating.parent === null && (
              <button
                type="button"
                onClick={onReply}
                className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2.5 py-1 font-semibold text-fg-muted hover:bg-bg-elevated"
              >
                <CornerDownRight className="h-3 w-3" strokeWidth={2} />
                {t('reviews.reply' as any) ?? 'Reply'}
              </button>
            )}

            {!isAuthor && (
              <button
                type="button"
                onClick={onReport}
                className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2.5 py-1 font-semibold text-fg-muted hover:bg-bg-elevated"
              >
                <Flag className="h-3 w-3" strokeWidth={2} />
                {t('common.report' as any) ?? 'Report'}
              </button>
            )}

            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2.5 py-1 font-semibold text-fg-muted hover:bg-bg-elevated"
                >
                  <Edit2 className="h-3 w-3" strokeWidth={2} />
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 font-semibold text-danger hover:bg-danger/15"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2} />
                  {t('common.delete')}
                </button>
              </>
            )}
          </div>

          {/* Replies */}
          {rating.replies && rating.replies.length > 0 && (
            <ul className="mt-3 space-y-2 border-l-2 border-border pl-3">
              {rating.replies.map((rep) => (
                <li key={rep.public_id} className="flex items-start gap-2">
                  <Avatar src={rep.buyer?.avatar_url} name={rep.buyer?.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-fg">{rep.buyer?.full_name}</p>
                      {rep.buyer?.public_id === rating.seller?.public_id && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-accent/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-accent">
                          <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} />
                          {t('reviews.sellerBadge' as any) ?? 'Seller'}
                        </span>
                      )}
                      <span className="text-[10px] text-fg-subtle">{formatRelativeTime(rep.created_at)}</span>
                    </div>
                    <TranslatableText
                      text={rep.review || ''}
                      sourceLocale={rep.original_locale}
                      textClassName="text-xs text-fg-muted whitespace-pre-line"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
