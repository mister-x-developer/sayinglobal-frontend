'use client';

import { Suspense,  useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Star,
  Users,
  Package,
  TrendingUp,
  Calendar,
  MessageSquareText,
  ArrowLeft,
  Clock,
  Flag,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { FollowButton } from '@/components/sellers/FollowButton';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { SellerRatingsThread } from '@/components/sellers/SellerRatingsThread';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { TranslatableText } from '@/components/shared/TranslateButton';
import { usersApi } from '@/lib/api/users';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { useAuthStore } from '@/lib/store/auth';

type Tab = 'listings' | 'reviews';

function SellerDetailPageContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id') ?? 0);
  const { user } = useAuthStore();

  const [seller, setSeller] = useState<any | null>(null);
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  const [tab, setTab] = useState<Tab>('listings');
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);

    (async () => {
      const [apiSeller, apiListings] = await Promise.all([
        usersApi.detail(id),
        listingsApi.list({}).then((r) => r.results).catch(() => []),
      ]);

      if (!alive) return;

      setSeller(apiSeller ?? null);

      const real = (apiListings ?? []).filter((l: any) => l.seller?.id === id);
      setSellerListings(real);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [id]);

  const stats = useMemo(() => {
    if (!seller) return [];
    return [
      {
        icon: Package,
        label: t('profile.activeListings'),
        value: seller.active_listings_count ?? sellerListings.length,
      },
      {
        icon: TrendingUp,
        label: t('profile.soldListings'),
        value: seller.sold_listings_count ?? 0,
      },
      {
        icon: Users,
        label: t('profile.followers'),
        value: seller.followers_count ?? 0,
      },
      {
        icon: Star,
        label: t('sellers.rating'),
        value:
          (seller as any).rating_count > 0 && Number(seller.trust_score) > 0
            ? `${Number(seller.trust_score).toFixed(1)} (${(seller as any).rating_count})`
            : `— (${(seller as any).rating_count ?? 0})`,
      },
    ];
  }, [seller, sellerListings.length, t]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page pt-4 pb-24 sm:pt-6 sm:pb-16"> {/* extra mobile bottom padding for full visibility above bottom nav */}
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm -ml-2"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            {t('common.back')}
          </button>

          {loading ? (
            <div className="mt-6 space-y-4">
              <div className="surface-elevated p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="skeleton h-24 w-24 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-6 w-48" />
                    <div className="skeleton mt-3 h-4 w-full" />
                    <div className="skeleton mt-2 h-4 w-2/3" />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="surface-elevated h-24" />
                ))}
              </div>
            </div>
          ) : !seller ? (
            <div className="mt-12">
              <EmptyState
                icon={Users}
                title={t('errors.notFound')}
                description={t('errors.notFoundDescription')}
              />
            </div>
          ) : (
            <>
              {/* HEADER */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="surface-elevated mt-4 p-4 sm:p-6 sm:p-8"
              >
                <div className="flex flex-col gap-4 sm:p-6 md:flex-row md:items-start">
                  <Avatar
                    src={seller.avatar_url}
                    name={seller.full_name}
                    size="2xl"
                    ring
                    enlargeable
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h1 className="display-md">{seller.full_name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
                          <RatingDisplay
                            score={seller.trust_score}
                            count={(seller as any).rating_count}
                            size="md"
                          />
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" strokeWidth={1.75} />
                            {t('profile.memberSince', { date: '2023' })}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4" strokeWidth={1.75} />
                            ~2h
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {user?.public_id !== seller.id && !(user?.is_admin || user?.is_staff) && (
                          <Link
                            href={`/chat?with=${seller.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            <MessageSquareText className="h-4 w-4" strokeWidth={1.75} />
                            {t('sellers.message')}
                          </Link>
                        )}
                        {!(user?.is_admin || user?.is_staff) && (
                        <FollowButton sellerId={seller.id} size="sm" />
                        )}
                        {!(user?.is_admin || user?.is_staff) && (
                        <button
                          type="button"
                          onClick={() => setReportOpen(true)}
                          className="btn btn-ghost btn-sm text-danger hover:bg-danger/10"
                          aria-label={t('common.report')}
                        >
                          <Flag className="h-4 w-4" strokeWidth={1.75} />
                          {t('common.report')}
                        </button>
                        )}
                      </div>
                    </div>

                    {seller.bio && (
                      <TranslatableText
                        text={seller.bio}
                        className="mt-4 max-w-2xl"
                        textClassName="text-pretty leading-relaxed text-fg-muted"
                      />
                    )}
                  </div>
                </div>
              </motion.section>

              {/* STATS */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.04 * i }}
                      className="surface-elevated flex items-center gap-4 p-4 sm:p-5"
                    >
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-fg-subtle">{s.label}</p>
                        <p className="font-display text-2xl font-bold text-fg">{s.value}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* TABS — scrollable on mobile so full labels visible */}
              <div className="mt-6 overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:mt-8 sm:px-0">
                <div className="flex gap-1 border-b border-border min-w-max sm:min-w-0">
                  {[
                    { key: 'listings', label: t('listings.title') },
                    { key: 'reviews', label: t('sellers.reviews') },
                  ].map((tt) => {
                    const active = tab === (tt.key as Tab);
                    return (
                      <button
                        key={tt.key}
                        type="button"
                        onClick={() => setTab(tt.key as Tab)}
                        className={`relative h-11 flex-shrink-0 snap-start px-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                          active ? 'text-brand-primary' : 'text-fg-muted hover:text-fg'
                        }`}
                      >
                        {tt.label}
                        {active && (
                          <motion.span
                            layoutId="seller-tab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TAB CONTENT */}
              <div className="mt-6">
                {tab === 'listings' &&
                  (sellerListings.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title={t('profile.noListings')}
                      description={t('empty.noListingsDescription')}
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {sellerListings.map((l) => (
                        <ListingCard key={l.id} listing={l as any} />
                      ))}
                    </div>
                  ))}

                {tab === 'reviews' && (
                  <SellerRatingsThread sellerPublicId={id} />
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <ReportDialog
        open={reportOpen}
        target={seller ? { kind: 'seller', publicId: seller.id, fullName: seller.full_name } : null}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}


export default function SellerDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-8"><div className="spinner"></div></div>}>
      <SellerDetailPageContent />
    </Suspense>
  );
}
