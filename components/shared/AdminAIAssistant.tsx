'use client';

/**
 * SAYIN ADMIN AI — Dedicated admin AI assistant.
 * 
 * Completely separate from user AI:
 * - Different UI (teal/accent color, Zap icon)
 * - Different system prompt (admin-level capabilities)
 * - Can execute real admin actions
 * - Shows in admin panel only
 * - Persistent sessions per admin
 */

import { useEffect, useRef, useState, useCallback } from 'react';import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  Zap, X, Send, Loader2, Minimize2, Maximize2,
  CheckCircle2, AlertCircle, Plus, MessageSquare, Trash2, ChevronLeft,
  ExternalLink, Play,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

interface AdminAIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  pendingAction?: { label: string; actionKey: string; params: Record<string, unknown> };
  actionResult?: { ok: boolean; text: string };
}

interface AdminAISession {
  id: string;
  title: string;
  messages: AdminAIMessage[];
  createdAt: number;
  updatedAt: number;
}

const ADMIN_AI_STORAGE = 'sayin_admin_ai_v1';
const ADMIN_AI_POS_KEY = 'sayin_admin_ai_pos';
const MAX_SESSIONS = 15;

const GREETINGS: Record<string, (n: string) => string> = {
  uz: (n) => `Salom, ${n || 'Admin'}! Men SAYIN ADMIN AI.\n\nModeratsiya, e'lonlar, foydalanuvchilar, broadcast, statistika, referral — barchasini qila olaman. Nima kerak?`,
  'uz-cyrl': (n) => `Салом, ${n || 'Admin'}! Мен SAYIN ADMIN AI.\n\nМодерация, эълонлар, фойдаланувчилар, статистика — барчасини қила оламан. Нима керак?`,
  ru: (n) => `Привет, ${n || 'Admin'}! Я SAYIN ADMIN AI.\n\nМодерация, объявления, пользователи, рассылки, статистика — всё в моих силах. Что нужно?`,
  en: (n) => `Hi, ${n || 'Admin'}! I'm SAYIN ADMIN AI.\n\nModeration, listings, users, broadcasts, stats — I can do it all. What do you need?`,
};

// Quick action buttons for admin
const QUICK_ACTIONS = [
  { label: 'Statistika', labelRu: 'Статистика', labelEn: 'Stats', action: 'get_platform_stats', params: {} },
  { label: 'Kutilayotgan e\'lonlar', labelRu: 'Ожидающие', labelEn: 'Pending listings', action: 'get_pending_listings', params: {} },
  { label: 'Shikoyatlar', labelRu: 'Жалобы', labelEn: 'Complaints', action: 'get_pending_complaints', params: {} },
];
function loadAdminSessions(): AdminAISession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADMIN_AI_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAdminSessions(sessions: AdminAISession[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(ADMIN_AI_STORAGE, JSON.stringify(sessions.slice(0, MAX_SESSIONS))); } catch {}
}

// ── Pointer-based drag hook ───────────────────────────────────────────────────
function useAdminDrag(storageKey: string, defaultPos: { x: number; y: number }) {
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
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0, curX: 0, curY: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const d = drag.current;
    d.active = true; d.moved = false;
    d.startX = e.clientX; d.startY = e.clientY;
    d.origX = parseInt((e.currentTarget as HTMLElement).style.left || '0', 10);
    d.origY = parseInt((e.currentTarget as HTMLElement).style.top || '0', 10);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.moved && Math.sqrt(dx*dx + dy*dy) < 5) return;
    d.moved = true; setDragging(true);
    d.curX = Math.max(4, Math.min(window.innerWidth - 60, d.origX + dx));
    d.curY = Math.max(4, Math.min(window.innerHeight - 60, d.origY + dy));
    setPos({ x: d.curX, y: d.curY });
  }, []);

  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) { try { localStorage.setItem(storageKey, JSON.stringify({ x: d.curX, y: d.curY })); } catch {} }
    setTimeout(() => setDragging(false), 10);
  }, [storageKey]);

  return { pos, dragging, onPointerDown, onPointerMove, onPointerUp };
}

function renderAdminMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;
  for (const line of lines) {
    if (!line.trim()) { result.push(<div key={key++} className="h-1" />); continue; }
    if (/^[\*\-•]\s+/.test(line)) {
      result.push(
        <div key={key++} className="flex items-start gap-1.5 my-0.5">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
          <span>{line.replace(/^[\*\-•]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1')}</span>
        </div>
      );
      continue;
    }
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      result.push(
        <div key={key++} className="flex items-start gap-1.5 my-0.5">
          <span className="flex-shrink-0 font-semibold opacity-70 text-[11px]">{numMatch[1]}.</span>
          <span>{numMatch[2].replace(/\*\*(.+?)\*\*/g, '$1')}</span>
        </div>
      );
      continue;
    }
    // Internal path links
    const pathMatch = line.match(/(\/(?:admin|api)[^\s,)]*)/);
    if (pathMatch) {
      const before = line.slice(0, line.indexOf(pathMatch[1]));
      const after = line.slice(line.indexOf(pathMatch[1]) + pathMatch[1].length);
      result.push(
        <p key={key++} className="my-0.5">
          {before}
          <a href={pathMatch[1]} className="text-brand-accent underline underline-offset-2 hover:opacity-80 text-[11px]">
            {pathMatch[1]}
          </a>
          {after}
        </p>
      );
      continue;
    }
    result.push(<p key={key++} className="my-0.5">{line.replace(/\*\*(.+?)\*\*/g, '$1')}</p>);
  }
  return result;
}

