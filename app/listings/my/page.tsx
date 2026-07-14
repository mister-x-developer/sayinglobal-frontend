'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  Eye,
  Heart,
  MessageSquareText,
  Edit,
  Trash2,
  Package,
  CheckCircle2,
  Clock,
  MoreVertical,
  AlertCircle,
  Timer,
  ShoppingCart,
  X,
  ArrowUp,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Badge } from '@/components/ui/Badge';
import { ListingImage } from '@/components/listings/ListingImage';
import { EmptyState } from '@/components/shared/EmptyState';
import { TranslatableText } from '@/components/shared/TranslateButton';
import { useAuthStore } from '@/lib/store/auth';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { formatPrice, formatRelativeTime, getLocalizedListingTitle } from '@/lib/utils/format';
import apiClient from '@/lib/api/client';
import { toast } from '@/components/ui/Toast';

type StatusFilter = 'all' | 'active' | 'pending' | 'sold' | 'rejected' | 'expired';

const STATUS_CONFIG: Record<string, { variant: any; labelKey: string; icon: any }> = {
  active:         { variant: 'success',  labelKey: 'listings.active',   icon: CheckCircle2 },
  pending:        { variant: 'warning',  labelKey: 'listings.pending',  icon: Clock },
  pending_review: { variant: 'warning',  labelKey: 'listings.pending',  icon: Clock },
  sold:           { variant: 'info',     labelKey: 'listings.sold',     icon: ShoppingCart },
  rejected:       { variant: 'danger',   labelKey: 'listings.rejected', icon: X },
  expired:        { variant: 'neutral',  labelKey: 'listings.expired',  icon: Timer },
  archived:       { variant: 'neutral',  labelKey: 'listings.archived', icon: Package },
  draft:          { variant: 'neutral',  labelKey: 'listings.draft',    icon: Edit },
};

function getRejectionReason(listing: Listing, locale: string): string {
  const l = listing as any;
  if (locale === 'uz-cyrl' && l.rejection_reason_uz_cyrl) return l.rejection_reason_uz_cyrl;
  if (locale === 'ru' && l.rejection_reason_ru) return l.rejection_reason_ru;
  if (locale === 'en' && l.rejection_reason_en) return l.rejection_reason_en;
  if (l.rejection_reason_uz) return l.rejection_reason_uz;
  return l.rejection_reason || '';
}

