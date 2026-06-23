'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Package, Plus, Trash2, Edit, XCircle, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { listingsApi } from '@/lib/api/listings';
import { toast } from '@/components/ui/Toast';

type ListingStatus = 'active' | 'sold' | 'pending' | 'pending_review' | 'rejected' | 'draft' | 'archived' | 'expired';

export interface MyListing extends ListingCardData {
  status: ListingStatus;
  rejection_reason?: string;
  rejection_reason_uz?: string;
  rejection_reason_uz_cyrl?: string;
  rejection_reason_ru?: string;
  rejection_reason_en?: string;
}

interface Props {
  initialListings: MyListing[];
  loading: boolean;
}

export function MyListingsManager({ initialListings, loading }: Props) {
  const t = useTranslations();
  const [listings, setListings] = useState<MyListing[]>(initialListings);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'sold' | 'pending' | 'rejected' | 'draft'>('all');
  const [isMutating, setIsMutating] = useState<string | null>(null);

  // Sync state if initialListings changes
  useEffect(() => {
    setListings(initialListings);
  }, [initialListings]);

  const hasKey = (key: string) => {
    try {
      return t.has(key as any);
    } catch {
      return false;
    }
  };

  const TABS = [
    { key: 'all', label: hasKey('profile.allListings') ? t('profile.allListings' as any) : 'Barchasi' },
    { key: 'active', label: hasKey('profile.activeListings') ? t('profile.activeListings' as any) : 'Sotuvdagi' },
    { key: 'sold', label: hasKey('profile.soldListings') ? t('profile.soldListings' as any) : 'Sotilgan' },
    { key: 'pending', label: hasKey('listings.statusPending') ? t('listings.statusPending' as any) : 'Tekshiruvda' },
    { key: 'rejected', label: hasKey('listings.statusRejected') ? t('listings.statusRejected' as any) : 'Rad etilgan' },
    { key: 'draft', label: hasKey('listings.statusDraft') ? t('listings.statusDraft' as any) : 'Qoralama/Boshqa' },
  ] as const;

  const filteredListings = listings.filter((l) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return l.status === 'active';
    if (activeTab === 'sold') return l.status === 'sold';
    if (activeTab === 'pending') return l.status === 'pending' || l.status === 'pending_review';
    if (activeTab === 'rejected') return l.status === 'rejected';
    if (activeTab === 'draft') return ['draft', 'archived', 'expired'].includes(l.status);
    return true;
  });

  const handleAction = async (action: string, publicId: number | string) => {
    if (isMutating) return;
    setIsMutating(String(publicId));

    try {
      if (action === 'delete') {
        if (!confirm(t('listings.deleteConfirm' as any) || "Ushbu e'lonni o'chirishni xohlaysizmi?")) return;
        await listingsApi.delete(publicId);
        setListings((prev) => prev.filter((l) => l.public_id !== publicId));
        toast.success(t('success.deleted' as any) || "O'chirildi");
      } 
      else if (action === 'markSold') {
        if (!confirm(t('listings.markSoldConfirm' as any) || "E'lonni sotildi deb belgilaysizmi?")) return;
        await listingsApi.markSold(publicId);
        setListings((prev) =>
          prev.map((l) => (l.public_id === publicId ? { ...l, status: 'sold' } : l))
        );
        toast.success(t('success.updated' as any) || "Sotildi deb belgilandi");
      }
      else if (action === 'cancelReview') {
        if (!confirm(t('listings.cancelReviewConfirm' as any) || "Tekshiruvni bekor qilasizmi? E'lon qoralamaga qaytadi.")) return;
        await listingsApi.cancelReview(publicId);
        setListings((prev) =>
          prev.map((l) => (l.public_id === publicId ? { ...l, status: 'draft' } : l))
        );
        toast.success(t('success.updated' as any) || "Tekshiruv bekor qilindi");
      }
      else if (action === 'restore') {
        if (!confirm(t('listings.restoreConfirm' as any) || "E'lonni qayta sotuvga qo'yasizmi? U yana tekshiruvdan o'tadi.")) return;
        await listingsApi.restore(publicId);
        setListings((prev) =>
          prev.map((l) => (l.public_id === publicId ? { ...l, status: 'pending_review' } : l))
        );
        toast.success(t('success.updated' as any) || "Sotuvga qaytarildi");
      }
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setIsMutating(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-elevated overflow-hidden rounded-2xl">
            <div className="aspect-[4/3] skeleton" />
            <div className="p-4"><div className="skeleton h-4 w-3/4" /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-2 min-w-max">
          {TABS.map((tb) => {
            const isActive = activeTab === tb.key;
            const count = tb.key === 'all' 
              ? listings.length 
              : listings.filter(l => {
                  if (tb.key === 'active') return l.status === 'active';
                  if (tb.key === 'sold') return l.status === 'sold';
                  if (tb.key === 'pending') return l.status === 'pending' || l.status === 'pending_review';
                  if (tb.key === 'rejected') return l.status === 'rejected';
                  if (tb.key === 'draft') return ['draft', 'archived', 'expired'].includes(l.status);
                  return false;
                }).length;

            return (
              <button
                key={tb.key}
                onClick={() => setActiveTab(tb.key as any)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated hover:text-fg'
                }`}
              >
                {tb.label}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-border/50 text-fg-subtle'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="popLayout">
        {filteredListings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
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
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredListings.map((l) => {
              const isMutatingThis = isMutating === String(l.public_id);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={l.public_id}
                  className="flex flex-col gap-2"
                >
                  <div className="relative">
                    <ListingCard listing={l as any} />
                    
                    {/* Status badge overlaid on top left */}
                    <div className="absolute top-3 left-3 z-10">
                      {l.status === 'active' && <span className="px-2 py-1 bg-success text-white text-xs font-bold rounded-md shadow-sm uppercase tracking-wide">Sotuvda</span>}
                      {l.status === 'sold' && <span className="px-2 py-1 bg-fg-muted text-white text-xs font-bold rounded-md shadow-sm uppercase tracking-wide">Sotilgan</span>}
                      {(l.status === 'pending' || l.status === 'pending_review') && <span className="px-2 py-1 bg-warning text-white text-xs font-bold rounded-md shadow-sm uppercase tracking-wide">Kutilmoqda</span>}
                      {l.status === 'rejected' && <span className="px-2 py-1 bg-danger text-white text-xs font-bold rounded-md shadow-sm uppercase tracking-wide">Rad etilgan</span>}
                      {['draft', 'archived', 'expired'].includes(l.status) && <span className="px-2 py-1 bg-bg-muted text-fg text-xs font-bold rounded-md shadow-sm uppercase tracking-wide border border-border">Qoralama</span>}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 px-1">
                    {/* Active Actions */}
                    {l.status === 'active' && (
                      <>
                        <Link href={`/listings/${l.public_id}/edit`} className="btn btn-secondary btn-sm flex-1">
                          <Edit className="w-4 h-4" /> Tahrirlash
                        </Link>
                        <button disabled={isMutatingThis} onClick={() => handleAction('markSold', l.public_id)} className="btn btn-success btn-sm flex-1">
                          <CheckCircle className="w-4 h-4" /> Sotildi
                        </button>
                      </>
                    )}

                    {/* Pending Actions */}
                    {(l.status === 'pending' || l.status === 'pending_review') && (
                      <button disabled={isMutatingThis} onClick={() => handleAction('cancelReview', l.public_id)} className="btn btn-warning btn-sm flex-1">
                        <XCircle className="w-4 h-4" /> Bekor qilish
                      </button>
                    )}

                    {/* Sold Actions */}
                    {l.status === 'sold' && (
                      <button disabled={isMutatingThis} onClick={() => handleAction('restore', l.public_id)} className="btn btn-primary btn-sm flex-1">
                        <RefreshCw className="w-4 h-4" /> Tiklash
                      </button>
                    )}

                    {/* Rejected / Draft Actions */}
                    {['rejected', 'draft', 'archived', 'expired'].includes(l.status) && (
                      <Link href={`/listings/${l.public_id}/edit`} className="btn btn-primary btn-sm flex-1">
                        <Edit className="w-4 h-4" /> Tahrirlash
                      </Link>
                    )}

                    {/* Common Delete Action */}
                    <button disabled={isMutatingThis} onClick={() => handleAction('delete', l.public_id)} className="btn btn-danger btn-sm px-3" aria-label="O'chirish">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rejection Reason display if rejected */}
                  {l.status === 'rejected' && l.rejection_reason && (
                    <div className="mt-2 bg-danger/10 text-danger text-sm p-3 rounded-lg flex items-start gap-2 border border-danger/20">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="flex-1">{l.rejection_reason_uz || l.rejection_reason}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