export function AdminAIAssistant() {
  const locale = useLocale();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<AdminAISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const firstName = user?.full_name?.split(' ')[0] ?? '';
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  const { pos: btnPos, dragging: btnDragging, onPointerDown, onPointerMove, onPointerUp } = useAdminDrag(
    ADMIN_AI_POS_KEY,
    { x: typeof window !== 'undefined' ? window.innerWidth - 72 : 900, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 500 }
  );

  useEffect(() => {
    const stored = loadAdminSessions();
    setSessions(stored);
    if (stored.length > 0) setActiveSessionId(stored[0].id);
  }, []);

  useEffect(() => {
    if (open && !minimized && !showSessions) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open, minimized, showSessions]);

  useEffect(() => {
    if (!open) return;
    if (sessions.length === 0) createNewSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const createNewSession = useCallback(() => {
    const greetFn = GREETINGS[locale] ?? GREETINGS['uz'];
    const greeting = greetFn(firstName);
    const session: AdminAISession = {
      id: `admin-${Date.now()}`,
      title: locale === 'ru' ? 'Новый чат' : locale === 'en' ? 'New chat' : 'Yangi suhbat',
      messages: [{ id: 'greeting', role: 'assistant', content: greeting, timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveAdminSessions(updated);
      return updated;
    });
    setActiveSessionId(session.id);
    setShowSessions(false);
    setInput('');
  }, [locale, firstName]);

  const updateSession = useCallback((sessionId: string, updater: (s: AdminAISession) => AdminAISession) => {
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === sessionId ? updater(s) : s);
      saveAdminSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      saveAdminSessions(updated);
      if (activeSessionId === sessionId) {
        setActiveSessionId(updated[0]?.id ?? null);
        if (updated.length === 0) setShowSessions(false);
      }
      return updated;
    });
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading || !activeSessionId) return;

    const userMsg: AdminAIMessage = {
      id: `u-${Date.now()}`, role: 'user', content, timestamp: Date.now(),
    };
    updateSession(activeSessionId, (s) => ({
      ...s,
      messages: [...s.messages, userMsg],
      title: !s.messages.some((m) => m.role === 'user') ? content.slice(0, 40) : s.title,
      updatedAt: Date.now(),
    }));
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await apiClient.post('/ai-moderation/assistant/', {
        message: content,
        role: 'admin',
        locale,
        language: { uz: 'Uzbek (Latin)', 'uz-cyrl': 'Uzbek (Cyrillic)', ru: 'Russian', en: 'English' }[locale] ?? 'Uzbek (Latin)',
        history,
        user_name: user?.full_name ?? '',
      });

      const reply = res.data?.reply ?? '...';
      
      // Parse if reply contains an action suggestion
      const actionMatch = reply.match(/ACTION:\s*(\w+)\s*PARAMS:\s*(\{[^}]+\})/);
      let pendingAction: AdminAIMessage['pendingAction'] | undefined;
      let cleanReply = reply;
      
      if (actionMatch) {
        try {
          pendingAction = {
            label: locale === 'ru' ? 'Выполнить' : locale === 'en' ? 'Execute' : 'Bajarish',
            actionKey: actionMatch[1],
            params: JSON.parse(actionMatch[2]),
          };
          cleanReply = reply.replace(/ACTION:.*$/s, '').trim();
        } catch {}
      }

      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: [...s.messages, {
          id: `a-${Date.now()}`, role: 'assistant', content: cleanReply,
          timestamp: Date.now(), pendingAction,
        }],
        updatedAt: Date.now(),
      }));
    } catch (err: unknown) {
      // Log the actual error for debugging
      console.error('[AdminAI] sendMessage error:', err);
      const errMsg = locale === 'ru' ? 'Ошибка. Попробуйте снова.' : locale === 'en' ? 'Error. Try again.' : 'Xato. Qayta urining.';
      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: [...s.messages, { id: `err-${Date.now()}`, role: 'assistant', content: errMsg, timestamp: Date.now() }],
        updatedAt: Date.now(),
      }));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const executeAction = async (msgId: string, actionKey: string, params: Record<string, unknown>) => {
    if (!activeSessionId) return;
    setActionLoading(msgId);
    try {
      const res = await apiClient.post('/ai-moderation/assistant/action/', { action: actionKey, params });
      const result = res.data?.result ?? {};
      
      // Format result for display
      let displayText = '';
      if (result.analysis) {
        // Image analysis result
        displayText = `📸 ${result.images_analyzed ?? 0} ta rasm tahlil qilindi\n📋 E'lon: ${result.title}\n\n${result.analysis}`;
      } else if (result.active_listings !== undefined) {
        displayText = Object.entries(result).map(([k, v]) => `${k}: ${v}`).join('\n');
      } else if (result.listings && Array.isArray(result.listings)) {
        displayText = `${locale === 'ru' ? 'Найдено' : locale === 'en' ? 'Found' : 'Topildi'}: ${result.count}\n` +
          result.listings.slice(0, 5).map((l: any) => `• ${l.title} — ${l.price?.toLocaleString()} UZS`).join('\n');
      } else if (result.complaints && Array.isArray(result.complaints)) {
        displayText = `${locale === 'ru' ? 'Жалоб' : locale === 'en' ? 'Complaints' : 'Shikoyatlar'}: ${result.count}\n` +
          result.complaints.slice(0, 5).map((c: any) => `• ${c.report_type || c.id}`).join('\n');
      } else {
        displayText = JSON.stringify(result, null, 2);
      }

      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, actionResult: { ok: true, text: displayText } } : m
        ),
      }));
    } catch (e: any) {
      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, actionResult: { ok: false, text: e?.response?.data?.error ?? 'Xato' } } : m
        ),
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Trigger button — draggable */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={() => !btnDragging && setOpen(true)}
            style={{ position: 'fixed', left: btnPos.x, top: btnPos.y, cursor: btnDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            className="z-[60] group inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent to-brand-accent/80 text-white shadow-[0_8px_32px_rgba(59,130,246,0.45)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.55)] transition-shadow select-none"
            aria-label="Admin AI"
          >
            <Zap className="h-6 w-6" strokeWidth={2} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[8px] font-black text-white">A</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-6 right-6 z-[60] w-[calc(100vw-3rem)] max-w-[420px]"
          >
            <div className="overflow-hidden rounded-2xl border border-brand-accent/30 bg-bg-elevated shadow-[0_24px_64px_rgba(0,0,0,0.25)] ring-1 ring-brand-accent/10 flex flex-col" style={{ height: '540px' }}>

              {/* Header */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-brand-accent/20 bg-gradient-to-r from-brand-accent/15 to-brand-primary/8 flex-shrink-0">
                {showSessions ? (
                  <button type="button" onClick={() => setShowSessions(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowSessions(true)}
                    className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-accent text-white">
                    <Zap className="h-4 w-4" strokeWidth={2} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-elevated bg-success" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-fg leading-tight truncate">
                    {showSessions
                      ? (locale === 'ru' ? 'Чаты' : locale === 'en' ? 'Chats' : 'Suhbatlar')
                      : 'SAYIN ADMIN AI'}
                  </p>
                  {!showSessions && (
                    <p className="text-[10px] text-fg-muted leading-tight truncate">
                      {locale === 'ru' ? 'Помощник администратора' : locale === 'en' ? 'Admin co-pilot' : 'Admin yordamchisi'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {!showSessions && (
                    <button type="button" onClick={createNewSession}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  )}
                  <button type="button" onClick={() => setMinimized((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                    {minimized ? <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} /> : <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                  <button type="button" onClick={() => setOpen(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <AnimatePresence initial={false}>
                {!minimized && (
                  <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col flex-1 min-h-0">

                    {showSessions ? (
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button type="button" onClick={createNewSession}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-brand-accent/40 px-3 py-2.5 text-[13px] font-medium text-brand-accent hover:bg-brand-accent/8 transition-colors">
                          <Plus className="h-4 w-4" strokeWidth={2} />
                          {locale === 'ru' ? 'Новый чат' : locale === 'en' ? 'New chat' : 'Yangi suhbat'}
                        </button>
                        {sessions.map((s) => (
                          <div key={s.id} className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                            s.id === activeSessionId ? 'bg-brand-accent/10' : 'hover:bg-bg-subtle'
                          }`} onClick={() => { setActiveSessionId(s.id); setShowSessions(false); }}>
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
                        {/* Quick actions */}
                        {messages.length <= 1 && (
                          <div className="flex gap-1.5 px-3 pt-2 pb-1 flex-wrap">
                            {QUICK_ACTIONS.map((qa) => (
                              <button key={qa.action} type="button"
                                onClick={() => sendMessage(locale === 'ru' ? qa.labelRu : locale === 'en' ? qa.labelEn : qa.label)}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand-accent/10 border border-brand-accent/20 px-2 py-1 text-[11px] font-medium text-brand-accent hover:bg-brand-accent/20 transition-colors">
                                <Play className="h-2.5 w-2.5" strokeWidth={2} />
                                {locale === 'ru' ? qa.labelRu : locale === 'en' ? qa.labelEn : qa.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {msg.role === 'assistant' && (
                                <div className="mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
                                  <Zap className="h-3 w-3" strokeWidth={2} />
                                </div>
                              )}
                              <div className="flex flex-col gap-1 max-w-[85%]">
                                <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                                  msg.role === 'user'
                                    ? 'rounded-br-sm bg-brand-accent text-white'
                                    : 'rounded-bl-sm bg-bg-subtle text-fg'
                                }`}>
                                  {msg.role === 'assistant'
                                    ? <div className="space-y-0.5">{renderAdminMarkdown(msg.content)}</div>
                                    : msg.content}
                                </div>
                                {/* Execute action button */}
                                {msg.pendingAction && !msg.actionResult && (
                                  <button type="button"
                                    onClick={() => executeAction(msg.id, msg.pendingAction!.actionKey, msg.pendingAction!.params)}
                                    disabled={actionLoading === msg.id}
                                    className="self-start inline-flex items-center gap-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/30 px-2.5 py-1 text-[11px] font-semibold text-brand-accent hover:bg-brand-accent/20 transition-colors disabled:opacity-60">
                                    {actionLoading === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" strokeWidth={2} />}
                                    {msg.pendingAction.label}
                                  </button>
                                )}
                                {msg.actionResult && (
                                  <div className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] ${
                                    msg.actionResult.ok ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                                  }`}>
                                    {msg.actionResult.ok ? <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} /> : <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} />}
                                    <span className="font-mono break-all whitespace-pre-wrap text-[10px]">{msg.actionResult.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {loading && (
                            <div className="flex gap-2">
                              <div className="mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
                                <Zap className="h-3 w-3" strokeWidth={2} />
                              </div>
                              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bg-subtle px-3.5 py-2.5">
                                {[0,1,2].map((i) => (
                                  <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-fg-subtle"
                                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14 }} />
                                ))}
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-border/60 p-3 flex-shrink-0">
                          <div className="flex items-end gap-2">
                            <textarea ref={inputRef} value={input}
                              onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                              placeholder={locale === 'ru' ? 'Команда или вопрос...' : locale === 'en' ? 'Command or question...' : 'Buyruq yoki savol...'}
                              rows={1} disabled={loading}
                              className="input-base flex-1 resize-none py-2 text-[13px] min-h-[36px]"
                              style={{ maxHeight: '80px' }} />
                            <button type="button" onClick={() => sendMessage()} disabled={!input.trim() || loading}
                              className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent text-white transition-all disabled:opacity-40 hover:bg-brand-accent/90">
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Send className="h-4 w-4" strokeWidth={2.25} />}
                            </button>
                          </div>
                          <p className="mt-1 text-[10px] text-fg-subtle text-center">
                            SAYIN ADMIN AI · {locale === 'ru' ? 'Только для администраторов' : locale === 'en' ? 'Admins only' : 'Faqat adminlar uchun'}
                          </p>
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
