'use client';

/**
 * Single notification detail.
 *
 * Shows the full multilingual notification body in the user's interface
 * language (with TranslateButton fallback for the original).
 */

import { Suspense,  useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Bell, Loader2, Clock, Check } from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Badge } from '@/components/ui/Badge';
import { TranslatableText } from '@/components/shared/TranslateButton';
import { notificationsApi } from '@/lib/api/notifications';
import type { Notification } from '@/lib/api/notifications';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

interface NotificationRecord {
  public_id: number;
  notification_type: string;
  title: string;
  title_uz?: string;
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  message: string;
  message_uz?: string;
  message_uz_cyrl?: string;
  message_ru?: string;
  message_en?: string;
  original_locale?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string | null;
}

function localized(o: any, base: string, locale: string): string {
  const norm = (locale || 'uz').replace('-', '_').toLowerCase();
  return o?.[`${base}_${norm}`] || o?.[`${base}_uz`] || o?.[base] || '';
}

function NotificationDetailPageContent() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));

  const [n, setN] = useState<NotificationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    let alive = true;
    setLoading(true);
    notificationsApi
      .getById(id)
      .then((data) => alive && setN(data))
      .catch(() => alive && setN(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  // Auto-mark as read.
  useEffect(() => {
    if (n && !n.is_read) {
      notificationsApi.markRead(id).catch(() => {});
    }
  }, [n, id]);

  const title = n ? localized(n, 'title', locale) : '';
  const message = n ? localized(n, 'message', locale) : '';

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm -ml-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>

          {loading ? (
            <div className="mt-8 flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
            </div>
          ) : !n ? (
            <div className="mt-8 surface-elevated p-8 text-center text-fg-muted">
              {t('marketplace.noResults')}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 mx-auto max-w-2xl"
            >
              <div className="surface-elevated p-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <Bell className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h1 className="display-sm">{title}</h1>
                      {n.is_read ? (
                        <Badge variant="default" size="sm">
                          <Check className="h-3 w-3" /> {t('notifications.read' as any) ?? 'Read'}
                        </Badge>
                      ) : (
                        <Badge variant="info" size="sm">
                          {t('notifications.unread' as any) ?? 'New'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                      <Clock className="h-3 w-3" />
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="whitespace-pre-line text-fg-muted leading-relaxed">{message}</p>
                </div>

                {n.action_url && (
                  <Link href={n.action_url} className="btn btn-primary btn-sm mt-5">
                    {t('common.view')}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}


export default function NotificationDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-8"><div className="spinner"></div></div>}>
      <NotificationDetailPageContent />
    </Suspense>
  );
}
