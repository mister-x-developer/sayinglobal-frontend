'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Search,
  Eye,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Calendar,
  X,
  RefreshCw,
  Users,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { RatingDisplay } from '@/components/shared/RatingDisplay';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/components/ui/Toast';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';
import apiClient from '@/lib/api/client';

interface AdminUser {
  public_id: number;
  full_name: string;
  phone: string | null;
  telegram_username: string | null;
  status: 'good' | 'warning' | 'restricted' | 'blocked';
  trust_score: number | string;
  rating_count?: number;
  active_listings_count: number;
  sold_listings_count: number;
  followers_count: number;
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
}

const STATUS_BADGE: Record<string, any> = {
  good: 'success',
  warning: 'warning',
  restricted: 'error',
  blocked: 'error',
};

export default function AdminUsersPage() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/admin/list/', { params: { page_size: 100 } });
      const data = res.data;
      setUsers(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search));
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  const handleAction = async (userId: number, action: 'warn' | 'restrict' | 'block' | 'unblock') => {
    setActionLoading(true);
    const endpointMap: Record<string, string> = {
      warn: `/moderation/users/${userId}/warn/`,
      restrict: `/moderation/users/${userId}/restrict/`,
      block: `/moderation/users/${userId}/block/`,
      unblock: `/moderation/users/${userId}/unblock/`,
    };
    const statusMap: Record<string, string> = {
      warn: 'warning', restrict: 'restricted', block: 'blocked', unblock: 'good'
    };
    try {
      await apiClient.post(endpointMap[action], { reason: action });
      setUsers((prev) => prev.map((u) =>
        u.public_id === userId ? { ...u, status: statusMap[action] as any } : u
      ));
      if (selectedUser?.public_id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, status: statusMap[action] as any } : null);
      }
      toast.success(t('success.updated'));
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-end justify-between gap-3"
        >
          <div>
            <p className="text-eyebrow">{t('admin.title')}</p>
            <h1 className="display-md mt-2">{t('admin.users')}</h1>
            <p className="mt-2 text-fg-muted">{filtered.length} {t('admin.totalUsers').toLowerCase()}</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="btn btn-secondary btn-sm"
            aria-label={t('common.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>
        </motion.div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="input-base h-11 w-full pl-11"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base h-11 cursor-pointer"
          >
            <option value="all">{t('common.all')}</option>
            <option value="good">{t('userStatus.good')}</option>
            <option value="warning">{t('userStatus.warning')}</option>
            <option value="restricted">{t('userStatus.restricted')}</option>
            <option value="blocked">{t('userStatus.blocked')}</option>
          </select>
        </div>

        {/* Table */}
        <div className="surface-elevated mt-5 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="skeleton h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-36" />
                    <div className="skeleton mt-1.5 h-3 w-24" />
                  </div>
                  <div className="skeleton h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Users} title={t('common.empty')} description={t('errors.notFoundDescription')} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle">
                    {[
                      t('admin.users'),
                      t('admin.pending'),
                      t('sellers.rating'),
                      t('profile.activeListings'),
                      t('profile.joinedDate'),
                      '',
                    ].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle ${i === 5 ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((user, i) => (
                    <motion.tr
                      key={user.public_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03 }}
                      className="group transition-colors hover:bg-bg-subtle"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={null} name={user.full_name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-fg">{user.full_name}</p>
                            <p className="text-xs text-fg-subtle">{user.phone ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={STATUS_BADGE[user.status]} size="sm">
                          {t(`userStatus.${user.status}` as any)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <RatingDisplay score={user.trust_score} count={user.rating_count} size="sm" />
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-fg">{user.active_listings_count}</p>
                        <p className="text-xs text-fg-subtle">{user.sold_listings_count} {t('listings.sold').toLowerCase()}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-fg">{formatDate(user.date_joined, 'short')}</p>
                        {user.last_login && (
                          <p className="text-xs text-fg-subtle">{formatRelativeTime(user.last_login)}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                            {t('admin.viewDetails')}
                          </button>
                          <Link
                            href={`/admin/users/${user.public_id}`}
                            className="btn btn-primary btn-sm"
                          >
                            {t('common.details' as any) ?? 'Details'}
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={selectedUser.full_name}
          size="md"
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <Avatar src={null} name={selectedUser.full_name} size="xl" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="display-sm">{selectedUser.full_name}</h3>
                  <Badge variant={STATUS_BADGE[selectedUser.status]}>
                    {t(`userStatus.${selectedUser.status}` as any)}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-fg-muted">
                  {selectedUser.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4" strokeWidth={1.75} />
                      {selectedUser.phone}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" strokeWidth={1.75} />
                    {formatDate(selectedUser.date_joined, 'long')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('profile.activeListings'), value: selectedUser.active_listings_count },
                { label: t('listings.sold'), value: selectedUser.sold_listings_count },
                { label: t('profile.followers'), value: selectedUser.followers_count },
              ].map((s) => (
                <div key={s.label} className="surface-subtle rounded-xl p-3 text-center">
                  <p className="font-display text-xl font-bold text-fg">{s.value}</p>
                  <p className="mt-0.5 text-xs text-fg-subtle">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {selectedUser.status !== 'good' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedUser.public_id, 'unblock')}
                  className="btn btn-sm bg-success/12 text-success hover:bg-success/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                  {t('admin.unban')}
                </button>
              )}
              {selectedUser.status === 'good' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedUser.public_id, 'warn')}
                  className="btn btn-sm bg-warning/12 text-warning hover:bg-warning/20 disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
                  {t('admin.warn')}
                </button>
              )}
              {selectedUser.status !== 'blocked' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedUser.public_id, 'block')}
                  className="btn btn-sm bg-danger/12 text-danger hover:bg-danger/20 disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" strokeWidth={2.25} />
                  {t('admin.ban')}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
