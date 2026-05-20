'use client';

/**
 * Admin Broadcast Detail.
 *
 * View, edit (drafts/scheduled only), preview every translation, send,
 * delete. Translations of title/message are rendered for each of the
 * 4 supported locales so the admin can verify the auto-translation.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Send,
  Trash2,
  Loader2,
  Save,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { TranslatableText } from '@/components/shared/TranslateButton';
import apiClient from '@/lib/api/client';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

interface Broadcast {
  public_id: number;
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
  original_locale: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  target_all: boolean;
  target_status?: string;
  created_at: string;
  scheduled_at?: string | null;
  sent_at?: string | null;
  recipient_count: number;
  read_count: number;
}

export default function AdminBroadcastDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [b, setB] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'send' | 'delete' | 'save' | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [originalLocale, setOriginalLocale] = useState('uz');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/notifications/broadcasts/${id}/`);
      const data = res.data as Broadcast;
      setB(data);
      setTitle(data.title || '');
      setMessage(data.message || '');
      setOriginalLocale(data.original_locale || 'uz');
    } catch {
      setB(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(id)) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const send = async () => {
    if (!b) return;
    setSubmitting('send');
    try {
      await apiClient.post(`/notifications/broadcasts/${b.public_id}/send/`);
      toast.success(t('admin.broadcastSent' as any) ?? 'Broadcast sent');
      await fetchAll();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const remove = async () => {
    if (!b) return;
    if (!confirm(t('common.delete') + '?')) return;
    setSubmitting('delete');
    try {
      await apiClient.delete(`/notifications/broadcasts/${b.public_id}/`);
      toast.success(t('success.deleted' as any) ?? t('success.updated'));
      router.push('/admin/broadcasts');
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  const save = async () => {
    if (!b) return;
    setSubmitting('save');
    try {
      const res = await apiClient.patch(`/notifications/broadcasts/${b.public_id}/`, {
        title: title.trim(),
        message: message.trim(),
        original_locale: originalLocale,
      });
      setB(res.data);
      setEditing(false);
      toast.success(t('success.updated'));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-page py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
        </div>
      </AdminLayout>
    );
  }

  if (!b) {
    return (
      <AdminLayout>
        <div className="container-page py-10">
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

  const isSent = b.status === 'sent';

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
            <div className="surface-elevated p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-eyebrow">{t('admin.broadcast' as any) ?? 'Broadcast'}</p>
                  <h1 className="display-md mt-2">#{b.public_id}</h1>
                </div>
                <Badge
                  variant={isSent ? 'success' : b.status === 'draft' ? 'default' : 'warning'}
                  size="md"
                >
                  {b.status}
                </Badge>
              </div>

              {!editing ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <h2 className="text-eyebrow">{t('admin.title' as any) ?? 'Title'}</h2>
                    <p className="mt-1 font-display text-xl font-semibold text-fg">{b.title}</p>
                  </div>
                  <div>
                    <h2 className="text-eyebrow">{t('admin.message' as any) ?? 'Message'}</h2>
                    <p className="mt-1 whitespace-pre-line text-fg-muted leading-relaxed">{b.message}</p>
                  </div>
                  <p className="text-xs text-fg-subtle">
                    {t('admin.originalLocale' as any) ?? 'Original'}: <strong>{b.original_locale}</strong>
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('admin.title' as any) ?? 'Title'}
                    className="input-base h-12 w-full"
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('admin.message' as any) ?? 'Message'}
                    rows={6}
                    className="input-base h-auto w-full py-3"
                  />
                  <div>
                    <label className="text-xs text-fg-subtle">
                      {t('admin.originalLocale' as any) ?? 'Original locale'}
                    </label>
                    <select
                      value={originalLocale}
                      onChange={(e) => setOriginalLocale(e.target.value)}
                      className="input-base h-11 w-32 mt-1"
                    >
                      <option value="uz">uz</option>
                      <option value="uz_cyrl">uz-cyrl</option>
                      <option value="ru">ru</option>
                      <option value="en">en</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Translations preview */}
            <div className="surface-elevated p-6">
              <h2 className="display-sm mb-4">{t('admin.translations' as any) ?? 'Translations'}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(['uz', 'uz_cyrl', 'ru', 'en'] as const).map((loc) => (
                  <div key={loc} className="rounded-xl border border-border bg-bg-subtle p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">{loc}</p>
                    <p className="mt-2 font-semibold text-fg">
                      {(b as any)[`title_${loc}`] || b.title}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted whitespace-pre-line">
                      {(b as any)[`message_${loc}`] || b.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="surface-elevated p-6">
              <h3 className="text-eyebrow">{t('admin.delivery' as any) ?? 'Delivery'}</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {t('admin.recipients' as any) ?? 'Recipients'}
                  </dt>
                  <dd className="font-semibold text-fg">{b.recipient_count}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('admin.read' as any) ?? 'Read'}
                  </dt>
                  <dd className="font-semibold text-fg">{b.read_count}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {t('admin.created' as any) ?? 'Created'}
                  </dt>
                  <dd className="font-semibold text-fg">{formatRelativeTime(b.created_at)}</dd>
                </div>
                {b.sent_at && (
                  <div className="flex items-center justify-between">
                    <dt className="text-fg-muted">{t('admin.sentAt' as any) ?? 'Sent'}</dt>
                    <dd className="font-semibold text-fg">{formatDate(b.sent_at)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="surface-elevated p-6">
              <h3 className="text-eyebrow">{t('admin.actions' as any) ?? 'Actions'}</h3>
              <div className="mt-3 space-y-2">
                {!isSent && !editing && (
                  <button onClick={() => setEditing(true)} className="btn btn-secondary w-full">
                    {t('common.edit')}
                  </button>
                )}
                {editing && (
                  <button
                    onClick={save}
                    disabled={submitting === 'save'}
                    className="btn btn-primary w-full"
                  >
                    {submitting === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('common.save')}
                  </button>
                )}
                {!isSent && (
                  <button
                    onClick={send}
                    disabled={submitting === 'send'}
                    className="btn btn-primary w-full"
                  >
                    {submitting === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t('admin.send' as any) ?? 'Send'}
                  </button>
                )}
                {!isSent && (
                  <button
                    onClick={remove}
                    disabled={submitting === 'delete'}
                    className="btn btn-danger w-full"
                  >
                    {submitting === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
