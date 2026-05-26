'use client';
/**
 * SAYIN AI — User-only AI assistant.
 * Completely separate from Admin AI.
 * User scope: listings, sellers, plans, referrals, chat, profile, nearby.
 * NO admin data, NO admin actions, NO system internals.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  Bot, X, Send, Loader2, Minimize2, Maximize2, Sparkles,
  CheckCircle2, AlertCircle, Plus, MessageSquare, Trash2, ChevronLeft, ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AIMessage {
  id: string; role: 'user' | 'assistant'; content: string; timestamp: number;
  action?: { label: string; actionKey: string; params: Record<string, unknown> };
  actionResult?: { ok: boolean; text: string };
}
interface AISession {
  id: string; title: string; messages: AIMessage[]; createdAt: number; updatedAt: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'sayin_user_ai_v1';
const MAX_SESSIONS = 20;
const AI_POS_KEY = 'sayin_ai_pos';

const LOCALE_LANG: Record<string, string> = {
  uz: 'Uzbek (Latin)', 'uz-cyrl': 'Uzbek (Cyrillic)', ru: 'Russian', en: 'English',
};

const GREETINGS: Record<string, (n: string) => string> = {
  uz: (n) => `Salom${n ? ', ' + n : ''}! Men SAYIN AI.\n\nE'lonlar, sotuvchilar, tariflar yoki platforma haqida savol bering.`,
  'uz-cyrl': (n) => `Салом${n ? ', ' + n : ''}! Мен SAYIN AI.\n\nЭълонлар, сотувчилар, тарифлар ёки платформа ҳақида савол беринг.`,
  ru: (n) => `Привет${n ? ', ' + n : ''}! Я SAYIN AI.\n\nЗадайте вопрос об объявлениях, продавцах, тарифах или платформе.`,
  en: (n) => `Hi${n ? ', ' + n : ''}! I'm SAYIN AI.\n\nAsk me about listings, sellers, plans, or any platform feature.`,
};

const PLACEHOLDER: Record<string, string> = {
  uz: 'Savol bering...', 'uz-cyrl': 'Савол беринг...', ru: 'Задайте вопрос...', en: 'Ask a question...',
};

const NEW_CHAT: Record<string, string> = {
  uz: 'Yangi suhbat', 'uz-cyrl': 'Янги суҳбат', ru: 'Новый чат', en: 'New chat',
};

const LOGIN_PROMPT: Record<string, { title: string; desc: string; btn: string }> = {
  uz: { title: 'SAYIN AI', desc: 'AI yordamchidan foydalanish uchun tizimga kiring.', btn: 'Kirish' },
  'uz-cyrl': { title: 'SAYIN AI', desc: 'AI ёрдамчидан фойдаланиш учун тизимга киринг.', btn: 'Кириш' },
  ru: { title: 'SAYIN AI', desc: 'Войдите, чтобы использовать AI-помощника.', btn: 'Войти' },
  en: { title: 'SAYIN AI', desc: 'Sign in to use the AI assistant.', btn: 'Sign in' },
};

// ── Markdown renderer ─────────────────────────────────────────────────────────
export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;
  for (const line of lines) {
    if (!line.trim()) { result.push(<div key={key++} className="h-1.5" />); continue; }
    if (/^[\*\-•]\s+/.test(line)) {
      result.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
          <span>{line.replace(/^[\*\-•]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1')}</span>
        </div>
      );
      continue;
    }
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      result.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="flex-shrink-0 font-semibold opacity-70 text-[11px]">{numMatch[1]}.</span>
          <span>{numMatch[2].replace(/\*\*(.+?)\*\*/g, '$1')}</span>
        </div>
      );
      continue;
    }
    const pathMatch = line.match(/(\/(?:listings|sellers|plans|chat|profile|search|nearby)[^\s,)]*)/);
    if (pathMatch) {
      const idx = line.indexOf(pathMatch[1]);
      result.push(
        <p key={key++} className="my-0.5">
          {line.slice(0, idx)}
          <a href={pathMatch[1]} className="text-brand-primary underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5">
            <ExternalLink className="h-3 w-3" strokeWidth={2} />{pathMatch[1]}
          </a>
          {line.slice(idx + pathMatch[1].length)}
        </p>
      );
      continue;
    }
    result.push(<p key={key++} className="my-0.5">{line.replace(/\*\*(.+?)\*\*/g, '$1')}</p>);
  }
  return result;
}

