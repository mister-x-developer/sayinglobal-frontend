'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Users, Package, MessageSquareText, ArrowRight } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { FollowButton } from '@/components/sellers/FollowButton';
import { ListingCard } from '@/components/listings/ListingCard';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { useAuthStore } from '@/lib/store/auth';
import { useFollowStore } from '@/lib/store/follow';
import { usersApi } from '@/lib/api/users';

export default function FollowedSellersPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { following } = useFollowStore();
  const [hydrated, setHydrated] = useState(false);
  const [serverList, setServerList] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/auth');
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    usersApi.following().then((d) => alive && setServerList(d ?? []));
    return () => { alive = false; };
  }, [isAuthenticated]);

  const sellers = useMemo(() => {
    if (!hydrated) return [];
    return serverList;
  }, [hydrated, serverList]);

  const isFollowingAny = hydrated && Array.from(following).length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-eyebrow">{t('profile.followedSellers')}</p>
            <h1 className="display-md mt-2">{t('profile.following')}</h1>
            <p className="mt-2 text-fg-muted">
              {isFollowingAny
                ? t('listings.favoriteCount', { count: Array.from(following).length })
                : t('sellers.trustedSellers')}
            </p>
          </motion.div>

          {!hydrated ? null : sellers.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={Users}
                title={t('empty.noFollowing')}
                description={t('empty.noFollowingDescription')}
                action={
                  <Link href="/sellers" className="btn btn-primary btn-sm">
                    {t('sellers.directory')}
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {sellers.map((s: any, i: number) => {
                const sellerListings: any[] = [];
                const isExpanded = expanded === s.public_id;

                return (
                  <motion.div
                    key={s.public_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="surface-elevated overflow-hidden"
                  >
                    {/* Seller header */}
                    <div className="flex items-start gap-4 p-5">
                      <Link href={`/sellers/${s.public_id}`} className="flex-shrink-0">
                        <Avatar src={s.avatar_url} name={s.full_name} size="lg" ring />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link href={`/sellers/${s.public_id}`} className="font-display text-base font-semibold text-fg hover:underline">
                              {s.full_name}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
                              <RatingDisplay
                                score={s.trust_score}
                                count={(s as any).rating_count}
                                size="sm"
                              />
                              {typeof s.active_listings_count === 'number' && (
                                <span className="inline-flex items-center gap-1">
                                  <Package className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  {s.active_listings_count} {t('profile.activeListings')}
                                </span>
                              )}
                              {typeof s.followers_count === 'number' && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  {s.followers_count}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link href={`/chat?with=${s.public_id}`} className="btn btn-secondary btn-sm">
                              <MessageSquareText className="h-4 w-4" strokeWidth={1.75} />
                              <span className="hidden sm:inline">{t('sellers.message')}</span>
                            </Link>
                            <FollowButton sellerId={s.public_id} size="sm" />
                          </div>
                        </div>

                        {s.bio && (
                          <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{s.bio}</p>
                        )}
                      </div>
                    </div>

                    {/* Listings preview */}
                    {sellerListings.length > 0 && (
                      <div className="border-t border-border">
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : s.public_id)}
                          className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-fg-muted hover:text-fg"
                        >
                          <span>{t('profile.activeListings')} ({sellerListings.length})</span>
                          <ArrowRight
                            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            strokeWidth={2}
                          />
                        </button>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden px-5 pb-5"
                          >
                            <div className="grid gap-3 sm:grid-cols-3">
                              {sellerListings.map((l) => (
                                <ListingCard key={l.public_id} listing={l as any} />
                              ))}
                            </div>
                            <Link
                              href={`/sellers/${s.public_id}`}
                              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
                            >
                              {t('common.showAll')}
                              <ArrowRight className="h-4 w-4" strokeWidth={2} />
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
