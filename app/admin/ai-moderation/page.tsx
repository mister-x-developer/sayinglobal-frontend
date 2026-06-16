'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Bot, CheckCircle2, AlertTriangle, Eye, RefreshCw, Shield, ScanLine, Activity, Cpu, Code2 } from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
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
  const [inProgress, setInProgress] = useState<string | null>(null);
  const [showJson, setShowJson] = useState<string | null>(null);

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
    if (inProgress) return;
    setInProgress(key);
    try {
      await apiClient.post(`/ai-moderation/results/${id}/review/`, { decision });
      toast.success(decision === 'dismissed' ? '✓ Xavfsiz deb belgilandi' : '⚠ Muammo bor deb belgilandi');
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
    if (score >= 0.8) return 'text-rose-400';
    if (score >= 0.5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const scoreBg = (score: number) => {
    if (score >= 0.8) return 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
    if (score >= 0.5) return 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    return 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]';
  };

  const TABS: { key: Filter; label: string }[] = [
    { key: 'needs_review', label: "Ko'rib chiqish kerak" },
    { key: 'all', label: 'Hammasi' },
    { key: 'reviewed', label: "Ko'rib chiqilgan" },
  ];

  return (
    <AdminLayout noPadding>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-primary/30 relative overflow-hidden">
        {/* Deep tech background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />

        {/* Top Operations Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-2xl"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary/20 to-cyan-500/20 border border-brand-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ScanLine className="h-6 w-6 text-brand-primary animate-[pulse_2s_ease-in-out_infinite]" />
              </div>
              <div>
                <h1 className="text-2xl font-black leading-none text-white tracking-tight flex items-center gap-2">
                  NEURAL<span className="text-brand-primary">MOD</span>
                  <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-brand-primary border border-brand-primary/30 ml-2">V2.4</span>
                </h1>
                <p className="mt-1.5 text-[10px] font-mono text-brand-primary/70 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  REAL-TIME ANALYSIS ENGINE
                </p>
              </div>
            </div>
            <button
              onClick={() => load(filter)}
              disabled={loading}
              className="group relative flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-black text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50 overflow-hidden"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-primary' : ''}`} />
              RE-SCAN
            </button>
          </div>
        </motion.div>

        <div className="mx-auto w-full max-w-7xl p-6 lg:p-10 relative z-10">
          
          {/* Header Stats & Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
                  <Cpu className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Engine Status</div>
                  <div className="text-lg font-black text-brand-primary">ACTIVE</div>
                </div>
             </div>
             <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Clean Threshold</div>
                  <div className="text-lg font-black text-emerald-400">&lt; 50%</div>
                </div>
             </div>
             <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Danger Threshold</div>
                  <div className="text-lg font-black text-rose-400">&ge; 80%</div>
                </div>
             </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-8 border-b border-white/10 pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative h-12 px-6 text-xs font-black uppercase tracking-[0.15em] transition-colors rounded-t-xl ${
                  filter === tab.key
                    ? 'text-brand-primary bg-brand-primary/10 border-t border-x border-brand-primary/30'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {tab.label}
                {filter === tab.key && (
                  <motion.span layoutId="ai-mod-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 relative">
              <div className="absolute inset-0 bg-brand-primary/5 blur-3xl rounded-full w-64 h-64 mx-auto animate-pulse" />
              <ScanLine className="h-12 w-12 animate-[bounce_2s_infinite] text-brand-primary relative z-10" strokeWidth={1.5} />
              <div className="font-mono text-sm tracking-[0.3em] text-brand-primary/80 animate-pulse relative z-10">
                INITIATING DEEP SCAN...
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-black/40 p-20 text-center backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.15)]">
                <Shield className="h-12 w-12" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-black text-white tracking-tight uppercase">SYSTEM SECURE</p>
              <p className="mt-2 text-sm font-mono tracking-widest text-emerald-400/70">NO ANOMALIES DETECTED</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {results.map((r, i) => {
                  const isDismissing = inProgress === `${r.id}-dismissed`;
                  const isConfirming = inProgress === `${r.id}-confirmed`;
                  const isAnyInProgress = !!inProgress;
                  const isJsonVisible = showJson === r.id;

                  return (
                    <motion.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, type: 'spring', bounce: 0.2 }}
                      className={`relative rounded-2xl border bg-black/60 backdrop-blur-xl overflow-hidden transition-all duration-500 ${
                        r.human_reviewed ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {/* Scanning Line Effect (Only if needs review) */}
                      {!r.human_reviewed && (
                        <div className="absolute top-0 bottom-0 left-0 w-full pointer-events-none overflow-hidden rounded-2xl opacity-30 z-0">
                           <div className="h-[2px] w-full bg-brand-primary shadow-[0_0_15px_rgba(16,185,129,1)] animate-[scan_3s_ease-in-out_infinite]" />
                        </div>
                      )}

                      <div className="p-6 relative z-10">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                          
                          {/* Left: score + info */}
                          <div className="flex items-start gap-5 flex-1 min-w-0">
                            {/* Score Circle */}
                            <div className={`flex-shrink-0 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border ${scoreBg(r.confidence_score)}`}>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">THREAT</span>
                              <span className={`font-display text-2xl font-black ${scoreColor(r.confidence_score)}`}>
                                {Math.round(r.confidence_score * 100)}%
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${r.target_type === 'listing' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                  {r.target_type === 'listing' ? "LISTING" : 'REPORT'}
                                </span>
                                <span className="text-sm font-mono font-bold text-white/50 border border-white/10 px-2 py-0.5 rounded bg-white/5">
                                  ID: {r.target_id.slice(0,8)}...
                                </span>
                                <span className="text-xs font-mono text-white/30 ml-auto">
                                  {formatRelativeTime(r.created_at)}
                                </span>
                              </div>
                              
                              <div className="mt-3 flex flex-wrap gap-2">
                                {r.flags.map((flag) => {
                                  const isClean = flag === 'clean';
                                  return (
                                    <span key={flag} className={`rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
                                      isClean ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                                    }`}>
                                      {flag.replace(/_/g, ' ')}
                                    </span>
                                  )
                                })}
                              </div>
                              
                              <p className="mt-4 text-sm text-white/80 leading-relaxed font-medium">
                                {r.explanation_uz || r.explanation}
                              </p>
                            </div>
                          </div>

                          {/* Right: actions */}
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            {r.target_type === 'listing' && (
                              <Link href={`/admin/listings/detail?id=${r.target_id}`}
                                className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors">
                                <Eye className="h-4 w-4 text-white/50 group-hover:text-white" />
                                Inspect
                              </Link>
                            )}
                            
                            <button
                              onClick={() => setShowJson(showJson === r.id ? null : r.id)}
                              className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                            >
                              <Code2 className="h-4 w-4 text-white/50 group-hover:text-white" />
                              Raw Data
                            </button>

                            {!r.human_reviewed ? (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => review(r.id, 'dismissed')}
                                  disabled={isAnyInProgress}
                                  className={`relative overflow-hidden flex items-center gap-2 rounded-lg border px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                                    isDismissing
                                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                                  } disabled:opacity-50`}
                                >
                                  {isDismissing
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />}
                                  MARK SAFE
                                </button>

                                <button
                                  type="button"
                                  onClick={() => review(r.id, 'confirmed')}
                                  disabled={isAnyInProgress}
                                  className={`relative overflow-hidden flex items-center gap-2 rounded-lg border px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                                    isConfirming
                                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                  } disabled:opacity-50`}
                                >
                                  {isConfirming
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />}
                                  BAN / BLOCK
                                </button>
                              </div>
                            ) : (
                              <div className={`mt-2 flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider ${r.human_decision === 'confirmed' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                {r.human_decision === 'confirmed' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                {r.human_decision === 'confirmed' ? 'BLOCKED' : 'CLEARED'}
                                {r.reviewed_by_name && <span className="ml-2 text-[10px] opacity-70">BY {r.reviewed_by_name}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Raw JSON Data view */}
                        <AnimatePresence>
                           {isJsonVisible && (
                             <motion.div
                               initial={{ opacity: 0, height: 0 }}
                               animate={{ opacity: 1, height: 'auto' }}
                               exit={{ opacity: 0, height: 0 }}
                               className="mt-6 border-t border-white/10 pt-4"
                             >
                               <div className="rounded-xl bg-[#0a0a0a] border border-white/5 p-4 overflow-x-auto">
                                 <pre className="text-[11px] font-mono text-emerald-400/80 leading-relaxed">
                                   {JSON.stringify(r, null, 2)}
                                 </pre>
                               </div>
                             </motion.div>
                           )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(1000%); opacity: 0; }
        }
      `}} />
    </AdminLayout>
  );
}
