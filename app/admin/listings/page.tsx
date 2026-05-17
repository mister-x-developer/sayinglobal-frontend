'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search, X, Eye, CheckCircle2, XCircle, LayoutGrid, RefreshCw } from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/components/ui/Toast';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';

export default function AdminListingsPage() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await listingsApi.list({ page_size: 200 });
      setListings(res.results ?? []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [listings, search, statusFilter]);

  const handleApprove = async (id: number) => {
    try {
      await listingsApi.update(id, { status: 'active' } as any);
      setListings((prev) => prev.map((l) => l.public_id === id ? { ...l, status: 'active' } : l));
      toast.success(t('success.updated'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await listingsApi.update(id, { status: 'archived' } as any);
      setListings((prev) => prev.map((l) => l.public_id === id ? { ...l, status: 'archived' } : l));
      toast.success(t('success.updated'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-eyebrow">{t('admin.title')}</p>
          <h1 className="display-md mt-2">{t('admin.listingModeration')}</h1>
          <p className="mt-2 text-fg-muted">{filtered.length} {t('listings.title').toLowerCase()}</p>
        </motion.div>

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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base h-11 cursor-pointer">
            <option value="all">{t('common.all')}</option>
            <option value="active">{t('listings.active')}</option>
            <option value="pending">{t('listings.pending')}</option>
            <option value="archived">{t('listings.archived')}</option>
          </select>
          <button
            type="button"
            onClick={fetchListings}
            className="btn btn-secondary h-11"
            aria-label={t('common.refresh') ?? 'Refresh'}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>
        </div>

        <div className="surface-elevated mt-5 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={LayoutGrid} title={t('marketplace.noResults')} description={t('marketplace.tryAdjusting')} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle">
                    {[t('listings.title2'), t('listings.seller'), t('listings.price'), t('listings.location'), t('admin.pending'), ''].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((l, i) => (
                    <motion.tr
                      key={l.public_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="group transition-colors hover:bg-bg-subtle"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-fg line-clamp-1">{l.title}</p>
                        <p className="text-xs text-fg-subtle">{formatRelativeTime(l.created_at)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-fg">{l.seller.full_name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-fg">{formatPrice(l.price, l.currency)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-fg-muted">{l.location}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={l.status === 'active' ? 'success' : l.status === 'pending' ? 'warning' : 'default'} size="sm">
                          {t(`listings.${l.status}` as any)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <button type="button" onClick={() => handleApprove(l.public_id)} className="btn btn-sm bg-success/12 text-success hover:bg-success/20">
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </button>
                          <button type="button" onClick={() => handleRemove(l.public_id)} className="btn btn-sm bg-danger/12 text-danger hover:bg-danger/20">
                            <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </button>
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
    </AdminLayout>
  );
}
