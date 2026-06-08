'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Edit,
  Settings,
  Package,
  Heart,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  MessageSquareText,
  ShieldCheck,
  Plus,
  Flag,
  BookOpen,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { SellerRatingsThread } from '@/components/sellers/SellerRatingsThread';
import { useAuthStore } from '@/lib/store/auth';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { formatPrice, formatRelativeTime, getLocalizedListingTitle } from '@/lib/utils/format';

type Tab = 'listings' | 'favorites' | 'activity' | 'reviews';

export default function ProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>('listings');
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setHydrated(true), []);

  /* auth gating handled by middleware */

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    setLoading(true);
    Promise.all([listingsApi.my(), listingsApi.favorites()])
      .then(([mine, favs]) => {
        if (!alive) return;
        setMyListings(mine ?? []);
        setFavorites(favs ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setMyListings([]);
        setFavorites([]);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [isAuthenticated]);

  const profile = {
    full_name: user?.full_name ?? '',
    avatar_url: user?.avatar_url ?? user?.avatar ?? null,
    bio: user?.bio ?? '',
    phone: user?.phone ?? '',
    trust_score: user?.trust_score ?? 0,
    status: user?.status ?? 'good',
    active_listings: myListings.filter((l) => l.status === 'active').length,
    sold_listings: myListings.filter((l) => l.status === 'sold').length,
    followers: (user as any)?.followers_count ?? 0,
    following: (user as any)?.following_count ?? 0,
    total_views: myListings.reduce((s, l) => s + (l.view_count ?? 0), 0),
    total_favorites: myListings.reduce((s, l) => s + (l.favorite_count ?? 0), 0),
  };

  const stats = [
    { icon: Package, label: t('profile.activeListings'), value: profile.active_listings, tone: 'bg-brand-primary/10 text-brand-primary' },
    { icon: TrendingUp, label: t('profile.soldListings'), value: profile.sold_listings, tone: 'bg-success/12 text-success' },
    { icon: Users, label: t('profile.followers'), value: profile.followers, tone: 'bg-info/12 text-info' },
    { icon: Eye, label: t('marketplace.trending'), value: profile.total_views, tone: 'bg-warning/12 text-warning' },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: 'listings', label: t('profile.myListings') },
    { key: 'favorites', label: t('profile.favorites') },
    { key: 'activity', label: t('profile.activity') },
    { key: 'reviews', label: t('sellers.reviews' as any) ?? 'Reviews' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-4 pb-40 sm:py-8 sm:pb-10"> {/* very generous pb-40 on mobile so ALL "Muhim ma'lumot" cards (E'lon hayotiy davri, Shikoyatlar, Sotuvchi mas'uliyati etc.) are fully visible without being covered by the fixed AI button or bottom nav */}

          {/* PROFILE HEADER — more compact on mobile for full visibility of stats + tabs */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="surface-elevated p-4 sm:p-6 lg:p-8"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size="2xl"
                ring
                className="flex-shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="display-md">{profile.full_name}</h1>
                      {profile.status === 'good' && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-success">
                          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                          {t('userStatus.good')}
                        </div>
                      )}
                      {profile.status === 'warning' && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-warning">
                          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                          {t('userStatus.warning')}
                        </div>
                      )}
                      {profile.status === 'restricted' && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-danger">
                          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                          {t('userStatus.restricted')}
                        </div>
                      )}
                      {profile.status === 'blocked' && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-danger">
                          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                          {t('userStatus.blocked')}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">
                      <RatingDisplay
                        score={profile.trust_score}
                        count={(profile as any).rating_count}
                        size="md"
                      />
                      {profile.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" strokeWidth={1.75} />
                          {profile.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href="/listings/new" className="btn btn-primary btn-sm">
                      <Plus className="h-4 w-4" strokeWidth={2.25} />
                      {t('nav.createListing')}
                    </Link>
                    <Link href="/profile/edit" className="btn btn-secondary btn-sm">
                      <Edit className="h-4 w-4" strokeWidth={1.75} />
                      {t('profile.editProfile')}
                    </Link>
                    <Link href="/profile/settings" className="btn btn-secondary btn-sm btn-icon" aria-label={t('nav.settings')}>
                      <Settings className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>

                {profile.bio && (
                  <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-fg-muted">
                    {profile.bio}
                  </p>
                )}

                {/* Follow counts */}
                <div className="mt-4 flex flex-wrap gap-6 text-sm">
                  <Link href="/sellers/following" className="group flex items-center gap-1.5 text-fg-muted hover:text-fg">
                    <span className="font-bold text-fg">{profile.following}</span>
                    <span>{t('profile.following')}</span>
                  </Link>
                  <div className="flex items-center gap-1.5 text-fg-muted">
                    <span className="font-bold text-fg">{profile.followers}</span>
                    <span>{t('profile.followers')}</span>
                  </div>
                </div>
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
                  className="surface-elevated flex items-center gap-4 p-5"
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs text-fg-subtle">{s.label}</p>
                    <p className="font-display text-2xl font-bold text-fg">{s.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* SIDEBAR + TABS LAYOUT */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] pb-8 md:pb-0"> {/* extra padding on mobile for full visibility of stacked sidebar content vs fixed AI + nav */}
            {/* MAIN */}
            <div>
              {/* Tabs — horizontal scroll on mobile so all labels (incl. long "Mening e'lonlarim") are fully visible */}
              <div className="overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:px-0">
                <div className="flex gap-1 border-b border-border min-w-max sm:min-w-0">
                  {TABS.map((tt) => {
                    const active = tab === tt.key;
                    return (
                      <button
                        key={tt.key}
                        type="button"
                        onClick={() => setTab(tt.key)}
                        className={`relative h-11 flex-shrink-0 snap-start px-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                          active ? 'text-brand-primary' : 'text-fg-muted hover:text-fg'
                        }`}
                      >
                        {tt.label}
                        {active && (
                          <motion.span
                            layoutId="profile-tab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                {tab === 'listings' && (
                  loading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="surface-elevated overflow-hidden">
                          <div className="aspect-[4/3] skeleton" />
                          <div className="p-4"><div className="skeleton h-4 w-3/4" /></div>
                        </div>
                      ))}
                    </div>
                  ) : myListings.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title={t('profile.noListings')}
                      description={t('empty.noListingsDescription')}
                      action={
                        <Link href="/listings/new" className="btn btn-primary btn-sm">
                          <Plus className="h-4 w-4" strokeWidth={2.25} />
                          {t('nav.createListing')}
                        </Link>
                      }
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {myListings.map((l) => (
                        <ListingCard key={l.public_id} listing={l as any} />
                      ))}
                    </div>
                  )
                )}

                {tab === 'favorites' && (
                  favorites.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title={t('empty.noFavorites')}
                      description={t('empty.noFavoritesDescription')}
                      action={
                        <Link href="/listings" className="btn btn-primary btn-sm">
                          {t('marketplace.title')}
                        </Link>
                      }
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {favorites.map((l) => (
                        <ListingCard key={l.public_id} listing={l as any} />
                      ))}
                    </div>
                  )
                )}

                {tab === 'activity' && (
                  <ActivityTimeline />
                )}

                {tab === 'reviews' && user?.public_id && (
                  <div className="surface-elevated p-6">
                    <SellerRatingsThread sellerPublicId={user.public_id} />
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-4 pb-32 md:pb-0"> {/* extra bottom space on mobile so last card (Muhim ma'lumot) text is not covered by fixed AI button or bottom nav */}
              {/* Account summary */}
              <div className="surface-elevated p-5">
                <h3 className="display-sm">{t('profile.accountSummary' as any) ?? t('profile.title')}</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-fg-muted">{t('profile.activeListings')}</dt>
                    <dd className="font-bold text-fg">{profile.active_listings}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-fg-muted">{t('profile.soldListings')}</dt>
                    <dd className="font-bold text-fg">{profile.sold_listings}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-fg-muted">{t('profile.followers')}</dt>
                    <dd className="font-bold text-fg">{profile.followers}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-fg-muted">{t('profile.following')}</dt>
                    <dd className="font-bold text-fg">{profile.following}</dd>
                  </div>
                </dl>
              </div>

              {/* Quick links */}
              <div className="surface-elevated p-5">
                <h3 className="display-sm mb-3">{t('common.settings')}</h3>
                <div className="space-y-1">
                  {[
                    { href: '/profile/edit', icon: Edit, label: t('profile.editProfile') },
                    { href: '/profile/settings', icon: Settings, label: t('nav.settings') },
                    { href: '/profile/security', icon: ShieldCheck, label: t('security.title') },
                    { href: '/profile/reports', icon: Flag, label: t('profile.myReports' as any) ?? 'Reports' },
                    { href: '/sellers/following', icon: Users, label: t('profile.followedSellers') },
                    { href: '/chat', icon: MessageSquareText, label: t('nav.chat') },
                    { href: '/profile/guide', icon: BookOpen, label: 'Platforma Qoidalari va Qo\'llanma' },
                  ].map((l) => {
                    const Icon = l.icon;
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg hover:bg-bg-subtle"
                      >
                        <Icon className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
                        {l.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityTimeline() {
  // Activity timeline draws from the user's own listings instead of
  // fabricated events. The previous demo content was misleading because
  // it didn't reflect real platform activity.
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listingsApi
      .my()
      .then((data) => alive && setItems((data ?? []).slice(0, 10)))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface-elevated h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-fg-muted py-8 text-center">
        {t('empty.noActivityDescription')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((l, i) => (
        <motion.div
          key={l.public_id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: i * 0.04 }}
          className="surface-elevated flex items-start gap-4 p-4 cursor-pointer hover:shadow-lift"
          onClick={() => router.push(`/listings/${l.public_id}`)}
        >
          <div className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Package className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg line-clamp-1">{getLocalizedListingTitle(l, locale)}</p>
            <p className="mt-0.5 text-sm text-fg-muted">
              {t(`listings.${l.status}` as any) ?? l.status}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs text-fg-subtle">
            {formatRelativeTime(l.created_at)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}



