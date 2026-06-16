'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Bot, CheckCircle2, AlertTriangle, Eye, RefreshCw, Shield } from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import apiClient from '@/lib/api/client';
import { formatRelativeTime } from '@/lib/utils/format';

interface AIResult {
  id: string;
  target_type: 'listing' | 'report';
  target_id: string;
  confidence_score: number;
  flags: string[];
  explanation: string;
  explanation_uz: string;
  human_reviewed: boolean;
  human_decision: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

type Filter = 'needs_review' | 'all' | 'reviewed';

export default function AdminAIModerationPage() {
  const t = useTranslations();
  const [results, setResults] = useState<AIResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('needs_review');
  // Track which specific action is in progress: `${id}-dismissed` or `${id}-confirmed`
  const [inProgress, setInProgress] = useState<string | null>(null);

  const load = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (f === 'needs_review') params.needs_review = 'true';
      if (f === 'reviewed') params.reviewed = 'true';
      const { data } = await apiClient.get('/ai-moderation/results/', { params });
      setResults((data as any).results ?? []);
    } catch {
      toast.error('Yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const review = async (id: string, decision: 'dismissed' | 'confirmed') => {
    const key = `${id}-${decision}`;
    if (inProgress) return; // prevent double-click
    setInProgress(key);
    try {
      await apiClient.post(`/ai-moderation/results/${id}/review/`, { decision });
      toast.success(decision === 'dismissed' ? '✓ Xavfsiz deb belgilandi' : '⚠ Muammo bor deb belgilandi');
      // Optimistically remove from list (or reload)
      setResults((prev) => prev.map((r) =>
        r.id === id
          ? { ...r, human_reviewed: true, human_decision: decision }
          : r
      ));
    } catch {
      toast.error('Xato yuz berdi. Qayta urining.');
    } finally {
      setInProgress(null);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 0.8) return 'text-danger';
    if (score >= 0.5) return 'text-warning';
    return 'text-success';
  };

  const scoreBg = (score: number) => {
    if (score >= 0.8) return 'bg-danger/10';
    if (score >= 0.5) return 'bg-warning/10';
    return 'bg-success/10';
  };

  const TABS: { key: Filter; label: string }[] = [
    { key: 'needs_review', label: "Ko'rib chiqish kerak" },
    { key: 'all', label: 'Hammasi' },
    { key: 'reviewed', label: "Ko'rib chiqilgan" },
  ];

  return (
    <AdminLayout>
      <div className="container-page py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Bot className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-eyebrow">{t('Admin.admin')}</p>
              <h1 className="display-md mt-0.5">{t('AI.moderation')}</h1>
            </div>
          </div>
          <button
            onClick={() => load(filter)}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            Yangilash
          </button>
        </div>

        {/* Legend */}
        <div className="mb-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
            Tasdiqlash = Eʼlon xavfsiz
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 border border-danger/20 px-3 py-1 text-xs font-semibold text-danger">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
            Rad etish = Muammo bor
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-6 border-b border-border pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative h-10 px-4 text-sm font-semibold transition-colors rounded-t-lg ${
                filter === tab.key
                  ? 'text-brand-primary bg-brand-primary/8'
                  : 'text-fg-muted hover:text-fg hover:bg-bg-subtle'
              }`}
            >
              {tab.label}
              {filter === tab.key && (
                <motion.span layoutId="ai-mod-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" strokeWidth={2} />
            <p className="text-sm text-fg-muted">{t('AI.loading')}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="surface-elevated p-16 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Shield className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-fg">{t('AI.allChecked')}</p>
            <p className="mt-1 text-sm text-fg-muted">{t('AI.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {results.map((r, i) => {
                const isDismissing = inProgress === `${r.id}-dismissed`;
                const isConfirming = inProgress === `${r.id}-confirmed`;
                const isAnyInProgress = !!inProgress;

                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
                    className={`surface-elevated overflow-hidden transition-all ${
                      r.human_reviewed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Left: score + info */}
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl ${scoreBg(r.confidence_score)}`}>
                            <span className={`font-display text-lg font-black ${scoreColor(r.confidence_score)}`}>
                              {Math.round(r.confidence_score * 100)}%
                            </span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={r.target_type === 'listing' ? 'primary' : 'warning'} size="sm">
                                {r.target_type === 'listing' ? "Eʼlon" : 'Shikoyat'}
                              </Badge>
                              <span className="text-sm font-bold text-fg font-mono">#{r.target_id}</span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {r.flags.map((flag) => (
                                <span key={flag} className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  flag === 'clean' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                                }`}>
                                  {flag.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {r.target_type === 'listing' && (
                            <Link href={`/admin/listings/detail?id=${r.target_id}`}
                              className="btn btn-secondary btn-sm">
                              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                              Ko'rish
                            </Link>
                          )}

                          {!r.human_reviewed ? (
                            <>
                              {/* SAFE button */}
                              <button
                                type="button"
                                onClick={() => review(r.id, 'dismissed')}
                                disabled={isAnyInProgress}
                                className={`btn btn-sm border transition-all ${
                                  isDismissing
                                    ? 'bg-success/20 border-success/40 text-success'
                                    : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                                } disabled:opacity-50`}
                              >
                                {isDismissing
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />}
                                Xavfsiz
                              </button>

                              {/* PROBLEM button */}
                              <button
                                type="button"
                                onClick={() => review(r.id, 'confirmed')}
                                disabled={isAnyInProgress}
                                className={`btn btn-sm border transition-all ${
                                  isConfirming
                                    ? 'bg-danger/20 border-danger/40 text-danger'
                                    : 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
                                } disabled:opacity-50`}
                              >
                                {isConfirming
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />}
                                Muammo bor
                              </button>
                            </>
                          ) : (
                            <Badge
                              variant={r.human_decision === 'confirmed' ? 'error' : 'success'}
                              size="sm"
                            >
                              {r.human_decision === 'confirmed' ? '⚠ Muammo' : '✓ Xavfsiz'}
                              {r.reviewed_by_name && ` · ${r.reviewed_by_name}`}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Explanation */}
                      {(r.explanation_uz || r.explanation) && (
                        <p className="mt-3 text-sm text-fg-muted border-t border-border/60 pt-3 leading-relaxed">
                          {r.explanation_uz || r.explanation}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-fg-subtle">
                        {formatRelativeTime(r.created_at)}
                        {r.reviewed_at && ` · Ko'rib chiqildi: ${formatRelativeTime(r.reviewed_at)}`}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
