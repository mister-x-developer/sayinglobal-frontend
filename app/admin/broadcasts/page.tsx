'use client';

/**
 * Admin Broadcasts — list + create.
 * Full multilingual: admin writes in their language; backend auto-translates
 * to all 4 locales and stores per-language fields.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Megaphone,
  Plus,
  Send,
  Loader2,
  Clock,
  Users,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import apiClient from '@/lib/api/client';
import { formatRelativeTime } from '@/lib/utils/format';

interface BroadcastItem {
  public_id: number;
  title: string;
  status: string;
  target_all: boolean;
  created_at: string;
  sent_at?: string | null;
  recipient_count: number;
  read_count: number;
}

const STATUS_BADGE: Record<string, any> = {
  draft: 'default',
  scheduled: 'warning',
  sent: 'success',
  cancelled: 'error',
};

export default function AdminBroadcastsPage() {
  const t = useTranslations();

  const [list, setList] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<number | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications/broadcasts/');
      const data = res.data;
      setList(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error(t('errors.required'));
      return;
    }
    setCreating(true);
    try {
      await apiClient.post('/notifications/broadcasts/create/', {
        title: newTitle.trim(),
        message: newMessage.trim(),
        target_all: true,
        // original_locale is auto-detected on the backend from the text
      });
      setNewTitle('');
      setNewMessage('');
      setShowForm(false);
      toast.success(t('success.created' as any) ?? t('success.updated'));
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setCreating(false);
    }
  };

  const sendBroadcast = async (b: BroadcastItem) => {
    setSending(b.public_id);
    try {
      await apiClient.post(`/notifications/broadcasts/${b.public_id}/send/`);
      toast.success(t('admin.broadcastSent' as any) ?? 'Sent');
      await load();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSending(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container-page py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <p className="text-eyebrow">{t('admin.title')}</p>
            <h1 className="display-md mt-2">{t('admin.broadcasts')}</h1>
            <p className="mt-2 text-fg-muted">{list.length}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="btn btn-secondary h-10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              {t('admin.createBroadcast' as any) ?? 'New'}
            </button>
          </div>
        </motion.div>

        {/* Create form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="surface-elevated mt-5 p-6"
          >
            <h2 className="display-sm mb-4">{t('admin.createBroadcast' as any) ?? 'Create Broadcast'}</h2>
            <div className="space-y-4">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('admin.broadcastTitle' as any) ?? 'Title'}
                className="input-base h-12 w-full"
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('admin.broadcastMessage' as any) ?? 'Message'}
                rows={5}
                className="input-base h-auto w-full py-3"
              />
              <p className="text-xs text-fg-muted">
                {t('admin.autoTranslateHint' as any) ?? 'Content will be auto-translated to all 4 languages.'}
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={create} disabled={creating} className="btn btn-primary">
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                  )}
                  {t('common.save')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* List */}
        <div className="surface-elevated mt-5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" strokeWidth={2} />
            </div>
          ) : list.length === 0 ? (
            <div className="py-16 text-center text-fg-muted">
              <Megaphone className="mx-auto h-8 w-8 opacity-30" strokeWidth={1.5} />
              <p className="mt-3 text-sm">{t('empty.noActivity')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle">
                    {[
                      t('admin.broadcastTitle' as any) ?? 'Title',
                      t('admin.status' as any) ?? 'Status',
                      t('admin.recipients' as any) ?? 'Recipients',
                      t('admin.read' as any) ?? 'Read',
                      t('admin.created' as any) ?? 'Created',
                      '',
                    ].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle ${i === 5 ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list.map((b, i) => (
                    <motion.tr
                      key={b.public_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="group transition-colors hover:bg-bg-subtle"
                    >
                      <td className="px-5 py-4">
                        <Link href={`/admin/broadcasts/${b.public_id}`} className="font-semibold text-fg hover:text-brand-primary transition-colors">
                          {b.title}
                        </Link>
                        <p className="text-xs text-fg-subtle">{formatRelativeTime(b.created_at)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={STATUS_BADGE[b.status] ?? 'default'} size="sm">
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-fg">
                            <Users className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                            <span>{b.recipient_count}</span>
                          </div>
                          {b.recipient_count > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-bg-subtle overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-success"
                                  style={{ width: `${Math.min((b.read_count / b.recipient_count) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-fg-subtle">
                                {b.read_count}/{b.recipient_count} read
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-sm text-fg">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />
                          {b.read_count}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-fg-muted">
                        {b.sent_at ? (
                          <span className="inline-flex items-center gap-1">
                            <Send className="h-3 w-3 text-success" />
                            {formatRelativeTime(b.sent_at)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t('admin.notSentYet' as any) ?? 'Not sent'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <Link href={`/admin/broadcasts/${b.public_id}`} className="btn btn-secondary btn-sm">
                            {t('common.view')}
                          </Link>
                          {b.status !== 'sent' && (
                            <button
                              type="button"
                              onClick={() => sendBroadcast(b)}
                              disabled={sending === b.public_id}
                              className="btn btn-primary btn-sm"
                            >
                              {sending === b.public_id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                              ) : (
                                <Send className="h-3.5 w-3.5" strokeWidth={2} />
                              )}
                              {t('admin.send' as any) ?? 'Send'}
                            </button>
                          )}
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
