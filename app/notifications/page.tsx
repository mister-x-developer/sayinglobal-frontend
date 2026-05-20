'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Bell,
  MessageSquareText,
  Heart,
  Users,
  Star,
  ShieldCheck,
  Package,
  Megaphone,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { NotificationSkeleton } from '@/components/shared/LoadingStates';
import { useAuthStore } from '@/lib/store/auth';
import { useNotificationsStore } from '@/lib/store/notifications';
import { notificationsApi } from '@/lib/api/notifications';
import type { Notification, NotificationType } from '@/lib/api/notifications';
import { formatRelativeTime } from '@/lib/utils/format';

type Filter = 'all' | 'unread' | 'messages' | 'listings' | 'social';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  message_received: MessageSquareText,
  listing_favorite: Heart,
  listing_comment: MessageSquareText,
  listing_sold: Package,
  listing_expired: Package,
  follow: Users,
  rating: Star,
  complaint_update: ShieldCheck,
  admin_message: Megaphone,
  system: Bell,
};

const TYPE_TONE: Record<NotificationType, string> = {
  message_received: 'bg-info/12 text-info',
  listing_favorite: 'bg-danger/12 text-danger',
  listing_comment: 'bg-brand-primary/10 text-brand-primary',
  listing_sold: 'bg-success/12 text-success',
  listing_expired: 'bg-warning/12 text-warning',
  follow: 'bg-brand-accent/12 text-brand-accent',
  rating: 'bg-warning/12 text-warning',
  complaint_update: 'bg-danger/12 text-danger',
  admin_message: 'bg-brand-primary/10 text-brand-primary',
  system: 'bg-bg-subtle text-fg-muted',
};

function matchesFilter(n: Notification, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'unread') return !n.is_read;
  if (filter === 'messages') return n.notification_type === 'message_received';
  if (filter === 'listings') return ['listing_comment', 'listing_favorite', 'listing_sold', 'listing_expired'].includes(n.notification_type);
  if (filter === 'social') return ['follow', 'rating'].includes(n.notification_type);
  return true;
}

export default function NotificationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, setItems, markRead, markAllRead, remove } = useNotificationsStore();
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/auth');
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    notificationsApi
      .list()
      .then((data) => {
        if (!alive) return;
        setItems(data ?? []);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [setItems]);

  const handleMarkRead = async (id: number) => {
    markRead(id);
    await notificationsApi.markRead(id);
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    await notificationsApi.markAllRead();
  };

  const handleRemove = async (id: number) => {
    remove(id);
    await notificationsApi.deleteNotification(id);
  };

  const filtered = items.filter((n) => matchesFilter(n, filter));
  const unreadCount = items.filter((n) => !n.is_read).length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'unread', label: `${t('notifications.title')} (${unreadCount})` },
    { key: 'messages', label: t('chat.title') },
    { key: 'listings', label: t('listings.title') },
    { key: 'social', label: t('sellers.title') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <p className="text-eyebrow">{t('notifications.title')}</p>
              <h1 className="display-md mt-2">{t('notifications.title')}</h1>
              {unreadCount > 0 && (
                <p className="mt-2 text-fg-muted">
                  {unreadCount} {t('notifications.title').toLowerCase()}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn btn-secondary btn-sm"
              >
                <CheckCheck className="h-4 w-4" strokeWidth={1.75} />
                {t('notifications.markAllRead')}
              </button>
            )}
          </motion.div>

          {/* Filter tabs */}
          <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-border pb-0">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`relative h-11 flex-shrink-0 px-4 text-sm font-semibold transition-colors ${
                    active ? 'text-brand-primary' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {f.label}
                  {active && (
                    <motion.span
                      layoutId="notif-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <NotificationSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={t('empty.noNotifications')}
                description={t('empty.noNotificationsDescription')}
              />
            ) : (
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {filtered.map((n) => (
                    <NotificationRow
                      key={n.public_id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onRemove={handleRemove}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NotificationRow({
  notification: n,
  onMarkRead,
  onRemove,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const t = useTranslations();
  const Icon = TYPE_ICON[n.notification_type] ?? Bell;
  const tone = TYPE_TONE[n.notification_type] ?? 'bg-bg-subtle text-fg-muted';

  const inner = (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition-colors ${
        n.is_read
          ? 'border-border bg-bg-elevated hover:bg-bg-subtle'
          : 'border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary/8'
      }`}
      onClick={() => !n.is_read && onMarkRead(n.public_id)}
    >
      {/* Unread dot */}
      {!n.is_read && (
        <span className="absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand-primary" />
      )}

      {/* Icon or avatar */}
      <div className="flex-shrink-0 pl-3">
        {n.from_user ? (
          <div className="relative">
            <Avatar src={n.from_user.avatar_url} name={n.from_user.full_name} size="md" />
            <span className={`absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-3 w-3" strokeWidth={2.25} />
            </span>
          </div>
        ) : (
          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${n.is_read ? 'text-fg' : 'text-fg'}`}>
          {n.title}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{n.message}</p>
        <p className="mt-1.5 text-xs text-fg-subtle">{formatRelativeTime(n.created_at)}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!n.is_read && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMarkRead(n.public_id); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle hover:text-brand-primary"
            aria-label={t('notifications.markAllRead')}
          >
            <CheckCheck className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(n.public_id); }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle hover:bg-danger/10 hover:text-danger"
          aria-label={t('common.delete')}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );

  if (n.action_url) {
    return (
      <Link href={n.action_url} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <Link href={`/notifications/${n.public_id}`} className="block">
      {inner}
    </Link>
  );
}
