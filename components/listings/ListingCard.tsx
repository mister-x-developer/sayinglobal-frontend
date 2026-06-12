'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Eye, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { Avatar } from '@/components/ui/Avatar';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { ListingImage } from './ListingImage';
import { formatPrice, formatRelativeTime, getLocalizedListingTitle } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export interface ListingCardData {
  public_id: number;
  title: string;
  title_uz?: string;
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  description?: string;
  price: number;
  currency: string;
  location: string;
  region?: string;
  district?: string;
  images: Array<{ id: string | number; image: string; is_primary?: boolean }>;
  seller: {
    public_id: number;
    full_name: string;
    avatar_url?: string;
    trust_score?: number;
    rating_count?: number;
  };
  category?: { name?: string; name_uz?: string };
  view_count?: number;
  favorite_count?: number;
  is_favorited?: boolean;
  is_negotiable?: boolean;
  created_at?: string;
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

  // Category display: prefer t('categories.{slug}') over raw name_uz
  const categorySlug = listing.category?.name;
  const categoryLabel = categorySlug
    ? (t(`categories.${categorySlug}` as any) || listing.category?.name_uz || '')
    : (listing.category?.name_uz || '');

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited((v) => !v);
    setFavAnimating(true);
    setTimeout(() => setFavAnimating(false), 400);
    onFavorite?.(listing.public_id);
  };

  return (
    <Link href={`/listings/${listing.public_id}`} className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl">
      <article className="surface-elevated rounded-2xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgb(var(--shadow-color)/0.18)]">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-bg-subtle">
          <ListingImage
            src={imageSrc}
            alt={listing.title}
            category={listing.category?.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          />

          {/* Favorite button */}
          <button
            type="button"
            onClick={handleFav}
            aria-label={isFavorited ? t('success.unfavorited') : t('success.favorited')}
            aria-pressed={isFavorited}
            className={cn(
              'absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full',
              'bg-bg-elevated/88 backdrop-blur-sm',
              'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'hover:scale-110 active:scale-90',
              isFavorited ? 'text-danger' : 'text-fg',
              favAnimating && 'scale-125'
            )}
          >
            <Heart
              className="h-[18px] w-[18px] transition-all duration-200"
              strokeWidth={1.75}
              fill={isFavorited ? 'currentColor' : 'none'}
            />
          </button>

          {/* Bottom gradient for text legibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          {/* Category eyebrow */}
          {categoryLabel && (
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-accent">
              {categoryLabel}
            </p>
          )}

          {/* Title */}
          <h3 className="line-clamp-2 font-display text-[16px] font-semibold leading-snug text-fg transition-colors group-hover:text-brand-primary">
            {localizedTitle}
          </h3>

          {/* Location */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-fg-muted">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
            <span className="truncate">
              {(() => {
                if (!listing) return '';
                const normalizeLocale = (loc: string) => loc.replace('-', '_');
                const locKey = `name_${normalizeLocale(locale)}` as 'name_uz' | 'name_uz_cyrl' | 'name_ru' | 'name_en';
                if ((listing as any).region_data) {
                  const reg = (listing as any).region_data[locKey] || (listing as any).region_data.name_uz;
                  const dist = (listing as any).district_data ? ((listing as any).district_data[locKey] || (listing as any).district_data.name_uz) : '';
                  if (reg && dist) return `${reg}, ${dist}`;
                  if (reg) return reg;
                }
                return listing.location || '';
              })()}
            </span>
          </div>

          {/* Price row */}
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
              <p className="font-display text-xl font-bold text-fg leading-none">
                {formatPrice(listing.price, listing.currency)}
              </p>
              {listing.is_negotiable && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/20 bg-brand-primary/5 px-2 py-0.5 text-[11px] font-semibold text-brand-primary"
                  aria-label={t('listings.negotiable')}
                >
                  {t('listings.negotiable')}
                </span>
              )}
            </div>
            {typeof listing.view_count === 'number' && listing.view_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-fg-subtle flex-shrink-0">
                <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>{listing.view_count}</span>
              </div>
            )}
          </div>

          {/* Seller row */}
          <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-3.5">
            <Avatar
              src={listing.seller.avatar_url}
              name={listing.seller.full_name}
              size="xs"
            />
            <span className="flex-1 line-clamp-2 text-xs font-medium text-fg-muted">
              {listing.seller.full_name || (t('sellers.anonymous' as any) ?? 'Sotuvchi')}
            </span>
            <RatingDisplay
              score={listing.seller.trust_score}
              count={listing.seller.rating_count}
              size="sm"
            />
            {listing.created_at && (
              <span className="hidden text-xs text-fg-subtle sm:inline-flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.75} />
                {formatRelativeTime(listing.created_at)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
