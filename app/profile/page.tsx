'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
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
  Clock,
  Flag,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { useAuthStore } from '@/lib/store/auth';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';

type Tab = 'listings' | 'favorites' | 'activity';

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

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/auth');
  }, [hydrated, isAuthenticated, router]);

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
    full_name: user?.full_name ?? 'Foydalanuvchi',
    avatar_url: user?.avatar_url ?? user?.avatar ?? null,
    bio: user?.bio ?? '',
    phone: user?.phone ?? '',
    trust_score: user?.trust_score ?? 5.0,
    status: user?.status ?? 'good',
    active_listings: myListings.length,
    sold_listings: 12,
    followers: 234,
    following: 45,
    total_views: 12470,
    response_rate: 95,
    total_sales: 185_000_000,
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
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">

          {/* PROFILE HEADER */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="surface-elevated p-6 sm:p-8"
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
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="display-md">{profile.full_name}</h1>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
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
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" strokeWidth={1.75} />
                        {t('profile.responseTime')}: ~2h
                      </span>
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
                    <Link href="/profile/settings" className="btn btn-secondary btn-sm btn-icon">
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
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            {/* MAIN */}
            <div>
              {/* Tabs */}
              <div className="flex gap-2 border-b border-border">
                {TABS.map((tt) => {
                  const active = tab === tt.key;
                  return (
                    <button
                      key={tt.key}
                      type="button"
                      onClick={() => setTab(tt.key)}
                      className={`relative h-11 px-4 text-sm font-semibold transition-colors ${
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
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-4">
              {/* Response rate */}
              <div className="surface-elevated p-5">
                <h3 className="display-sm">{t('profile.responseRate')}</h3>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-fg-muted">{t('profile.responseRate')}</span>
                    <span className="font-bold text-fg">{profile.response_rate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${profile.response_rate}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-brand-primary"
                    />
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs text-fg-subtle">{t('sellers.totalSales')}</p>
                  <p className="mt-1 font-display text-xl font-bold text-fg">
                    {formatPrice(profile.total_sales)}
                  </p>
                </div>
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

              {/* Important information */}
              <ImportantInfoCard />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityTimeline() {
  const t = useTranslations();
  const events = [
    { icon: Package, label: t('listings.createNew'), desc: t('categories.cattle'), time: new Date(Date.now() - 86400000 * 3).toISOString(), tone: 'bg-brand-primary/10 text-brand-primary' },
    { icon: TrendingUp, label: t('listings.markAsSold'), desc: t('categories.sheep'), time: new Date(Date.now() - 86400000 * 7).toISOString(), tone: 'bg-success/12 text-success' },
    { icon: Heart, label: t('success.favorited'), desc: t('categories.horses'), time: new Date(Date.now() - 86400000 * 10).toISOString(), tone: 'bg-warning/12 text-warning' },
    { icon: Users, label: t('success.followed'), desc: 'Dilshod Rahimov', time: new Date(Date.now() - 86400000 * 14).toISOString(), tone: 'bg-info/12 text-info' },
  ];

  return (
    <div className="space-y-3">
      {events.map((e, i) => {
        const Icon = e.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="surface-elevated flex items-start gap-4 p-4"
          >
            <div className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${e.tone}`}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{e.label}</p>
              <p className="mt-0.5 text-sm text-fg-muted">{e.desc}</p>
            </div>
            <span className="flex-shrink-0 text-xs text-fg-subtle">{formatRelativeTime(e.time)}</span>
          </motion.div>
        );
      })}
    </div>
  );
}


/**
 * ImportantInfoCard — explains the 4-status trust system, ratings, moderation
 * lifecycle, complaints, and account responsibilities. Detailed and truthful.
 */
function ImportantInfoCard() {
  const t = useTranslations();
  const sections: { title: string; body: string }[] = [
    { title: t('profileInfo.statusTitle'),      body: t('profileInfo.statusBody') },
    { title: t('profileInfo.ratingTitle'),      body: t('profileInfo.ratingBody') },
    { title: t('profileInfo.moderationTitle'),  body: t('profileInfo.moderationBody') },
    { title: t('profileInfo.lifecycleTitle'),   body: t('profileInfo.lifecycleBody') },
    { title: t('profileInfo.complaintTitle'),   body: t('profileInfo.complaintBody') },
    { title: t('profileInfo.rulesTitle'),       body: t('profileInfo.rulesBody') },
  ];
  return (
    <div className="surface-elevated p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-accent" strokeWidth={2} />
        <h3 className="display-sm">{t('profileInfo.title')}</h3>
      </div>
      <p className="mb-4 text-sm text-fg-muted">{t('profileInfo.lead')}</p>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl bg-bg-subtle p-3">
            <p className="text-sm font-semibold text-fg">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted whitespace-pre-line">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