// ── Pointer-based drag hook ───────────────────────────────────────────────────
function useDraggable(storageKey: string, defaultPos: { x: number; y: number }) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return defaultPos;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.x >= 0 && p.x < window.innerWidth - 40 && p.y >= 0 && p.y < window.innerHeight - 40) return p;
      }
    } catch {}
    return defaultPos;
  });
  // posRef always mirrors pos so drag callbacks read fresh values without stale closure
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  const draggingRef = useRef(false);
  const [draggingState, setDraggingState] = useState(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0, curX: 0, curY: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const d = drag.current;
    d.active = true;
    d.moved = false;
    d.startX = e.clientX;
    d.startY = e.clientY;
    // Always read from posRef — never from style.left which may be stale
    d.origX = posRef.current.x;
    d.origY = posRef.current.y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.sqrt(dx * dx + dy * dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      draggingRef.current = true;
      setDraggingState(true);
    }
    d.curX = Math.max(4, Math.min(window.innerWidth - 60, d.origX + dx));
    d.curY = Math.max(4, Math.min(window.innerHeight - 60, d.origY + dy));
    setPos({ x: d.curX, y: d.curY });
  }, []);

  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) {
      try { localStorage.setItem(storageKey, JSON.stringify({ x: d.curX, y: d.curY })); } catch {}
      // Keep draggingRef true for 120ms — click fires ~10ms after pointerup
      setTimeout(() => {
        draggingRef.current = false;
        setDraggingState(false);
        d.moved = false;
      }, 120);
    } else {
      draggingRef.current = false;
      setDraggingState(false);
    }
  }, [storageKey]);

  return { pos, dragging: draggingState, draggingRef, onPointerDown, onPointerMove, onPointerUp };
}

