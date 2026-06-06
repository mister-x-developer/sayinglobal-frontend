'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Search, X, Eye, CheckCircle2, XCircle, LayoutGrid, RefreshCw,
  Trash2, Square, CheckSquare, MinusSquare,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/components/ui/Toast';
import { listingsApi } from '@/lib/api/listings';
import type { Listing } from '@/lib/api/listings';
import apiClient from '@/lib/api/client';
import { moderationApi } from '@/lib/api/moderation';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const STATUS_OPTIONS = ['all', 'pending', 'active', 'rejected', 'sold', 'archived'] as const;
type StatusOption = typeof STATUS_OPTIONS[number];

const STATUS_BADGE: Record<string, any> = {
  active: 'success',
  pending: 'warning',
  rejected: 'error',
  sold: 'default',
  archived: 'default',
};

export default function AdminListingsPage() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption>('pending');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<'approve' | 'reject' | 'remove' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<'bulk' | number | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page_size: 200 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await apiClient.get('/listings/', { params });
      const data = res.data as any;
      setListings(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    listingsApi.categories().then(setCategories).catch(() => {});
  }, []);

  const fetchPendingConfirmations = useCallback(async () => {
    setPendingLoading(true);
    try {
      const data = await listingsApi.adminPendingConfirmations();
      setPendingConfirmations(data || []);
    } catch {
      setPendingConfirmations([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingConfirmations();
  }, [fetchPendingConfirmations]);

  // Clear selection when filter changes
  useEffect(() => { setSelected(new Set()); }, [statusFilter, categoryFilter]);

  const filtered = useMemo(() => {
    if (!search) return listings;
    const q = search.toLowerCase();
    return listings.filter((l) =>
      l.title.toLowerCase().includes(q) ||
      l.seller.full_name.toLowerCase().includes(q) ||
      (l.seller.phone && l.seller.phone.includes(q))
    );
  }, [listings, search]);

  // ── Selection helpers ──────────────────────────────────────────────────────

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.public_id));
  const someSelected = filtered.some((l) => selected.has(l.public_id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.public_id)));
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Single actions ─────────────────────────────────────────────────────────

  const handleApprove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await listingsApi.approve(id);
      setListings((prev) => prev.map((l) => l.public_id === id ? { ...l, status: 'active' } : l));
      toast.success(t('success.approved'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await listingsApi.reject(id, reason || 'Rejected by admin');
      setListings((prev) => prev.map((l) => l.public_id === id ? { ...l, status: 'rejected' } : l));
      toast.success(t('success.rejected'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  // ── Bulk actions ───────────────────────────────────────────────────────────

  const bulkApprove = async () => {
    setBulkLoading('approve');
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      try {
        await listingsApi.approve(id);
        ok++;
      } catch { /* continue */ }
    }
    setListings((prev) => prev.map((l) =>
      selected.has(l.public_id) ? { ...l, status: 'active' } : l
    ));
    setSelected(new Set());
    setBulkLoading(null);
    toast.success(`${ok}/${ids.length} approved`);
  };

  const bulkReject = async (reason: string) => {
    setBulkLoading('reject');
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      try {
        await listingsApi.reject(id, reason || 'Rejected by admin');
        ok++;
      } catch { /* continue */ }
    }
    setListings((prev) => prev.map((l) =>
      selected.has(l.public_id) ? { ...l, status: 'rejected' } : l
    ));
    setSelected(new Set());
    setBulkLoading(null);
    setShowRejectModal(null);
    setRejectReason('');
    toast.success(`${ok}/${ids.length} rejected`);
  };

  const bulkRemove = async () => {
    if (!confirm(`Remove ${selected.size} listings?`)) return;
    setBulkLoading('remove');
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      try {
        await apiClient.delete(`/listings/${id}/delete/`);
        ok++;
      } catch { /* continue */ }
    }
    setListings((prev) => prev.filter((l) => !selected.has(l.public_id)));
    setSelected(new Set());
    setBulkLoading(null);
    toast.success(`${ok}/${ids.length} removed`);
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

        {/* Status tabs */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                statusFilter === s
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated hover:text-fg',
              )}
            >
              {s === 'all' ? t('common.all') : t(`listings.${s}` as any, { defaultValue: s })}
            </button>
          ))}
        </div>

        {/* Search + category filter */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="input-base h-11 w-full pl-11"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-base h-11 cursor-pointer"
          >
            <option value="">{t('common.all')} {t('listings.category' as any, { defaultValue: 'categories' })}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchListings}
            className="btn btn-secondary h-11"
            aria-label={t('common.refresh') ?? 'Refresh'}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} strokeWidth={1.75} />
          </button>
        </div>

        {/* Pending Buyer Confirmations (Admin) */}
        {pendingConfirmations.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-warning/30 bg-warning/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Pending Buyer Confirmations ({pendingConfirmations.length})</h3>
              <button onClick={fetchPendingConfirmations} className="text-xs text-fg-subtle hover:text-fg">Refresh</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-auto text-xs">
              {pendingConfirmations.slice(0, 5).map((c, i) => (
                <div key={i} className="flex justify-between bg-bg p-2 rounded">
                  <div>
                    <span className="font-mono">{c.code}</span> — {c.seller} for listing #{c.listing_public_id}
                  </div>
                  <div className="text-fg-subtle">{new Date(c.created_at).toLocaleDateString()}</div>
                </div>
              ))}
              {pendingConfirmations.length > 5 && <div className="text-center text-fg-subtle">... and {pendingConfirmations.length - 5} more</div>}
            </div>
            <p className="text-[10px] mt-1 text-fg-subtle">Buyers can confirm at /confirm-purchase using the code to make the sale count for trust_score.</p>
          </div>
        )}

        {/* Bulk actions bar */}
        <AnimatePresence>
          {someSelected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3"
            >
              <span className="text-sm font-semibold text-brand-primary">
                {selected.size} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={bulkApprove}
                  disabled={!!bulkLoading}
                  className="btn btn-sm bg-success/12 text-success hover:bg-success/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Approve selected
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setBulkLoading('approve'); // reusing bulk loading state to disable buttons
                    const ids = Array.from(selected);
                    let ok = 0;
                    for (const id of ids) {
                      try {
                        const res = await moderationApi.adminAIReviewListing(id);
                        if (!res.is_flagged) {
                          await listingsApi.approve(id);
                          ok++;
                        }
                      } catch { /* continue */ }
                    }
                    if (ok > 0) {
                      setListings((prev) => prev.map((l) =>
                        selected.has(l.public_id) && l.status === 'pending' ? { ...l, status: 'active' } : l
                      ));
                    }
                    setSelected(new Set());
                    setBulkLoading(null);
                    toast.success(`${ok}/${ids.length} AI tomonidan tasdiqlandi`);
                  }}
                  disabled={!!bulkLoading}
                  className="btn btn-sm bg-brand-accent/12 text-brand-accent hover:bg-brand-accent/20 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
                  AI Analysis
                </button>
                <button
                  type="button"
                  onClick={() => { setRejectReason(''); setShowRejectModal('bulk'); }}
                  disabled={!!bulkLoading}
                  className="btn btn-sm bg-danger/12 text-danger hover:bg-danger/20 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Reject selected
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto text-xs text-fg-subtle hover:text-fg"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="surface-elevated mt-5 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="skeleton h-10 w-10 rounded-lg" />
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
                    <th className="w-10 px-4 py-3.5">
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="flex items-center justify-center text-fg-subtle hover:text-fg"
                        aria-label="Select all"
                      >
                        {allSelected
                          ? <CheckSquare className="h-4 w-4 text-brand-primary" strokeWidth={2} />
                          : someSelected
                          ? <MinusSquare className="h-4 w-4 text-brand-primary" strokeWidth={2} />
                          : <Square className="h-4 w-4" strokeWidth={2} />}
                      </button>
                    </th>
                    {[
                      t('listings.title2'),
                      t('listings.seller'),
                      t('listings.price'),
                      t('listings.location'),
                      t('admin.pending'),
                      '',
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={cn(
                          'px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle',
                          i === 5 && 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((l, i) => {
                    const isSelected = selected.has(l.public_id);
                    const primaryImg = l.primary_image?.image_url || l.primary_image?.image || l.images?.[0]?.image_url || l.images?.[0]?.image;
                    return (
                      <motion.tr
                        key={l.public_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03 }}
                        className={cn(
                          'group cursor-pointer transition-colors hover:bg-bg-subtle',
                          isSelected && 'bg-brand-primary/5',
                        )}
                        onClick={() => (window.location.href = `/admin/listings/${l.public_id}`)}
                      >
                        <td className="w-10 px-4 py-4" onClick={(e) => { e.stopPropagation(); toggleOne(l.public_id); }}>
                          <button
                            type="button"
                            className="flex items-center justify-center text-fg-subtle hover:text-fg"
                            aria-label={`Select listing ${l.public_id}`}
                          >
                            {isSelected
                              ? <CheckSquare className="h-4 w-4 text-brand-primary" strokeWidth={2} />
                              : <Square className="h-4 w-4" strokeWidth={2} />}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {primaryImg ? (
                              <Image
                                src={primaryImg}
                                alt={l.title}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-bg-subtle flex items-center justify-center flex-shrink-0">
                                <LayoutGrid className="h-4 w-4 text-fg-subtle" strokeWidth={1.5} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-fg line-clamp-1">{l.title}</p>
                              <p className="text-xs text-fg-subtle">{formatRelativeTime(l.created_at)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-fg">{l.seller.full_name}</p>
                          {l.seller.phone && (
                            <p className="text-xs text-fg-subtle">{l.seller.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-fg">{formatPrice(l.price, l.currency)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-fg-muted">{l.location}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant={STATUS_BADGE[l.status] ?? 'default'}
                            size="sm"
                          >
                            {t(`listings.${l.status}` as any, { defaultValue: l.status })}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); window.location.href = `/admin/listings/${l.public_id}`; }}
                              className="btn btn-sm btn-secondary"
                              aria-label="View listing"
                            >
                              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                            {l.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      toast.info('AI tahlil qilmoqda...');
                                      const res = await moderationApi.adminAIReviewListing(l.public_id);
                                      if (!res.is_flagged) {
                                        await listingsApi.approve(l.public_id);
                                        setListings((prev) => prev.map((item) => item.public_id === l.public_id ? { ...item, status: 'active' } : item));
                                        toast.success('AI tomonidan tasdiqlandi!');
                                      } else {
                                        toast.error(`AI rad etdi: ${res.explanation}`);
                                      }
                                    } catch {
                                      toast.error('AI xatosi');
                                    }
                                  }}
                                  className="btn btn-sm bg-brand-accent/12 text-brand-accent hover:bg-brand-accent/20"
                                  aria-label="AI Review"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleApprove(l.public_id, e)}
                                  className="btn btn-sm bg-success/12 text-success hover:bg-success/20"
                                  aria-label="Approve"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setRejectReason(''); setShowRejectModal(l.public_id); }}
                                  className="btn btn-sm bg-danger/12 text-danger hover:bg-danger/20"
                                  aria-label="Reject"
                                >
                                  <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="surface-elevated w-full max-w-md p-6">
            <h2 className="display-sm mb-4">
              {showRejectModal === 'bulk'
                ? `Reject ${selected.size} listings`
                : 'Reject listing'}
            </h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('admin.rejectionReasonPlaceholder') ?? 'Rad etish sababi (Majburiy)'}
              rows={3}
              className="input-base h-auto w-full py-3"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="btn btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={!!bulkLoading}
                onClick={() => {
                  if (showRejectModal === 'bulk') {
                    bulkReject(rejectReason);
                  } else {
                    handleReject(showRejectModal as number, rejectReason);
                    setShowRejectModal(null);
                    setRejectReason('');
                  }
                }}
                className="btn btn-primary flex-1"
              >
                {t('success.rejected')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
