'use client';

/**
 * Admin User Detail.
 *
 * Full operational view of a single marketplace user — status,
 * activity counters, ratings overview, recent listings, complaints
 * filed by them and against them, and the moderation actions
 * (warn / restrict / block / unblock).
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldBan,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Phone,
  Calendar,
  MapPin,
  Package,
  Heart,
  MessageSquareText,
  Star,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TranslatableText } from '@/components/shared/TranslateButton';
import { toast } from '@/components/ui/Toast';
import { ListingCard } from '@/components/listings/ListingCard';
import { SellerRatingsThread } from '@/components/sellers/SellerRatingsThread';
import { listingsApi } from '@/lib/api/listings';
import { moderationApi } from '@/lib/api/moderation';
import apiClient from '@/lib/api/client';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

const STATUS_BADGE: Record<string, any> = {
  good: 'success',
  warning: 'warning',
  restricted: 'error',
  blocked: 'error',
};

interface AdminUserRecord {
  public_id: number;
  full_name: string;
  phone?: string | null;
  telegram_username?: string | null;
  avatar_url?: string;
  bio?: string;
  status: 'good' | 'warning' | 'restricted' | 'blocked';
  trust_score?: number;
  rating_count?: number;
  active_listings_count?: number;
  sold_listings_count?: number;
  followers_count?: number;
  following_count?: number;
  date_joined?: string;
  last_login?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  is_admin?: boolean;
}

export default function AdminUserDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));

  const [user, setUser] = useState<AdminUserRecord | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [filedReports, setFiledReports] = useState<any[]>([]);
  const [receivedReports, setReceivedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, l, r] = await Promise.all([
        apiClient.get(`/users/profile/${id}/`).then((r) => r.data).catch(() => null),
        apiClient.get('/listings/', { params: { page_size: 100 } })
          .then((r) => (r.data?.results ?? []).filter((x: any) => x.seller?.public_id === id))
          .catch(() => []),
        moderationApi.adminList({ page_size: 200 }).catch(() => ({ results: [] })),
      ]);
      setUser(u);
      setListings(l);
      const allReports: any[] = (r as any)?.results ?? [];
      setFiledReports(allReports.filter((rp) => rp.complainant?.public_id === id));
      setReceivedReports(allReports.filter((rp) => rp.reported_user?.public_id === id || rp.listing?.seller?.public_id === id));
    } catch {
      setUser(null);
      setListings([]);
      setFiledReports([]);
      setReceivedReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(id)) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const moderate = async (action: 'warn' | 'restrict' | 'block' | 'unblock') => {
    if (!user) return;
    setActionLoading(true);
    const endpointMap: Record<string, string> = {
      warn: `/moderation/users/${user.public_id}/warn/`,
      restrict: `/moderation/users/${user.public_id}/restrict/`,
      block: `/moderation/users/${user.public_id}/block/`,
      unblock: `/moderation/users/${user.public_id}/unblock/`,
    };
    const statusMap: Record<string, AdminUserRecord['status']> = {
      warn: 'warning',
      restrict: 'restricted',
      block: 'blocked',
      unblock: 'good',
    };
    try {
      await apiClient.post(endpointMap[action], { reason: action });
      setUser({ ...user, status: statusMap[action] });
      toast.success(t('success.updated'));
    } catch {
      toast.error(t('errors.serverError' as any) ?? t('errors.generic'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-page py-8 sm:py-10">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="container-page py-8 sm:py-10">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm -ml-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
          <div className="surface-elevated mt-8 p-8 text-center text-fg-muted">
            {t('marketplace.noResults')}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm -ml-2">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 grid gap-6 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            {/* Header */}
            <div className="surface-elevated p-6">
              <div className="flex items-center gap-4">
                <Avatar src={user.avatar_url} name={user.full_name} size="xl" ring />
                <div className="min-w-0 flex-1">
                  <h1 className="display-sm">{user.full_name}</h1>
                  <p className="mt-1 text-sm text-fg-muted">
                    #{user.public_id} · {user.phone}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={STATUS_BADGE[user.status]} size="sm">
                      {t(`userStatus.${user.status}` as any) ?? user.status}
                    </Badge>
                    {user.is_verified && <Badge variant="info" size="sm">verified</Badge>}
                    {user.is_admin && <Badge variant="primary" size="sm">admin</Badge>}
                  </div>
                </div>
              </div>

              {user.bio && (
                <div className="mt-5">
                  <TranslatableText
                    text={user.bio}
                    textClassName="text-sm text-fg-muted whitespace-pre-line"
                  />
                </div>
              )}

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-fg-subtle">{t('profile.activeListings')}</dt>
                  <dd className="font-semibold text-fg">{user.active_listings_count ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-subtle">{t('listings.sold')}</dt>
                  <dd className="font-semibold text-fg">{user.sold_listings_count ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-subtle">{t('profile.followers')}</dt>
                  <dd className="font-semibold text-fg">{user.followers_count ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-subtle">{t('profile.following')}</dt>
                  <dd className="font-semibold text-fg">{user.following_count ?? 0}</dd>
                </div>
              </dl>

              {user.date_joined && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {formatDate(user.date_joined)}
                </p>
              )}
            </div>

            {/* Listings */}
            {listings.length > 0 && (
              <div className="surface-elevated p-6">
                <h2 className="display-sm mb-4">{t('listings.title')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {listings.slice(0, 6).map((l) => (
                    <ListingCard key={l.public_id} listing={l} />
                  ))}
                </div>
              </div>
            )}

            {/* Received reports (against this user) */}
            {receivedReports.length > 0 && (
              <div className="surface-elevated p-6">
                <h2 className="display-sm mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
                  {t('admin.reportsReceived')}
                  <Badge variant="warning" size="sm">{receivedReports.length}</Badge>
                </h2>
                <ul className="divide-y divide-border">
                  {receivedReports.map((r) => (
                    <li key={r.public_id} className="py-3">
                      <Link href={`/admin/moderation`} className="flex items-center justify-between hover:bg-bg-subtle rounded-lg px-2 py-1 -mx-2">
                        <div className="min-w-0">
                          <p className="text-sm text-fg">{r.complainant?.full_name} → {r.report_type}</p>
                          {r.description && (
                            <TranslatableText
                              text={r.description}
                              textClassName="mt-1 text-xs text-fg-muted line-clamp-2"
                            />
                          )}
                        </div>
                        <Badge variant={r.status === 'pending' ? 'warning' : 'default'} size="sm">
                          {r.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Public reviews */}
            <div className="surface-elevated p-6">
              <h2 className="display-sm mb-4 flex items-center gap-2">
                <Star className="h-4 w-4" strokeWidth={1.75} />
                {t('sellers.reviews')}
              </h2>
              <SellerRatingsThread sellerPublicId={user.public_id} />
            </div>
          </div>

          {/* Sidebar — actions */}
          <div className="space-y-6">
            <div className="surface-elevated p-6">
              <h3 className="text-eyebrow">{t('admin.actions')}</h3>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => moderate('warn')}
                  disabled={actionLoading || user.status === 'warning'}
                  className="btn btn-secondary w-full bg-warning/10 text-warning hover:bg-warning/15"
                >
                  <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                  {t('admin.warn')}
                </button>
                <button
                  type="button"
                  onClick={() => moderate('restrict')}
                  disabled={actionLoading || user.status === 'restricted'}
                  className="btn btn-secondary w-full"
                >
                  <ShieldBan className="h-4 w-4" strokeWidth={2} />
                  {t('admin.restrict')}
                </button>
                <button
                  type="button"
                  onClick={() => moderate('block')}
                  disabled={actionLoading || user.status === 'blocked'}
                  className="btn btn-danger w-full"
                >
                  <ShieldBan className="h-4 w-4" strokeWidth={2} />
                  {t('admin.block')}
                </button>
                {user.status !== 'good' && (
                  <button
                    type="button"
                    onClick={() => moderate('unblock')}
                    disabled={actionLoading}
                    className="btn btn-primary w-full"
                  >
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                    {t('admin.unblock')}
                  </button>
                )}
              </div>
            </div>

            {filedReports.length > 0 && (
              <div className="surface-elevated p-6">
                <h3 className="text-eyebrow">{t('admin.reportsFiled')}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {filedReports.map((r) => (
                    <li key={r.public_id} className="flex items-center justify-between rounded-lg bg-bg-subtle px-3 py-2">
                      <span className="text-fg-muted truncate">{r.report_type}</span>
                      <Badge variant={r.status === 'pending' ? 'warning' : 'default'} size="sm">
                        {r.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
