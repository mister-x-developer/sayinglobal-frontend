'use client';

/**
 * Admin Ratings Moderation Queue.
 * Shows reviews flagged by users (report_count > 0) and lets admins
 * hide/unhide or delete them. Admin can also add a moderation note
 * (auto-translated to 4 languages) visible to the reviewer.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TranslatableText } from '@/components/shared/TranslateButton';
import { toast } from '@/components/ui/Toast';
import { ratingsApi, type RatingRecord } from '@/lib/api/ratings';
import { formatRelativeTime } from '@/lib/utils/format';

export default function AdminRatingsPage() {
  const t = useTranslations();
  const [items, setItems] = useState<RatingRecord[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ratingsApi.adminList({ pageSize: 50 });
      setItems(data.results);
      setCount(data.count);
    } catch {
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (r: RatingRecord) => {
    try {
      const updated = await ratingsApi.update(r.public_id, { is_hidden: !r.is_hidden });
      setItems((prev) => prev.map((it) => it.public_id === r.public_id ? updated : it));
      toast.success(t('success.updated'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const remove = async (r: RatingRecord) => {
    if (!confirm(t('common.delete') + '?')) return;
    try {
      await ratingsApi.remove(r.public_id);
      setItems((prev) => prev.filter((it) => it.public_id !== r.public_id));
      toast.success(t('success.deleted' as any) ?? t('success.updated'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-eyebrow">{t('admin.title')}</p>
            <h1 className="display-md mt-2">{t('reviews.moderation' as any) ?? 'Reviews Moderation'}</h1>
            <p className="mt-2 text-fg-muted">{count} {t('admin.flagged' as any) ?? 'flagged'}</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="btn btn-secondary h-10"
            aria-label={t('common.refresh') ?? 'Refresh'}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>
        </div>

        <div className="surface-elevated mt-6 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-fg-muted">
              <Flag className="mx-auto h-8 w-8 opacity-30" strokeWidth={1.5} />
              <p className="mt-3 text-sm">{t('empty.noActivity')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((r, i) => (
                <motion.li
                  key={r.public_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className={`px-5 py-4 ${r.is_hidden ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={r.buyer?.avatar_url}
                      name={r.buyer?.full_name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-fg">
                          {r.buyer?.full_name ?? '—'} → {r.seller?.full_name ?? '—'}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-3 w-3 ${n <= r.score ? 'fill-warning text-warning' : 'text-border-strong'}`}
                              strokeWidth={1.75}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-fg-subtle">{formatRelativeTime(r.created_at)}</span>
                        <Badge variant="warning" size="sm">
                          <Flag className="h-2.5 w-2.5" />
                          {r.report_count}
                        </Badge>
                        {r.is_hidden && (
                          <Badge variant="default" size="sm">hidden</Badge>
                        )}
                        {r.is_edited && (
                          <Badge variant="default" size="sm">edited</Badge>
                        )}
                      </div>

                      {r.review && (
                        <div className="mt-2">
                          <TranslatableText
                            text={r.review}
                            sourceLocale={r.original_locale}
                            textClassName="text-sm text-fg-muted"
                          />
                        </div>
                      )}

                      {r.listing_title && (
                        <p className="mt-1 text-xs text-fg-subtle">
                          {t('listings.title') + ': ' + r.listing_title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggle(r)}
                        className={`btn btn-sm ${r.is_hidden ? 'bg-success/12 text-success' : 'bg-fg-subtle/10 text-fg-muted'}`}
                        title={r.is_hidden ? 'Unhide' : 'Hide'}
                      >
                        {r.is_hidden
                          ? <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                          : <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        className="btn btn-sm bg-danger/10 text-danger hover:bg-danger/20"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
