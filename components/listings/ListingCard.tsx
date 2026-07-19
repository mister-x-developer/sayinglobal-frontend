'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Eye, Clock, Lock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { Avatar } from '@/components/ui/Avatar';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { ListingImage } from './ListingImage';
import { formatPrice, formatRelativeTime, getLocalizedListingTitle } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export interface ListingCardData {
  id: number;
  title: string;
  title_uz?: string;
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  description?: string;
  price: number | null;
  currency: string | null;
  location: string;
  region?: string;
  district?: string;
  images: Array<{ id: string | number; image: string; is_primary?: boolean }>;
  seller: {
    id: number;
    full_name: string;
    avatar_url?: string;
    trust_score?: number;
    rating_count?: number;
  } | null;
  category?: { name?: string; name_uz?: string };
  view_count?: number;
  favorite_count?: number;
  is_favorited?: boolean;
  is_negotiable?: boolean;
  created_at?: string;
  published_at?: string;
}

interface Props {
  listing: ListingCardData;
  onFavorite?: (publicId: number) => void;
}

export function ListingCard({ listing, onFavorite }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [isFavorited, setIsFavorited] = useState(!!listing.is_favorited);
  const [favAnimating, setFavAnimating] = useState(false);

  const primary = listing.images.find((i) => i.is_primary) ?? listing.images[0];
  const imageSrc =
    primary?.image && !primary.image.startsWith('/placeholder') ? primary.image : null;

  // Get localized title for current UI language
  const localizedTitle = getLocalizedListingTitle(listing, locale);

  const normalizeLocale = (loc: string) => loc.replace('-', '_');
  const locKey = `name_${normalizeLocale(locale)}` as 'name_uz' | 'name_uz_cyrl' | 'name_ru' | 'name_en';

  const categorySlug = (listing.category as any)?.slug || (listing.category as any)?.name;
  const categoryLabel = categorySlug
    ? (t(`categories.${categorySlug}` as any) || (listing.category as any)?.[locKey] || listing.category?.name_uz || '')
    : ((listing.category as any)?.[locKey] || listing.category?.name_uz || '');

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited((v) => !v);
    setFavAnimating(true);
    setTimeout(() => setFavAnimating(false), 400);
    onFavorite?.(listing.id);
  };

  return (
    <article className="group relative surface-elevated rounded-2xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1.5 hover:shadow-[0_12px_32px_-12px_rgb(var(--shadow-color)/0.25)] border border-border/50 hover:border-border">
      <Link 
        href={`/listings/detail?id=${listing.id}`} 
        className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset rounded-2xl"
        aria-label={`${t('common.viewDetails' as any) || 'Batafsil'}: ${localizedTitle}`}
      />
      
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-subtle">
        <ListingImage
          src={imageSrc}
          alt={listing.title}
          category={listing.category?.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
        />

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleFav}
          aria-label={isFavorited ? t('success.unfavorited') : t('success.favorited')}
          aria-pressed={isFavorited}
          className={cn(
            'absolute top-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full',
            'bg-bg-elevated/90 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10',
            'transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
            'hover:scale-105 active:scale-95',
            isFavorited ? 'text-danger' : 'text-fg',
            favAnimating && 'scale-125'
          )}
        >
          <Heart
            className="h-5 w-5 transition-all duration-200"
            strokeWidth={isFavorited ? 2.5 : 2}
            fill={isFavorited ? 'currentColor' : 'none'}
          />
        </button>

        {/* Bottom gradient for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Body */}
      <div className="flex flex-col p-4 sm:p-5 h-full relative z-0 pointer-events-none">
        {/* Category eyebrow */}
        {categoryLabel && (
          <span className="inline-flex items-center self-start rounded-full bg-brand-primary/10 px-2.5 py-0.5 mb-3 text-xs font-medium text-brand-primary">
            {categoryLabel}
          </span>
        )}

        {/* Title */}
        <h3 className="line-clamp-2 font-display text-[17px] font-semibold leading-snug text-fg transition-colors group-hover:text-brand-primary">
          {localizedTitle}
        </h3>

        {/* Location & Time */}
        <div className="flex items-center gap-1.5 text-fg-subtle text-xs mt-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {(() => {
              const rData = (listing as any).region_data;
              const dData = (listing as any).district_data;
              const rName = rData ? rData[locKey] || rData.name_uz : listing.region;
              const dName = dData ? dData[locKey] || dData.name_uz : listing.district;
              
              if (dName && rName) return `${dName}, ${rName}`;
              if (rName) return rName;
              if (dName) return dName;
              return listing.location;
            })()}
          </span>
          <span className="mx-1.5 inline-block w-1 h-1 rounded-full bg-border" />
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {formatRelativeTime(listing.created_at || listing.published_at || new Date().toISOString(), locale)}
          </span>
        </div>

        <div className="mt-auto pt-4">
          {/* Price row */}
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
              {listing.price != null ? (
                <>
                  <p className="font-display text-xl sm:text-2xl font-bold text-fg leading-none tracking-tight">
                    {formatPrice(listing.price, listing.currency || 'UZS', locale)}
                  </p>
                  {listing.is_negotiable && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary"
                      aria-label={t('listings.negotiable')}
                    >
                      {t('listings.negotiable')}
                    </span>
                  )}
                </>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-bg-muted px-2.5 py-1 text-[13px] font-medium text-fg-subtle">
                  <Lock className="h-3.5 w-3.5" />
                  <span>{t('auth.loginToViewPrice' as any) || "Narxni ko'rish uchun kiring"}</span>
                </div>
              )}
            </div>
            {typeof listing.view_count === 'number' && listing.view_count > 0 && (
              <div className="flex items-center gap-1 text-[13px] text-fg-subtle flex-shrink-0 font-medium">
                <Eye className="h-4 w-4" strokeWidth={2} />
                <span>{listing.view_count}</span>
              </div>
            )}
          </div>

          {/* Seller row */}
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
            {listing.seller ? (
              <>
                <Avatar
                  src={listing.seller.avatar_url}
                  name={listing.seller.full_name}
                  size="xs"
                />
                <span className="flex-1 line-clamp-1 text-[13px] font-medium text-fg-muted">
                  {listing.seller.full_name || (t('sellers.anonymous' as any) ?? 'Sotuvchi')}
                </span>
                <RatingDisplay
                  score={listing.seller.trust_score}
                  count={listing.seller.rating_count}
                  size="sm"
                />
              </>
            ) : (
              <div className="flex w-full items-center gap-2 rounded-lg bg-bg-subtle py-1.5 px-3 text-[13px] font-medium text-brand-primary">
                <Lock className="h-3.5 w-3.5" />
                <span>{t('auth.loginToViewSeller' as any) || "Sotuvchini ko'rish uchun kiring"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
