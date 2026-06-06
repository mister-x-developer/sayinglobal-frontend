'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/components/ui/Toast';
import { moderationApi, type AdminReportRecord } from '@/lib/api/moderation';
import { Flag, RefreshCw, CheckCircle2, XCircle, Eye, Bot } from 'lucide-react';

export default function AdminModerationPage() {
  const t = useTranslations();
  const [reports, setReports] = useState<AdminReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'resolved_valid' | 'resolved_invalid'>('pending');
  const [selected, setSelected] = useState<AdminReportRecord | null>(null);
  const [notes, setNotes] = useState('');
  const [aiLoading, setAiLoading] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await moderationApi.adminList({ page_size: 100, status: statusFilter === 'all' ? undefined : statusFilter as any });
      setReports(data.results || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const startReview = async (r: AdminReportRecord) => {
    try {
      const updated = await moderationApi.adminStartReview(r.public_id);
      setReports(prev => prev.map(x => x.public_id === r.public_id ? { ...x, ...updated } as any : x));
      setSelected(updated as any);
      setNotes('');
      toast.success('Review started');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const resolve = async (valid: boolean) => {
    if (!selected) return;
    try {
      if (valid) {
        await moderationApi.adminResolveValid(selected.public_id, notes || 'Valid report');
      } else {
        await moderationApi.adminResolveInvalid(selected.public_id, notes || 'Invalid report');
      }
      toast.success(valid ? 'Resolved as valid' : 'Resolved as invalid');
      setSelected(null);
      setNotes('');
      fetchReports();
    } catch (e: any) { toast.error(e.message || 'Failed to resolve'); }
  };

  const runAI = async (id: number) => {
    setAiLoading(id);
    try {
      const res = await moderationApi.adminAIReviewReport(id);
      toast.success(`AI priority: ${res.priority_score?.toFixed(2)}`);
      if (res.explanation) toast.info(res.explanation.slice(0, 120));
    } catch {
      toast.error('AI review failed');
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow">Trust & Safety</p>
            <h1 className="display-md">Complaints &amp; Reports</h1>
          </div>
          <button onClick={fetchReports} className="btn btn-secondary h-10" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2">Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {(['all','pending','under_review','resolved_valid','resolved_invalid'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${statusFilter === s ? 'bg-brand-primary text-white' : 'bg-bg-subtle text-fg-muted hover:bg-bg-elevated'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="mt-6 surface-elevated overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-fg-muted">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8"><EmptyState icon={Flag} title="No reports" description="All clear in this filter." /></div>
          ) : (
            <div className="divide-y divide-border">
              {reports.map((r) => (
                <div key={r.public_id} className="flex items-center gap-4 p-4 hover:bg-bg-subtle/60 cursor-pointer" onClick={() => { setSelected(r); setNotes(''); }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === 'pending' ? 'warning' : r.status.includes('valid') ? 'success' : 'default'} size="sm">{r.status.replace(/_/g,' ')}</Badge>
                      <span className="font-medium text-fg">{r.reason_code}</span>
                      <span className="text-xs text-fg-subtle">#{r.public_id}</span>
                    </div>
                    <p className="text-sm text-fg-muted line-clamp-1 mt-0.5">{r.description || 'No description provided'}</p>
                    <p className="text-xs text-fg-subtle mt-1">
                      {r.complainant?.full_name} → {r.reported_user?.full_name || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); runAI(r.public_id); }} disabled={aiLoading === r.public_id} className="btn btn-sm btn-secondary">
                      <Bot className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); startReview(r); }} className="btn btn-sm btn-primary">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side drawer for resolution */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" onClick={() => setSelected(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }} className="w-full max-w-md h-full bg-bg border-l border-border p-6 overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">Review #{selected.public_id}</h2>
                  <p className="text-sm text-fg-muted">{selected.reason_code} • {selected.severity}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-fg-subtle">✕</button>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <div className="text-fg-subtle text-xs">Complainant</div>
                  <div>{selected.complainant?.full_name}</div>
                </div>
                <div>
                  <div className="text-fg-subtle text-xs">Reported</div>
                  <div>{selected.reported_user?.full_name || '—'}</div>
                </div>
                <div>
                  <div className="text-fg-subtle text-xs mb-1">Description</div>
                  <div className="rounded bg-bg-subtle p-3 whitespace-pre-wrap">{selected.description || '—'}</div>
                </div>

                <div>
                  <label className="text-xs text-fg-subtle">Moderator notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="input-base w-full mt-1" placeholder="What did you find? Why this decision?" />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button onClick={() => resolve(true)} className="btn flex-1 bg-success/10 text-success hover:bg-success/20">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Valid
                </button>
                <button onClick={() => resolve(false)} className="btn flex-1 bg-danger/10 text-danger hover:bg-danger/20">
                  <XCircle className="h-4 w-4 mr-1.5" /> Mark Invalid
                </button>
              </div>

              <button onClick={() => runAI(selected.public_id)} disabled={!!aiLoading} className="mt-3 w-full btn btn-secondary">
                <Bot className="h-4 w-4 mr-2" /> Run AI Priority Analysis
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
