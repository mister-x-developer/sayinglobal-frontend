'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Share2,
  Flag,
  MapPin,
  Eye,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Weight,
  Dna,
  Syringe,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/auth';

import { ListingImage } from '@/components/listings/ListingImage';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { FollowButton } from '@/components/sellers/FollowButton';
import { CommentSection } from '@/components/listings/CommentThread';
import { TranslatableText, TranslateButton } from '@/components/shared/TranslateButton';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { MapView } from '@/components/shared/MapView';
import { NearbyListingsSection } from '@/components/listings/NearbyListingsSection';
import { SellerRatingsThread } from '@/components/sellers/SellerRatingsThread';
import { AgeDisplay } from '@/components/listings/AgeInput';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { formatPrice, formatRelativeTime, getLocalizedListingTitle } from '@/lib/utils/format';
import { ListingGalleryViewer } from '@/components/listings/ListingGalleryViewer';

export default function ListingDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Route params arrive as strings — convert once at the boundary
  const id = Number(searchParams.get('id') ?? 0);

  const [listing, setListing] = useState<Listing | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [shareOk, setShareOk] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [related, setRelated] = useState<Listing[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    listingsApi.detail(id).then((data) => {
      if (!alive) return;
      setListing(data);
      setFavorited(!!data?.is_favorited);
    }).finally(() => alive && setLoading(false));
    listingsApi.listComments(id).then((c) => { if (alive) setComments(c ?? []); });
    return () => { alive = false; };
  }, [id]);

  // Fetch related listings (same category, exclude current) from backend
  useEffect(() => {
    if (!listing?.category?.name || !listing.public_id) return;
    let alive = true;
    listingsApi
      .byCategory(listing.category.name)
      .then((items) => {
        if (!alive) return;
        const filtered = (items ?? [])
          .filter((l) => l.public_id !== listing.public_id)
          .slice(0, 4);
        setRelated(filtered);
      })
      .catch(() => alive && setRelated([]));
    return () => { alive = false; };
  }, [listing?.category?.name, listing?.public_id]);

  const images = listing?.images ?? [];
  const visibleImage = images[imgIndex];

  // Get localized title based on current UI locale
  const localizedTitle = listing ? getLocalizedListingTitle(listing, locale) : '';

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: localizedTitle || listing?.title, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareOk(true);
        setTimeout(() => setShareOk(false), 1800);
      }
    } catch {}
  };

  const handleFavorite = async () => {
    setFavorited((v) => !v);
    if (!listing) return;
    try { await listingsApi.toggleFavorite(listing.public_id); } catch {}
  };

  const prevImage = () => setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextImage = () => setImgIndex((i) => (i + 1) % images.length);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page pt-6 pb-nav-safe lg:pb-12">
          {/* Back */}
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            {t('common.back')}
          </button>

          {loading ? (
            <DetailSkeleton />
          ) : !listing ? (
            <div className="mt-16 text-center">
              <h1 className="display-md">{t('errors.notFound')}</h1>
              <Link href="/listings" className="btn btn-primary btn-sm mt-4">
                {t('marketplace.title')}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                {/* ── LEFT COLUMN ── */}
                <div className="space-y-6">
                  {/* Gallery */}
                  <motion.div
                    data-motion
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Main image */}
                    <div className="relative aspect-[4/3] overflow-hidden sm:rounded-2xl bg-bg-subtle -mx-4 sm:mx-0">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={imgIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 cursor-zoom-in"
                          onClick={() => setGalleryOpen(true)}
                        >
                          <ListingImage
                            src={visibleImage?.image && !visibleImage.image.startsWith('/placeholder')
                              ? visibleImage.image : null}
                            alt={listing.title}
                            category={listing.category?.name}
                            sizes="(max-width: 1024px) 100vw, 60vw"
                            priority
                          />
                        </motion.div>
                      </AnimatePresence>

                      {/* Nav arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImage}
                            aria-label={t('common.previous')}
                            className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg-elevated/88 text-fg backdrop-blur-sm transition-all hover:bg-bg-elevated hover:scale-105 active:scale-95"
                          >
                            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            aria-label={t('common.next')}
                            className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg-elevated/88 text-fg backdrop-blur-sm transition-all hover:bg-bg-elevated hover:scale-105 active:scale-95"
                          >
                            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
                          </button>
                          <div className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-bg-elevated/88 px-3 py-1.5 text-xs font-semibold text-fg backdrop-blur-sm">
                            {imgIndex + 1} / {images.length}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {images.slice(0, 5).map((img, i) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setImgIndex(i)}
                            className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                              i === imgIndex
                                ? 'border-brand-primary shadow-[0_0_0_2px_rgb(var(--brand-primary)/0.2)]'
                                : 'border-border hover:border-fg-subtle'
                            }`}
                          >
                            <ListingImage
                              src={img.image && !img.image.startsWith('/placeholder') ? img.image : null}
                              alt={`${listing.title} ${i + 1}`}
                              category={listing.category?.name}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Title & meta */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.06 }}
                    className="surface-elevated p-4 sm:p-6"
                  >
                    {listing.category && (
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-accent">
                        {listing.category.name
                          ? t(`categories.${listing.category.name}` as any) || listing.category.name_uz
                          : listing.category.name_uz}
                      </p>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h1 className="display-md text-balance flex-1">{translatedTitle ?? localizedTitle}</h1>
                      {localizedTitle === listing.title && locale !== 'uz' && (
                        <div className="mt-1">
                          <TranslateButton 
                            text={listing.title} 
                            onTranslated={setTranslatedTitle} 
                            compact 
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-fg-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" strokeWidth={1.75} />
                        {(() => {
                          const normalizeLocale = (loc: string) => loc.replace('-', '_');
                          const locKey = `name_${normalizeLocale(locale)}` as 'name_uz' | 'name_uz_cyrl' | 'name_ru' | 'name_en';
                          if ((listing as any).region_data) {
                            const reg = (listing as any).region_data[locKey] || (listing as any).region_data.name_uz;
                            const dist = (listing as any).district_data ? ((listing as any).district_data[locKey] || (listing as any).district_data.name_uz) : '';
                            if (reg && dist) return `${reg}, ${dist}`;
                            if (reg) return reg;
                          }
                          return listing.location;
                        })()}
                      </span>
                      {listing.created_at && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" strokeWidth={1.75} />
                          {formatRelativeTime(listing.created_at)}
                        </span>
                      )}
                      {typeof listing.view_count === 'number' && (
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                          {listing.view_count}
                        </span>
                      )}
                    </div>
                  </motion.div>

                  
                  {/* ── MOBILE ONLY: Price & Actions & Seller Card ── */}
                  <div className="flex flex-col space-y-4 lg:hidden">
                    {/* Price & actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="surface-elevated p-4 sm:p-6"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle">
                      {t('listings.price')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-display text-3xl font-bold text-fg leading-none">
                        {formatPrice(listing.price, listing.currency, locale)}
                      </p>
                    </div>
                    {listing.is_negotiable && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-3.5 py-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-primary/15">
                          <CheckCircle2 className="h-3 w-3 text-brand-primary" strokeWidth={2.5} />
                        </span>
                        <span className="text-sm font-semibold text-brand-primary tracking-wide">
                          {t('listings.negotiable')}
                        </span>
                      </div>
                    )}

                    <div className="mt-6 space-y-2.5">
                      {user?.public_id !== listing.seller.public_id && (
                        <Link
                          href={`/chat?with=${listing.seller.public_id}`}
                          className="btn btn-primary w-full"
                        >
                          <MessageSquareText className="h-4 w-4" strokeWidth={2.25} />
                          {t('listings.contactSeller')}
                        </Link>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={handleFavorite}
                          aria-pressed={favorited}
                          className={`btn btn-secondary btn-sm transition-all ${favorited ? 'text-danger border-danger/30 bg-danger/8' : ''}`}
                        >
                          <Heart
                            className="h-4 w-4 transition-all duration-200"
                            strokeWidth={1.75}
                            fill={favorited ? 'currentColor' : 'none'}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={handleShare}
                          className="btn btn-secondary btn-sm"
                          aria-label={t('listings.share')}
                        >
                          <Share2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportOpen(true)}
                          className="btn btn-secondary btn-sm"
                          aria-label={t('listings.report')}
                        >
                          <Flag className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {shareOk && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden rounded-xl bg-success/12 px-3 py-2 text-center text-xs font-semibold text-success"
                        >
                          {t('success.copied')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Seller card */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="surface-elevated overflow-hidden"
                  >
                    {/* Header */}
                    <div className="border-b border-border px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle">
                        {t('listings.seller')}
                      </p>
                    </div>

                    <div className="p-5">
                      <Link
                        href={user?.public_id === listing.seller.public_id ? '/profile' : `/sellers/detail?id=${listing.seller.public_id}`}
                        className="flex items-start gap-3 group"
                      >
                        <Avatar
                          src={listing.seller.avatar_url}
                          name={listing.seller.full_name}
                          size="lg"
                          ring
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base font-semibold text-fg group-hover:text-brand-primary transition-colors">
                            {listing.seller.full_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                            <RatingDisplay
                              score={listing.seller.trust_score}
                              count={(listing.seller as any).rating_count}
                              size="sm"
                            />
                          </div>
                        </div>
                      </Link>

                      {/* Trust indicators (real data only) */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-bg-subtle p-3">
                        <div className="text-center">
                          <p className="font-display text-lg font-bold text-fg">
                            {listing.seller.active_listings_count ?? 0}
                          </p>
                          <p className="text-[11px] text-fg-subtle">{t('profile.activeListings')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-display text-lg font-bold text-fg">
                            {listing.seller.sold_listings_count ?? 0}
                          </p>
                          <p className="text-[11px] text-fg-subtle">{t('listings.sold')}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          href={user?.public_id === listing.seller.public_id ? '/profile' : `/sellers/detail?id=${listing.seller.public_id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          {t('common.view')}
                        </Link>
                        <FollowButton sellerId={listing.seller.public_id} size="sm" />
                      </div>
                      <Link
                        href={user?.public_id === listing.seller.public_id ? '/profile' : `/sellers/${listing.seller.public_id}?tab=reviews`}
                        className="mt-2 block w-full rounded-xl border border-border bg-bg-subtle/60 px-3 py-2 text-center text-xs font-semibold text-fg-muted hover:bg-bg-subtle"
                      >
                        {t('reviews.viewAll')}
                      </Link>
                    </div>
                  </motion.div>
                  </div>

{/* Specifications */}
                  {(listing.age_years != null || listing.weight_kg != null || listing.gender || listing.breed) && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="surface-elevated p-4 sm:p-6"
                    >
                      <h2 className="display-sm mb-5">{t('listings.specifications')}</h2>
                      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                        {listing.age_years != null && (
                          <SpecItem
                            icon={Calendar}
                            label={t('animal.age')}
                            value={
                              <AgeDisplay
                                age={{ years: listing.age_years, months: listing.age_months ?? 0 }}
                              />
                            }
                          />
                        )}
                        {listing.weight_kg != null && (
                          <SpecItem
                            icon={Weight}
                            label={t('animal.weight')}
                            value={`${listing.weight_kg} ${t('animal.kg')}`}
                          />
                        )}
                        {listing.gender && (
                          <SpecItem
                            icon={Dna}
                            label={t('animal.gender')}
                            value={
                              t.has(`animal.${listing.gender}` as any)
                                ? t(`animal.${listing.gender}` as any)
                                : <InlineTranslatedSpec text={listing.gender} />
                            }
                          />
                        )}
                        {listing.breed && (
                          <SpecItem
                            icon={CheckCircle2}
                            label={t('animal.breed')}
                            value={<InlineTranslatedSpec text={listing.breed} />}
                          />
                        )}
                        {listing.health_status && (
                          <SpecItem
                            icon={CheckCircle2}
                            label={t('animal.health')}
                            value={<InlineTranslatedSpec text={listing.health_status} />}
                          />
                        )}
                        {listing.vaccination_status && (
                          <SpecItem
                            icon={Syringe}
                            label={t('animal.vaccination')}
                            value={<InlineTranslatedSpec text={listing.vaccination_status} />}
                          />
                        )}
                        {listing.region && (
                          <SpecItem
                            icon={MapPin}
                            label={t('listings.region')}
                            value={listing.region}
                          />
                        )}
                        {listing.district && (
                          <SpecItem
                            icon={MapPin}
                            label={t('listings.district')}
                            value={listing.district}
                          />
                        )}
                      </dl>
                    </motion.div>
                  )}

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.14 }}
                    className="surface-elevated p-4 sm:p-6"
                  >
                    <h2 className="display-sm mb-4">{t('listings.description')}</h2>
                    <TranslatableText
                      text={listing.description}
                      textClassName="whitespace-pre-line text-pretty leading-[1.75] text-fg-muted"
                    />
                  </motion.div>

                  {/* Map (only when coordinates are available) */}
                  {listing.latitude != null && listing.longitude != null && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.16 }}
                      className="surface-elevated p-4 sm:p-6"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="display-sm">{t('listings.locationOnMap' as any) ?? t('listings.location')}</h2>
                        <OpenInMapsButton
                          lat={Number(listing.latitude)}
                          lng={Number(listing.longitude)}
                          label={listing.location}
                        />
                      </div>
                      <MapView
                        center={[Number(listing.latitude), Number(listing.longitude)]}
                        zoom={13}
                        markers={[{
                          id: listing.public_id,
                          lat: Number(listing.latitude),
                          lng: Number(listing.longitude),
                          label: listing.title,
                          price: listing.price ? new Intl.NumberFormat('uz-UZ').format(Number(listing.price)) + " so'm" : undefined,
                          imageUrl: listing.primary_image?.image ?? listing.images?.[0]?.image ?? undefined,
                        }]}
                        className="h-72 w-full"
                        fallbackCaption={`${listing.region}${listing.district ? ' · ' + listing.district : ''}`}
                      />
                      <p className="mt-3 text-sm text-fg-muted inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {(() => {
                          const normalizeLocale = (loc: string) => loc.replace('-', '_');
                          const locKey = `name_${normalizeLocale(locale)}` as 'name_uz' | 'name_uz_cyrl' | 'name_ru' | 'name_en';
                          if ((listing as any).region_data) {
                            const reg = (listing as any).region_data[locKey] || (listing as any).region_data.name_uz;
                            const dist = (listing as any).district_data ? ((listing as any).district_data[locKey] || (listing as any).district_data.name_uz) : '';
                            if (reg && dist) return `${reg}, ${dist}`;
                            if (reg) return reg;
                          }
                          return listing.location;
                        })()}
                      </p>
                    </motion.div>
                  )}

                  {/* Comments */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.18 }}
                    className="surface-elevated p-4 sm:p-6"
                  >
                    <CommentSection
                      listingId={listing.public_id}
                      sellerId={listing.seller.public_id}
                      initialComments={comments}
                    />
                  </motion.div>

                  {/* Public seller reviews — full thread, same as profile */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.20 }}
                  >
                    <h2 className="display-sm mb-4">{t('sellers.reviews')}</h2>
                    <SellerRatingsThread
                      sellerPublicId={listing.seller.public_id}
                      listingPublicId={listing.public_id}
                    />
                  </motion.div>

                  {/* Nearby listings — same region/category */}
                  <NearbyListingsSection listing={listing} />
                </div>

                {/* ── RIGHT COLUMN — STICKY ── */}
                <aside className="hidden lg:block space-y-4 lg:sticky lg:top-24 lg:self-start">
                  {/* Price & actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="surface-elevated p-4 sm:p-6"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle">
                      {t('listings.price')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-display text-3xl font-bold text-fg leading-none">
                        {formatPrice(listing.price, listing.currency, locale)}
                      </p>
                    </div>
                    {listing.is_negotiable && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-3.5 py-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-primary/15">
                          <CheckCircle2 className="h-3 w-3 text-brand-primary" strokeWidth={2.5} />
                        </span>
                        <span className="text-sm font-semibold text-brand-primary tracking-wide">
                          {t('listings.negotiable')}
                        </span>
                      </div>
                    )}

                    <div className="mt-6 space-y-2.5">
                      {user?.public_id !== listing.seller.public_id && (
                        <Link
                          href={`/chat?with=${listing.seller.public_id}`}
                          className="btn btn-primary w-full"
                        >
                          <MessageSquareText className="h-4 w-4" strokeWidth={2.25} />
                          {t('listings.contactSeller')}
                        </Link>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={handleFavorite}
                          aria-pressed={favorited}
                          className={`btn btn-secondary btn-sm transition-all ${favorited ? 'text-danger border-danger/30 bg-danger/8' : ''}`}
                        >
                          <Heart
                            className="h-4 w-4 transition-all duration-200"
                            strokeWidth={1.75}
                            fill={favorited ? 'currentColor' : 'none'}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={handleShare}
                          className="btn btn-secondary btn-sm"
                          aria-label={t('listings.share')}
                        >
                          <Share2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportOpen(true)}
                          className="btn btn-secondary btn-sm"
                          aria-label={t('listings.report')}
                        >
                          <Flag className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {shareOk && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden rounded-xl bg-success/12 px-3 py-2 text-center text-xs font-semibold text-success"
                        >
                          {t('success.copied')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Seller card */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="surface-elevated overflow-hidden"
                  >
                    {/* Header */}
                    <div className="border-b border-border px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle">
                        {t('listings.seller')}
                      </p>
                    </div>

                    <div className="p-5">
                      <Link
                        href={user?.public_id === listing.seller.public_id ? '/profile' : `/sellers/detail?id=${listing.seller.public_id}`}
                        className="flex items-start gap-3 group"
                      >
                        <Avatar
                          src={listing.seller.avatar_url}
                          name={listing.seller.full_name}
                          size="lg"
                          ring
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base font-semibold text-fg group-hover:text-brand-primary transition-colors">
                            {listing.seller.full_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                            <RatingDisplay
                              score={listing.seller.trust_score}
                              count={(listing.seller as any).rating_count}
                              size="sm"
                            />
                          </div>
                        </div>
                      </Link>

                      {/* Trust indicators (real data only) */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-bg-subtle p-3">
                        <div className="text-center">
                          <p className="font-display text-lg font-bold text-fg">
                            {listing.seller.active_listings_count ?? 0}
                          </p>
                          <p className="text-[11px] text-fg-subtle">{t('profile.activeListings')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-display text-lg font-bold text-fg">
                            {listing.seller.sold_listings_count ?? 0}
                          </p>
                          <p className="text-[11px] text-fg-subtle">{t('listings.sold')}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          href={user?.public_id === listing.seller.public_id ? '/profile' : `/sellers/detail?id=${listing.seller.public_id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          {t('common.view')}
                        </Link>
                        <FollowButton sellerId={listing.seller.public_id} size="sm" />
                      </div>
                      <Link
                        href={user?.public_id === listing.seller.public_id ? '/profile' : `/sellers/${listing.seller.public_id}?tab=reviews`}
                        className="mt-2 block w-full rounded-xl border border-border bg-bg-subtle/60 px-3 py-2 text-center text-xs font-semibold text-fg-muted hover:bg-bg-subtle"
                      >
                        {t('reviews.viewAll')}
                      </Link>
                    </div>
                  </motion.div>

                  {/* Safety notice */}
                  <div className="rounded-2xl border border-border bg-bg-subtle p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-accent" strokeWidth={1.75} />
                      <p className="text-xs leading-relaxed text-fg-muted">
                        {t('landing.trustFeature3Description')}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>

              {/* Related listings */}
              {related.length > 0 && (
                <section className="mt-16">
                  <div className="flex items-end justify-between">
                    <h2 className="display-sm">{t('marketplace.recommended')}</h2>
                    <Link href="/listings" className="text-sm font-semibold text-brand-primary hover:underline">
                      {t('common.showAll')}
                    </Link>
                  </div>
                  <div className="mt-5">
                    <ListingGrid listings={related as any} columns={4} />
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <ReportDialog
        open={reportOpen}
        target={
          listing
            ? { kind: 'listing', publicId: listing.public_id as any, title: listing.title }
            : null
        }
        onClose={() => setReportOpen(false)}
      />

      {galleryOpen && listing && (
        <ListingGalleryViewer
          images={listing.images ?? []}
          initialIndex={imgIndex}
          onClose={() => setGalleryOpen(false)}
          title={localizedTitle || listing.title}
        />
      )}
    </div>
  );
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-fg-muted">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </div>
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold text-fg">{value}</dd>
      </div>
    </div>
  );
}

/**
 * "Xaritada ochish" button.
 * - Mobile: opens native maps app via geo: URI (works on Android/iOS)
 * - Desktop: opens Yandex Maps with directions from user location
 * - Fallback: Google Maps
 */
function OpenInMapsButton({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const t = useTranslations();
  const [userPos, setUserPos] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60_000 },
      );
    }
  }, []);

  const handleOpen = () => {
    const isMobile = typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Try native maps app first (geo: URI)
      // Android: opens Google Maps / any maps app
      // iOS: opens Apple Maps
      const geoUri = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label ?? 'E\'lon')})`;
      window.location.href = geoUri;
      // Fallback after 500ms if geo: didn't open
      setTimeout(() => {
        const yandex = userPos
          ? `https://yandex.uz/maps/?rtext=${userPos.lat},${userPos.lng}~${lat},${lng}&rtt=auto`
          : `https://yandex.uz/maps/?pt=${lng},${lat}&z=15&l=map`;
        window.open(yandex, '_blank');
      }, 500);
    } else {
      // Desktop: Yandex Maps with route if user location available
      const url = userPos
        ? `https://yandex.uz/maps/?rtext=${userPos.lat},${userPos.lng}~${lat},${lng}&rtt=auto`
        : `https://yandex.uz/maps/?pt=${lng},${lat}&z=15&l=map&text=${encodeURIComponent(label ?? '')}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/30 bg-brand-primary/8 px-3 py-2 text-sm font-semibold text-brand-primary transition-all hover:bg-brand-primary/12 hover:border-brand-primary/50 active:scale-95"
    >
      <MapPin className="h-4 w-4" strokeWidth={2} />
      {userPos ? t('validation.openDirections') : t('validation.openOnMap')}
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="skeleton aspect-[4/3] rounded-2xl" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-xl" />
          ))}
        </div>
        <div className="surface-elevated p-4 sm:p-6">
          <div className="skeleton h-3 w-20 rounded-full" />
          <div className="skeleton mt-3 h-7 w-3/4" />
          <div className="skeleton mt-3 h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="surface-elevated p-4 sm:p-6">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton mt-3 h-8 w-40" />
          <div className="skeleton mt-6 h-11 w-full" />
        </div>
        <div className="surface-elevated p-5">
          <div className="flex items-center gap-3">
            <div className="skeleton h-14 w-14 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton mt-2 h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineTranslatedSpec({ text }: { text: string }) {
  const [translated, setTranslated] = React.useState<string | null>(null);
  const locale = useLocale();
  if (!text) return null;
  return (
    <div className="flex flex-col items-start gap-1">
      <span>{translated ?? text}</span>
      {locale !== 'uz' && (
        <TranslateButton text={text} onTranslated={setTranslated} className="!p-1 !px-1.5 !text-[10px] h-6" compact />
      )}
    </div>
  );
}