export default function MyListingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [soldConfirm, setSoldConfirm] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);


  useEffect(() => { setHydrated(true); }, []);
  /* auth gating handled by middleware */

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await listingsApi.my();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    setOpenMenu(null);
    setDeleteConfirm(null);
    try {
      await listingsApi.remove(id);
      setItems((prev) => prev.filter((l) => l.id !== id));
    } catch { load(); }
  };

  const handleMarkSold = async (id: number) => {
    setSoldConfirm(null);
    setOpenMenu(null);
    try {
      const result = await listingsApi.markSold(id);
      setItems((prev) =>
        prev.map((l) => l.id === id ? {
          ...l,
          status: 'sold',
          sold_at: new Date().toISOString(),
          scheduled_delete_at: result?.scheduled_delete_at ?? null,
        } : l)
      );
      toast.success(t('listings.markSoldSuccess') || 'Sotildi deb belgilandi');
    } catch { load(); }
  };

  // Normalise pending_review → pending for display purposes
  const normalise = (l: Listing) => ({
    ...l,
    status: l.status === 'pending_review' ? 'pending' : l.status,
  });

  const normalised = items.map(normalise);

  const filtered = filter === 'all'
    ? normalised
    : normalised.filter((l) => l.status === filter);

  const counts: Record<string, number> = {};
  for (const l of normalised) {
    counts[l.status] = (counts[l.status] || 0) + 1;
  }

  const FILTERS: { key: StatusFilter; labelKey: string }[] = [
    { key: 'all',      labelKey: 'common.all' },
    { key: 'active',   labelKey: 'listings.active' },
    { key: 'pending',  labelKey: 'listings.pending' },
    { key: 'sold',     labelKey: 'listings.sold' },
    { key: 'rejected', labelKey: 'listings.rejected' },
    { key: 'expired',  labelKey: 'listings.expired' },
  ];

  const stats = [
    { icon: Package,      labelKey: 'profile.activeListings',  value: counts.active || 0,  tone: 'bg-brand-primary/10 text-brand-primary' },
    { icon: CheckCircle2, labelKey: 'listings.sold',           value: counts.sold || 0,    tone: 'bg-success/12 text-success' },
    { icon: Eye,          labelKey: 'marketplace.trending',    value: items.reduce((s, l) => s + (l.view_count ?? 0), 0), tone: 'bg-info/12 text-info' },
    { icon: Heart,        labelKey: 'listings.favorites',      value: items.reduce((s, l) => s + (l.favorite_count ?? 0), 0), tone: 'bg-danger/12 text-danger' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <p className="text-eyebrow">{t('profile.myListings')}</p>
              <h1 className="display-md mt-2">{t('listings.myListings')}</h1>
              <p className="mt-2 text-fg-muted">{items.length} {t('listings.title').toLowerCase()}</p>
            </div>
            <Link href="/listings/new" className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              {t('listings.createNew')}
            </Link>
          </motion.div>

          {/* Stats */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.labelKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="surface-elevated flex items-center gap-4 p-4 sm:p-5"
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs text-fg-subtle">{t(s.labelKey as any)}</p>
                    <p className="font-display text-2xl font-bold text-fg">{s.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Filter tabs */}
          <div className="no-scrollbar mt-8 flex gap-1 overflow-x-auto border-b border-border">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = f.key === 'all' ? items.length : (counts[f.key] || 0);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`relative h-11 flex-shrink-0 px-4 text-sm font-semibold transition-colors ${
                    active ? 'text-brand-primary' : 'text-fg-muted hover:text-fgʻ
                  }`}
                >
                  {t(f.labelKey as any)}
                  {count > 0 && (
                    <span className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      active ? 'bg-brand-primary text-white' : 'bg-bg-subtle text-fg-muted'
                    }`}>
                      {count}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="my-listings-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Context banners */}
          <AnimatePresence>
            {filter === 'rejected' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden rounded-xl border border-danger/30 bg-danger/8 px-4 py-3"
              >
                <p className="text-sm font-semibold text-danger">{t('listings.rejectedNoticeTitle')}</p>
                <p className="mt-1 text-sm text-fg-muted">{t('listings.rejectedNoticeBody')}</p>
              </motion.div>
            )}
            {filter === 'pending' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden rounded-xl border border-warning/30 bg-warning/8 px-4 py-3"
              >
                <p className="text-sm font-semibold text-warning-foreground">{t('listings.pendingNoticeTitle')}</p>
                <p className="mt-1 text-sm text-fg-muted">{t('listings.pendingNoticeBody')}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="mt-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="surface-elevated flex items-start gap-4 p-4">
                    <div className="skeleton h-20 w-24 rounded-xl" />
                    <div className="flex-1">
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton mt-2 h-3 w-1/3" />
                      <div className="skeleton mt-3 h-5 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Package}
                title={t('profile.noListings')}
                description={t('empty.noListingsDescription')}
                action={
                  <Link href="/listings/new" className="btn btn-primary btn-sm">
                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                    {t('listings.createNew')}
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {filtered.map((l, i) => {
                  const cfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.active;
                  const Icon = cfg.icon;
                  const rejectionReason = l.status === 'rejected'
                    ? getRejectionReason(l, locale)
                    : '';

                  return (
                    <motion.div
                      key={l.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                      className="surface-elevated group relative flex items-start gap-4 p-4 transition-all hover:shadow-lift"
                    >
                      {/* Thumbnail */}
                      <Link href={`/listings/detail?id=${l.id}`} className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-32">
                        <ListingImage
                          src={l.images?.[0]?.image && !l.images[0].image.startsWith('/placeholder') ? l.images[0].image : null}
                          alt={l.title}
                          category={l.category?.name}
                        />
                      </Link>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <Link href={`/listings/detail?id=${l.id}`} className="font-display text-base font-semibold text-fg hover:underline line-clamp-1">
                              {getLocalizedListingTitle(l, locale)}
                            </Link>
                            <p className="mt-1 text-sm text-fg-muted">
                              {(l as any).region
                                ? `${(l as any).region}${(l as any).district ? ' · ' + (l as any).district : ''}`
                                : l.location}
                            </p>
                          </div>
                          <Badge variant={cfg.variant} size="sm" className="flex items-center gap-1">
                            <Icon className="h-3 w-3" strokeWidth={2} />
                            {t(cfg.labelKey as any)}
                          </Badge>
                        </div>

                        <p className="mt-2 font-display text-lg font-bold text-fg">
                          {formatPrice(l.price, l.currency, locale)}
                        </p>

                        {/* Rejection reason */}
                        {l.status === 'rejected' && rejectionReason && (
                          <div className="mt-2 flex flex-col gap-1.5 rounded-lg bg-danger/8 px-3 py-2">
                            <div className="flex items-start gap-1.5">
                              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-danger" strokeWidth={2} />
                              <div className="min-w-0 flex-1">
                                <TranslatableText
                                  text={rejectionReason}
                                  textClassName="text-xs text-danger leading-relaxed font-semibold"
                                />
                              </div>
                            </div>
                            <div className="ml-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-danger/80">
                              {l.rejected_at && (
                                <span>{t('listings.rejectedOn' as any) || 'Rad etilgan sana'}: {new Date(l.rejected_at).toLocaleDateString()}</span>
                              )}
                              {l.scheduled_delete_at && (
                                <span className="font-medium flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {t('listings.deletesIn' as any) || 'O\'chiriladi'}: {formatRelativeTime(l.scheduled_delete_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-fg-subtle">
                          {typeof l.view_count === 'number' && (
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                              {l.view_count}
                            </span>
                          )}
                          {typeof l.favorite_count === 'number' && (
                            <span className="inline-flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" strokeWidth={1.75} />
                              {l.favorite_count}
                            </span>
                          )}
                          {typeof l.comment_count === 'number' && (
                            <span className="inline-flex items-center gap-1">
                              <MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.75} />
                              {l.comment_count}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                            {formatRelativeTime(l.created_at)}
                          </span>
                          {l.expires_at && l.status === 'active' && (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <Timer className="h-3.5 w-3.5" strokeWidth={1.75} />
                              {formatRelativeTime(l.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions dropdown */}
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                        </button>

                        {openMenu === l.id && (
                          <>
                            <div className="fixed inset-0 z-10" role="presentation" onClick={() => setOpenMenu(null)} onKeyDown={(e) => { if (e.key === 'Escape') setOpenMenu(null); }} />
                            <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-lift">
                              <div className="p-1">
                                <Link
                                  href={`/listings/detail?id=${l.id}`}
                                  onClick={() => setOpenMenu(null)}
                                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg hover:bg-bg-subtle"
                                >
                                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                                  {t('common.view')}
                                </Link>
                                {['active', 'pending', 'pending_review', 'rejected', 'expired'].includes(l.status) && (
                                  <Link
                                    href={`/listings/${l.id}/edit`}
                                    onClick={() => setOpenMenu(null)}
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg hover:bg-bg-subtle"
                                  >
                                    <Edit className="h-4 w-4" strokeWidth={1.75} />
                                    {t('common.edit')}
                                  </Link>
                                )}
                                {l.status === 'active' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setOpenMenu(null);
                                        try {
                                          await listingsApi.bump(l.id);
                                          toast.success(t('listings.bumpSuccess' as any) || 'Listing bumped successfully');
                                          load();
                                        } catch (e) {
                                          toast.error(t('listings.bumpError' as any) || 'Failed to bump listing');
                                        }
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-brand-primary hover:bg-brand-primary/10"
                                    >
                                      <ArrowUp className="h-4 w-4" strokeWidth={1.75} />
                                      {t('listings.bump' as any) || 'Topga chiqarish'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setOpenMenu(null);
                                        try {
                                          await listingsApi.restore(l.id);
                                          toast.success(t('listings.renewSuccess' as any) || 'Listing renewed successfully');
                                          load();
                                        } catch (e) {
                                          toast.error(t('listings.renewError' as any) || 'Failed to renew listing');
                                        }
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-brand-primary hover:bg-brand-primary/10"
                                    >
                                      <Timer className="h-4 w-4" strokeWidth={1.75} />
                                      {t('listings.renew' as any) || 'Muddati uzaytirish (+30 kun)'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setOpenMenu(null); setSoldConfirm(l.id); }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-success hover:bg-success/10"
                                    >
                                      <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                                      {t('listings.markAsSold')}
                                    </button>
                                  </>
                                )}
                                {(l.status === 'sold' || l.status === 'expired') && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setOpenMenu(null);
                                      try {
                                        await listingsApi.restore(l.id);
                                        toast.success(t('listings.restoreSuccess' as any) || 'Listing restored successfully');
                                        load();
                                      } catch (e) {
                                        toast.error(t('listings.restoreError' as any) || 'Failed to restore listing');
                                      }
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-brand-primary hover:bg-brand-primary/10"
                                  >
                                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                                    {t('listings.restore' as any) || 'Tiklash / Yangilash'}
                                  </button>
                                )}
                                <div className="my-1 h-px bg-border" />
                                <button
                                  type="button"
                                  onClick={() => { setOpenMenu(null); setDeleteConfirm(l.id); }}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                                  {t('common.delete')}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mark as sold confirmation modal */}
      <AnimatePresence>
        {soldConfirm !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setSoldConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-elevated p-4 sm:p-6 shadow-lift"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/12">
                  <ShoppingCart className="h-6 w-6 text-success" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{t('listings.markAsSold')}</h3>
                  <p className="text-sm text-fg-muted">{t('listings.markAsSoldConfirm')}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSoldConfirm(null)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkSold(soldConfirm)}
                  className="btn btn-primary flex-1 bg-success hover:bg-success/90"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-elevated p-4 sm:p-6 shadow-lift"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/12">
                  <Trash2 className="h-6 w-6 text-danger" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{t('common.delete')}</h3>
                  <p className="text-sm text-fg-muted">{t('listings.deleteConfirm' as any) ?? t('common.deleteConfirm')}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm)}
                  className="btn btn-danger flex-1"
                >
                  {t('common.delete')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
