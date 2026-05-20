'use client';

/**
 * Admin Listing Detail.
 *
 * Full record view for moderation: hero image, full description with
 * inline TranslateButton, seller card with status, statistics, related
 * reports (with TranslateButton on the report text), and inline action
 * controls — Approve, Reject (with reason), Restore, Mark sold.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Heart,
  Share2,
  MessageSquareText,
  ShieldAlert,
  RefreshCw,
  Loader2,
  Flag,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { TranslatableText, TranslateButton } from '@/components/shared/TranslateButton';
import { listingsApi, type ListingDetail } from '@/lib/api/listings';
import { moderationApi, type AdminReportRecord } from '@/lib/api/moderation';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';

export default function AdminListingDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reports, setReports] = useState<AdminReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | 'restore' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [detail, reportsResp] = await Promise.all([
        listingsApi.detail(id),
        moderationApi
          .adminList({ report_type: 'listing', page_size: 50 })
          .catch(() => ({ results: [], count: 0, page: 1, page_size: 0 })),
      ]);
      setListing(detail ?? null);
      // Filter on the client to those reports targeting THIS listing public_id.
      const all = (reportsResp as any)?.results ?? [];
      const filtered = all.filter((r: any) => r?.listing?.public_id === id);
      setReports(filtered);
    } catch {
      setListing(null);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(id)) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const approve = async () => {
    if (!listing) return;
    setSubmitting('approve');
    try {
      await listingsApi.approve(id);
      toast.success(t('success.approved' as any) ?? t('success.updated'));
      await fetchAll();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const reject = async () => {
    if (!listing) return;
    if (!rejectionReason.trim()) {
      toast.error(t('admin.rejectionReasonRequired' as any) ?? 'Reason required');
      return;
    }
    setSubmitting('reject');
    try {
      await listingsApi.reject(id, rejectionReason.trim());
      toast.success(t('success.rejected' as any) ?? t('success.updated'));
      setShowRejectBox(false);
      setRejectionReason('');
      await fetchAll();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const restore = async () => {
    if (!listing) return;
    setSubmitting('restore');
    try {
      await listingsApi.restore(id);
      toast.success(t('success.updated'));
      await fetchAll();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const heroImage = useMemo(() => {
    const img = listing?.images?.[0] || listing?.primary_image;
    return img?.image_url || img?.image || null;
  }, [listing]);

  return (
    <AdminLayout>
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
        ) : !listing ? (
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
            {/* Main column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Hero */}
              <div className="surface-elevated overflow-hidden">
                {heroImage ? (
                  <div className="relative aspect-[16/9] w-full bg-bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroImage} alt={listing.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full bg-bg-subtle" />
                )}

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h1 className="display-sm">{listing.title}</h1>
                      <p className="mt-1 text-sm text-fg-muted">
                        {listing.location} · {formatRelativeTime(listing.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        listing.status === 'active' ? 'success'
                        : listing.status === 'rejected' ? 'error'
                        : listing.status === 'sold' ? 'info'
                        : 'warning'
                      }
                      size="md"
                    >
                      {t(`listings.${listing.status}` as any)}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-baseline gap-2">
                    <span className="display-md text-brand-primary">
                      {formatPrice(listing.price, listing.currency)}
                    </span>
                    {listing.is_negotiable && (
                      <span className="text-sm text-fg-subtle">
                        · {t('listings.negotiable')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description with TranslateButton */}
              <div className="surface-elevated p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="display-sm">{t('listings.description')}</h2>
                </div>
                <TranslatableText
                  text={listing.description || ''}
                  textClassName="whitespace-pre-line text-pretty leading-[1.75] text-fg-muted"
                />
              </div>

              {/* Specs */}
              {(listing.breed || listing.weight_kg || listing.age_years || listing.gender) && (
                <div className="surface-elevated p-6">
                  <h2 className="display-sm mb-4">{t('listings.specifications')}</h2>
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {listing.breed && (
                      <div>
                        <dt className="text-xs text-fg-subtle">{t('listings.breed')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-fg">{listing.breed}</dd>
                      </div>
                    )}
                    {listing.gender && (
                      <div>
                        <dt className="text-xs text-fg-subtle">{t('listings.gender')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-fg">{t(`listings.${listing.gender}` as any)}</dd>
                      </div>
                    )}
                    {listing.age_years != null && (
                      <div>
                        <dt className="text-xs text-fg-subtle">{t('listings.age')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-fg">
                          {listing.age_years}
                          {' '}
                          {t('animal.years' as any)}
                        </dd>
                      </div>
                    )}
                    {listing.weight_kg != null && (
                      <div>
                        <dt className="text-xs text-fg-subtle">{t('listings.weight')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-fg">{listing.weight_kg} kg</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Reports against this listing */}
              <div className="surface-elevated p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Flag className="h-5 w-5 text-warning" strokeWidth={1.75} />
                  <h2 className="display-sm">{t('admin.relatedReports' as any) ?? 'Reports'}</h2>
                  <Badge variant="warning" size="sm">{reports.length}</Badge>
                </div>

                {reports.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t('admin.noReports' as any) ?? '—'}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {reports.map((r) => (
                      <li key={r.public_id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Avatar src={r.complainant?.avatar_url} name={r.complainant?.full_name} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-fg">{r.complainant?.full_name}</p>
                              <p className="text-xs text-fg-subtle">{formatRelativeTime(r.created_at)}</p>
                            </div>
                          </div>
                          <Badge
                            variant={r.status === 'pending' ? 'warning' : r.status === 'resolved_valid' ? 'success' : 'default'}
                            size="sm"
                          >
                            {t(`adminMod.status_${r.status}` as any) ?? r.status}
                          </Badge>
                        </div>
                        {r.description && (
                          <div className="mt-3">
                            <TranslatableText
                              text={r.description}
                              textClassName="text-sm text-fg-muted leading-relaxed"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Seller card */}
              <div className="surface-elevated p-6">
                <h3 className="text-eyebrow">{t('listings.seller')}</h3>
                <Link href={`/sellers/${listing.seller.public_id}`} className="mt-3 flex items-center gap-3 group">
                  <Avatar src={listing.seller.avatar_url} name={listing.seller.full_name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-fg group-hover:text-brand-primary truncate">{listing.seller.full_name}</p>
                    <p className="text-xs text-fg-muted truncate">{listing.seller.phone}</p>
                  </div>
                </Link>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-fg">{listing.seller.active_listings_count ?? 0}</p>
                    <p className="text-xs text-fg-subtle">{t('listings.active')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-fg">{listing.seller.sold_listings_count ?? 0}</p>
                    <p className="text-xs text-fg-subtle">{t('listings.sold')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-fg">{listing.seller.followers_count ?? 0}</p>
                    <p className="text-xs text-fg-subtle">{t('sellers.followers' as any) ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="surface-elevated p-6">
                <h3 className="text-eyebrow">{t('admin.stats' as any) ?? 'Stats'}</h3>
                <dl className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-sm text-fg-muted"><Eye className="h-4 w-4" strokeWidth={1.75}/> {t('marketplace.views')}</dt>
                    <dd className="text-sm font-semibold text-fg">{listing.view_count ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-sm text-fg-muted"><Heart className="h-4 w-4" strokeWidth={1.75}/> {t('nav.favorites')}</dt>
                    <dd className="text-sm font-semibold text-fg">{listing.favorite_count ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-sm text-fg-muted"><Share2 className="h-4 w-4" strokeWidth={1.75}/> {t('marketplace.shares' as any) ?? '—'}</dt>
                    <dd className="text-sm font-semibold text-fg">{listing.share_count ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-sm text-fg-muted"><MessageSquareText className="h-4 w-4" strokeWidth={1.75}/> {t('comments.title' as any) ?? 'Comments'}</dt>
                    <dd className="text-sm font-semibold text-fg">{listing.comment_count ?? 0}</dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="surface-elevated p-6">
                <h3 className="text-eyebrow">{t('admin.actions' as any) ?? 'Actions'}</h3>
                <div className="mt-3 space-y-2">
                  {(listing.status === 'pending' || listing.status === 'pending_review') && (
                    <button
                      type="button"
                      onClick={approve}
                      disabled={submitting !== null}
                      className="btn btn-primary w-full"
                    >
                      {submitting === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2}/> : <CheckCircle2 className="h-4 w-4" strokeWidth={2.25}/>}
                      {t('admin.approve')}
                    </button>
                  )}

                  {(listing.status === 'pending' || listing.status === 'pending_review' || listing.status === 'active') && (
                    <button
                      type="button"
                      onClick={() => setShowRejectBox((v) => !v)}
                      disabled={submitting !== null}
                      className="btn btn-secondary w-full"
                    >
                      <XCircle className="h-4 w-4" strokeWidth={2.25}/>
                      {t('admin.reject')}
                    </button>
                  )}

                  {(listing.status === 'sold' || listing.status === 'expired' || listing.status === 'rejected' || listing.status === 'archived') && (
                    <button
                      type="button"
                      onClick={restore}
                      disabled={submitting !== null}
                      className="btn btn-secondary w-full"
                    >
                      {submitting === 'restore' ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2}/> : <RefreshCw className="h-4 w-4" strokeWidth={2}/>}
                      {t('admin.restore' as any) ?? 'Restore'}
                    </button>
                  )}

                  {showRejectBox && (
                    <div className="mt-3 space-y-2">
                      <label className="text-xs text-fg-subtle">{t('admin.rejectionReason' as any) ?? 'Reason'}</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="input-base h-auto w-full py-2"
                        placeholder={t('admin.rejectionReasonPlaceholder' as any) ?? ''}
                      />
                      <button
                        type="button"
                        onClick={reject}
                        disabled={submitting === 'reject' || !rejectionReason.trim()}
                        className="btn btn-danger w-full"
                      >
                        {submitting === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2}/> : <ShieldAlert className="h-4 w-4" strokeWidth={2.25}/>}
                        {t('admin.confirmReject' as any) ?? t('admin.reject')}
                      </button>
                    </div>
                  )}

                  {listing.status === 'rejected' && listing.rejection_reason && (
                    <div className="mt-4 rounded-xl border border-danger/30 bg-danger/8 p-3 text-sm text-fg">
                      <p className="text-xs font-semibold text-danger uppercase tracking-wide">
                        {t('admin.rejectionReason' as any) ?? 'Rejection reason'}
                      </p>
                      <p className="mt-1 text-fg-muted">{listing.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
