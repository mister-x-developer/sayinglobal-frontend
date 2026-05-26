'use client';

/**
 * Admin AI Moderation Queue — shows AI-flagged listings and reports.
 * AI is an assistant. Human moderators make final decisions.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Bot, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';
import { formatRelativeTime } from '@/lib/utils/format';

interface AIResult {
  id: string;
  target_type: 'listing' | 'report';
  target_id: string;
  confidence_score: number;
  flags: string[];
  explanation: string;
  explanation_uz: string;
  report_priority_score: number;
  is_flagged: boolean;
  needs_review: boolean;
  human_reviewed: boolean;
  human_decision: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function AdminAIModerationPage() {
  const [results, setResults] = useState<AIResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'needs_review' | 'reviewed'>('needs_review');
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter === 'needs_review') params.needs_review = 'true';
      const { data } = await apiClient.get('/ai-moderation/results/', { params });
      setResults((data as any).results ?? []);
    } catch {
      toast.error('Failed to load AI results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id: string, decision: 'approved' | 'confirmed' | 'dismissed') => {
    setReviewing(id);
    try {
      await apiClient.post(`/ai-moderation/results/${id}/review/`, { decision });
      toast.success('Review saved');
      await load();
    } catch {
      toast.error('Review failed');
    } finally {
      setReviewing(null);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 0.8) return 'text-danger';
    if (score >= 0.5) return 'text-warning';
    return 'text-success';
  };

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-brand-primary" strokeWidth={1.75} />
            <div>
              <p className="text-eyebrow">Admin</p>
              <h1 className="display-md mt-1">AI Moderatsiya</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-fg-muted">
            AI yordamchi — yakuniy qaror moderator tomonidan qabul qilinadi.
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">✓ Tasdiqlash = E'lon xavfsiz</span>
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">⚠ Rad etish = Muammo bor</span>
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['needs_review', 'all', 'reviewed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated'
              }`}
            >
              {f === 'needs_review' ? 'Ko\'rib chiqish kerak' : f === 'all' ? 'Hammasi' : 'Ko\'rib chiqilgan'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : results.length === 0 ? (
          <div className="surface-elevated p-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" strokeWidth={1.5} />
            <p className="mt-3 font-semibold text-fg">Hamma narsa tekshirilgan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="surface-elevated p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`font-display text-2xl font-bold ${scoreColor(r.confidence_score)}`}>
                      {Math.round(r.confidence_score * 100)}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={r.target_type === 'listing' ? 'primary' : 'warning'}
                          size="sm"
                        >
                          {r.target_type === 'listing' ? "E'lon" : 'Shikoyat'}
                        </Badge>
                        <span className="text-sm font-semibold text-fg">#{r.target_id}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.flags.map((flag) => (
                          <span
                            key={flag}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              flag === 'clean'
                                ? 'bg-success/10 text-success'
                                : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.target_type === 'listing' && (
                      <Link
                        href={`/admin/listings/${r.target_id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Ko'rish
                      </Link>
                    )}
                    {!r.human_reviewed && (
                      <>
                        <button
                          onClick={() => review(r.id, 'dismissed')}
                          disabled={reviewing === r.id}
                          className="btn btn-sm bg-success/12 text-success hover:bg-success/20 border border-success/30"
                        >
                          {reviewing === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Tasdiqlash (Xavfsiz)
                        </button>
                        <button
                          onClick={() => review(r.id, 'confirmed')}
                          disabled={reviewing === r.id}
                          className="btn btn-sm bg-danger/12 text-danger hover:bg-danger/20 border border-danger/30"
                        >
                          {reviewing === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                          Rad etish (Muammo bor)
                        </button>
                      </>
                    )}
                    {r.human_reviewed && (
                      <Badge
                        variant={r.human_decision === 'confirmed' ? 'error' : 'success'}
                        size="sm"
                      >
                        {r.human_decision}
                      </Badge>
                    )}
                  </div>
                </div>

                {r.explanation_uz && (
                  <p className="mt-3 text-sm text-fg-muted border-t border-border pt-3">
                    {r.explanation_uz || r.explanation}
                  </p>
                )}

                <p className="mt-2 text-xs text-fg-subtle">
                  {formatRelativeTime(r.created_at)}
                  {r.reviewed_by_name && ` · Ko'rib chiqdi: ${r.reviewed_by_name}`}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
