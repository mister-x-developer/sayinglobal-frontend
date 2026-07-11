'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Users, Package, MessageSquareText } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { useAuthStore } from '@/lib/store/auth';
import { FollowButton } from './FollowButton';

export interface SellerCardData {
  id: number;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  trust_score?: number;
  rating_count?: number;
  followers_count?: number;
  active_listings_count?: number;
  sold_listings_count?: number;
  distance_km?: number;
}

export function SellerCard({ seller }: { seller: SellerCardData }) {
  const t = useTranslations();
  const { user } = useAuthStore();

  return (
    <motion.article
      data-motion
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="surface-elevated overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      {/* Top section */}
      <Link href={user?.public_id === seller.id ? '/profile' : `/sellers/detail?id=${seller.id}`} className="block p-5 group">
        <div className="flex items-start gap-4">
          <Avatar src={seller.avatar_url} name={seller.full_name} size="lg" ring />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-fg group-hover:text-brand-primary transition-colors break-words">
                {seller.full_name}
              </h3>
              {typeof seller.distance_km === 'number' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary flex-shrink-0">
                  {seller.distance_km < 1 ? '< 1 km' : `${seller.distance_km.toFixed(1)} km`}
                </span>
              )}
            </div>
            <div className="mt-1">
              <RatingDisplay score={seller.trust_score} count={seller.rating_count} size="sm" />
            </div>
            {seller.bio && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fg-muted">
                {seller.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-bg-subtle p-3">
          {typeof seller.active_listings_count === 'number' && (
            <div className="text-center">
              <p className="font-display text-lg font-bold text-fg">{seller.active_listings_count}</p>
              <p className="text-[11px] text-fg-subtle">{t('profile.activeListings')}</p>
            </div>
          )}
          {typeof seller.sold_listings_count === 'number' && (
            <div className="text-center">
              <p className="font-display text-lg font-bold text-fg">{seller.sold_listings_count}</p>
              <p className="text-[11px] text-fg-subtle">{t('listings.sold')}</p>
            </div>
          )}
          {typeof seller.followers_count === 'number' && (
            <div className="text-center">
              <p className="font-display text-lg font-bold text-fg">{seller.followers_count}</p>
              <p className="text-[11px] text-fg-subtle">{t('profile.followers')}</p>
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
        <Link
          href={`/chat?with=${seller.id}`}
          className="btn btn-secondary btn-sm"
        >
          <MessageSquareText className="h-4 w-4" strokeWidth={1.75} />
          {t('sellers.message')}
        </Link>
        <FollowButton sellerId={seller.id} size="sm" />
      </div>
    </motion.article>
  );
}