// ── Session helpers ───────────────────────────────────────────────────────────
function loadSessions(): AISession[] {
  if (typeof window === 'undefined') return [];
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveSessions(s: AISession[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s.slice(0, MAX_SESSIONS))); } catch {}
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIAssistant() {
  const locale = useLocale();
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const firstName = user?.full_name?.split(' ')[0] ?? '';
  const lang = LOCALE_LANG[locale] ?? 'Uzbek (Latin)';
  const activeSession = sessions.find((s) => s.id === activeId) ?? null;
  const messages = activeSession?.messages ?? [];

  const { pos, dragging, draggingRef, onPointerDown, onPointerMove, onPointerUp } = useDraggable(AI_POS_KEY, {
    x: typeof window !== 'undefined' ? window.innerWidth - 72 : 900,
    y: typeof window !== 'undefined' ? window.innerHeight - 180 : 600,
  });

  useEffect(() => {
    const stored = loadSessions();
    setSessions(stored);
    if (stored.length > 0) setActiveId(stored[0].id);
  }, []);

  useEffect(() => {
    if (open && !minimized && !showSessions) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open, minimized, showSessions]);

  useEffect(() => {
    if (!open) return;
    if (sessions.length === 0) newSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const newSession = useCallback(() => {
    const greet = (GREETINGS[locale] ?? GREETINGS['uz'])(firstName);
    const s: AISession = {
      id: `s-${Date.now()}`,
      title: NEW_CHAT[locale] ?? NEW_CHAT['uz'],
      messages: [{ id: 'g', role: 'assistant', content: greet, timestamp: Date.now() }],
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setSessions((prev) => { const u = [s, ...prev]; saveSessions(u); return u; });
    setActiveId(s.id);
    setShowSessions(false);
    setInput('');
  }, [locale, firstName]);

  const updateSession = useCallback((id: string, fn: (s: AISession) => AISession) => {
    setSessions((prev) => { const u = prev.map((s) => s.id === id ? fn(s) : s); saveSessions(u); return u; });
  }, []);

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const u = prev.filter((s) => s.id !== id);
      saveSessions(u);
      if (activeId === id) { setActiveId(u[0]?.id ?? null); if (!u.length) setShowSessions(false); }
      return u;
    });
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading || !activeId) return;
    const userMsg: AIMessage = { id: `u-${Date.now()}`, role: 'user', content, timestamp: Date.now() };
    updateSession(activeId, (s) => ({
      ...s,
      messages: [...s.messages, userMsg],
      title: !s.messages.some((m) => m.role === 'user') ? content.slice(0, 40) : s.title,
      updatedAt: Date.now(),
    }));
    setInput('');
    setLoading(true);
    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
      const res = await apiClient.post('/ai-moderation/assistant/', {
        message: content, role: 'user', locale, language: lang, history, user_name: user?.full_name ?? '',
      });
      const reply = res.data?.reply ?? '...';
      updateSession(activeId, (s) => ({
        ...s, messages: [...s.messages, { id: `a-${Date.now()}`, role: 'assistant', content: reply, timestamp: Date.now() }],
        updatedAt: Date.now(),
      }));
    } catch {
      const err: Record<string, string> = { uz: 'Xato yuz berdi.', 'uz-cyrl': 'Хато юз берди.', ru: 'Ошибка.', en: 'Error.' };
      updateSession(activeId, (s) => ({
        ...s, messages: [...s.messages, { id: `e-${Date.now()}`, role: 'assistant', content: err[locale] ?? err['uz'], timestamp: Date.now() }],
        updatedAt: Date.now(),
      }));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const execAction = async (msgId: string, actionKey: string, params: Record<string, unknown>) => {
    if (!activeId) return;
    setActionLoading(msgId);
    try {
      const res = await apiClient.post('/ai-moderation/assistant/user-action/', { action: actionKey, params });
      const result = res.data?.result ?? {};
      let text = '';
      if (result.listings?.length) {
        text = result.listings.map((l: any) => `• ${l.title} — ${l.price?.toLocaleString()} UZS\n  ${l.url}`).join('\n');
        if (result.search_url) text += `\n\n🔗 ${result.search_url}`;
      } else { text = JSON.stringify(result, null, 2); }
      updateSession(activeId, (s) => ({ ...s, messages: s.messages.map((m) => m.id === msgId ? { ...m, actionResult: { ok: true, text } } : m) }));
    } catch (e: any) {
      updateSession(activeId, (s) => ({ ...s, messages: s.messages.map((m) => m.id === msgId ? { ...m, actionResult: { ok: false, text: e?.response?.data?.error ?? 'Xato' } } : m) }));
    } finally { setActionLoading(null); }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <AnimatePresence>
          {!open && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
              onClick={() => !draggingRef.current && setOpen(true)}
              style={{ position: 'fixed', left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
              className="z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-[0_8px_32px_rgba(31,122,82,0.45)] select-none">
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.94 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 w-[calc(100vw-2rem)] max-w-[320px]">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-primary/8 to-brand-primary/4 border-b border-brand-primary/15">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white"><Bot className="h-4 w-4" strokeWidth={1.75} /></div>
                  <p className="flex-1 text-sm font-bold text-fg">{LOGIN_PROMPT[locale]?.title ?? 'SAYIN AI'}</p>
                  <button type="button" onClick={() => setOpen(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle"><X className="h-3.5 w-3.5" strokeWidth={2} /></button>
                </div>
                <div className="p-5 text-center">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary"><Sparkles className="h-6 w-6" strokeWidth={1.75} /></div>
                  <p className="text-sm text-fg-muted mb-4">{LOGIN_PROMPT[locale]?.desc}</p>
                  <a href="/auth" className="btn btn-primary w-full justify-center">{LOGIN_PROMPT[locale]?.btn}</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Draggable trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            onClick={() => !draggingRef.current && setOpen(true)}
            style={{ position: 'fixed', left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            className="z-[60] group inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-[0_8px_32px_rgba(31,122,82,0.45)] hover:shadow-[0_12px_40px_rgba(31,122,82,0.55)] transition-shadow select-none"
            aria-label="SAYIN AI">
            <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" strokeWidth={1.75} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 w-[calc(100vw-2rem)] max-w-[380px]">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated shadow-[0_24px_64px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.06] flex flex-col" style={{ height: '520px' }}>

              {/* Header */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/60 bg-gradient-to-r from-brand-primary/8 to-brand-primary/4 flex-shrink-0">
                {showSessions ? (
                  <button type="button" onClick={() => setShowSessions(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle"><ChevronLeft className="h-4 w-4" strokeWidth={2} /></button>
                ) : (
                  <button type="button" onClick={() => setShowSessions(true)} className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary text-white">
                    <Bot className="h-4 w-4" strokeWidth={1.75} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-elevated bg-success" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-fg leading-tight truncate">
                    {showSessions ? (locale === 'ru' ? 'Чаты' : locale === 'en' ? 'Chats' : 'Suhbatlar') : 'SAYIN AI'}
                  </p>
                  {!showSessions && <p className="text-[10px] text-fg-muted leading-tight truncate">{locale === 'ru' ? 'Помощник платформы' : locale === 'en' ? 'Platform assistant' : 'Platforma yordamchisi'}</p>}
                </div>
                <div className="flex items-center gap-0.5">
                  {!showSessions && <button type="button" onClick={newSession} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle"><Plus className="h-3.5 w-3.5" strokeWidth={2} /></button>}
                  <button type="button" onClick={() => setMinimized((v) => !v)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                    {minimized ? <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} /> : <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle"><X className="h-3.5 w-3.5" strokeWidth={2} /></button>
                </div>
              </div>

              {/* Body */}
              <AnimatePresence initial={false}>
                {!minimized && (
                  <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col flex-1 min-h-0">
                    {showSessions ? (
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button type="button" onClick={newSession} className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-brand-primary/40 px-3 py-2.5 text-[13px] font-medium text-brand-primary hover:bg-brand-primary/8 transition-colors">
                          <Plus className="h-4 w-4" strokeWidth={2} />{NEW_CHAT[locale] ?? NEW_CHAT['uz']}
                        </button>
                        {sessions.map((s) => (
                          <div key={s.id} className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${s.id === activeId ? 'bg-brand-primary/10' : 'hover:bg-bg-subtle'}`}
                            onClick={() => { setActiveId(s.id); setShowSessions(false); }}>
                            <MessageSquare className="h-4 w-4 flex-shrink-0 text-fg-muted" strokeWidth={1.75} />
                            <span className="flex-1 truncate text-[13px] text-fg">{s.title}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                              className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-lg text-fg-muted hover:text-danger hover:bg-danger/10 transition-all">
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {msg.role === 'assistant' && (
                                <div className="mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
                                  <Bot className="h-3 w-3" strokeWidth={1.75} />
                                </div>
                              )}
                              <div className="flex flex-col gap-1 max-w-[84%]">
                                <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm bg-brand-primary text-white' : 'rounded-bl-sm bg-bg-subtle text-fg'}`}>
                                  {msg.role === 'assistant' ? <div className="space-y-0.5">{renderMarkdown(msg.content)}</div> : msg.content}
                                </div>
                                {msg.action && !msg.actionResult && (
                                  <button type="button" onClick={() => execAction(msg.id, msg.action!.actionKey, msg.action!.params)}
                                    disabled={actionLoading === msg.id}
                                    className="self-start inline-flex items-center gap-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/30 px-2.5 py-1 text-[11px] font-semibold text-brand-primary hover:bg-brand-primary/20 transition-colors disabled:opacity-60">
                                    {actionLoading === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" strokeWidth={2} />}
                                    {msg.action.label}
                                  </button>
                                )}
                                {msg.actionResult && (
                                  <div className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] ${msg.actionResult.ok ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                                    {msg.actionResult.ok ? <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} /> : <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} />}
                                    <span className="font-mono break-all whitespace-pre-wrap text-[10px]">{msg.actionResult.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {loading && (
                            <div className="flex gap-2">
                              <div className="mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary"><Bot className="h-3 w-3" strokeWidth={1.75} /></div>
                              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bg-subtle px-3.5 py-2.5">
                                {[0,1,2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-fg-subtle" animate={{ y: [0,-4,0] }} transition={{ duration: 0.55, repeat: Infinity, delay: i*0.14 }} />)}
                              </div>
                            </div>
                          )}
                          <div ref={endRef} />
                        </div>
                        <div className="border-t border-border/60 p-3 flex-shrink-0">
                          <div className="flex items-end gap-2">
                            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
                              placeholder={PLACEHOLDER[locale] ?? PLACEHOLDER['uz']} rows={1} disabled={loading}
                              className="input-base flex-1 resize-none py-2 text-[13px] min-h-[36px]" style={{ maxHeight: '80px' }} />
                            <button type="button" onClick={() => send()} disabled={!input.trim() || loading}
                              className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white transition-all disabled:opacity-40 hover:bg-brand-primary/90">
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Send className="h-4 w-4" strokeWidth={2.25} />}
                            </button>
                          </div>
                          <p className="mt-1.5 text-[10px] text-fg-subtle text-center">SAYIN AI · {locale === 'ru' ? 'Помощник платформы' : locale === 'en' ? 'Platform assistant' : 'Platforma yordamchisi'}</p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
