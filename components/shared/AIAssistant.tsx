'use client';

/**
 * SAYIN AI — Platform AI Assistant
 * - Markdown rendering (no raw * or ** symbols)
 * - Session persistence (localStorage, ChatGPT-style)
 * - Multiple sessions with titles
 * - Role-aware (user / admin)
 * - Multilingual
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  Bot, X, Send, Loader2, Minimize2, Maximize2, Sparkles, Zap,
  CheckCircle2, AlertCircle, Plus, MessageSquare, Trash2, ChevronLeft,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: { label: string; actionKey: string; params: Record<string, unknown> };
  actionResult?: { ok: boolean; text: string };
}

interface AISession {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'sayin_ai_sessions_v2';
const MAX_SESSIONS = 20;

const LOCALE_LANGUAGE: Record<string, string> = {
  uz: 'Uzbek (Latin)', 'uz-cyrl': 'Uzbek (Cyrillic)', ru: 'Russian', en: 'English',
};

const GREETINGS: Record<string, { user: (n: string) => string; admin: (n: string) => string }> = {
  uz: {
    user: (n) => `Assalomu alaykum${n ? ', ' + n : ''}! Men SAYIN AI.\n\nE'lonlar, sotuvchilar, tariflar yoki platforma haqida istalgan savolni bering.`,
    admin: (n) => `Assalomu alaykum, ${n || 'Admin'}! Men SAYIN ADMIN AI.\n\nModeratsiya, e'lonlar, foydalanuvchilar, statistika — barchasida yordam beraman.`,
  },
  'uz-cyrl': {
    user: (n) => `Ассалому алайкум${n ? ', ' + n : ''}! Мен SAYIN AI.\n\nЭълонлар, сотувчилар, тарифлар ёки платформа ҳақида саволларингизни беринг.`,
    admin: (n) => `Ассалому алайкум, ${n || 'Admin'}! Мен SAYIN ADMIN AI.\n\nМодерация, эълонлар, фойдаланувчилар — барчасида ёрдам бераман.`,
  },
  ru: {
    user: (n) => `Здравствуйте${n ? ', ' + n : ''}! Я SAYIN AI.\n\nЗадайте вопрос об объявлениях, продавцах, тарифах или платформе.`,
    admin: (n) => `Здравствуйте, ${n || 'Admin'}! Я SAYIN ADMIN AI.\n\nМодерация, объявления, пользователи, статистика — помогу со всем.`,
  },
  en: {
    user: (n) => `Hello${n ? ', ' + n : ''}! I'm SAYIN AI.\n\nAsk me about listings, sellers, plans, or any platform feature.`,
    admin: (n) => `Hello, ${n || 'Admin'}! I'm SAYIN ADMIN AI.\n\nModeration, listings, users, stats — I can help with everything.`,
  },
};

const PLACEHOLDER: Record<string, string> = {
  uz: 'Savol bering...', 'uz-cyrl': 'Савол беринг...', ru: 'Задайте вопрос...', en: 'Ask a question...',
};

const NEW_CHAT_LABEL: Record<string, string> = {
  uz: 'Yangi suhbat', 'uz-cyrl': 'Янги суҳбат', ru: 'Новый чат', en: 'New chat',
};

const LOGIN_PROMPT: Record<string, { title: string; desc: string; btn: string }> = {
  uz: { title: 'SAYIN AI', desc: 'AI yordamchidan foydalanish uchun tizimga kiring.', btn: 'Kirish' },
  'uz-cyrl': { title: 'SAYIN AI', desc: 'AI ёрдамчидан фойдаланиш учун тизимга киринг.', btn: 'Кириш' },
  ru: { title: 'SAYIN AI', desc: 'Войдите, чтобы использовать AI-помощника.', btn: 'Войти' },
  en: { title: 'SAYIN AI', desc: 'Sign in to use the AI assistant.', btn: 'Sign in' },
};

// ── Markdown renderer — strips * ** and renders clean text ───────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line → spacer
    if (!line.trim()) {
      result.push(<div key={key++} className="h-1.5" />);
      continue;
    }

    // Bullet list: lines starting with * or - or •
    if (/^[\*\-•]\s+/.test(line)) {
      const content = line.replace(/^[\*\-•]\s+/, '');
      result.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
          <span>{inlineMarkdown(content)}</span>
        </div>
      );
      continue;
    }

    // Numbered list: 1. 2. etc
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      result.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="flex-shrink-0 font-semibold opacity-70">{numMatch[1]}.</span>
          <span>{inlineMarkdown(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Heading: ### or ##
    if (/^#{1,3}\s+/.test(line)) {
      const content = line.replace(/^#{1,3}\s+/, '');
      result.push(<p key={key++} className="font-bold mt-2 mb-0.5">{inlineMarkdown(content)}</p>);
      continue;
    }

    // Internal link line: starts with 🔗 /path
    const linkMatch = line.match(/^🔗\s*(\/[^\s]+)(.*)/);
    if (linkMatch) {
      result.push(
        <div key={key++} className="my-0.5">
          <a href={linkMatch[1]} className="inline-flex items-center gap-1 text-brand-primary underline underline-offset-2 font-medium hover:opacity-80 text-[12px]">
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
            {linkMatch[1]}{linkMatch[2]}
          </a>
        </div>
      );
      continue;
    }

    // Indented line (listing detail)
    if (line.startsWith('  ') && line.trim()) {
      result.push(<div key={key++} className="pl-3 text-[11px] opacity-75 my-0.5">{inlineMarkdown(line.trim())}</div>);
      continue;
    }

    // Normal paragraph
    result.push(<p key={key++} className="my-0.5">{inlineMarkdown(line)}</p>);
  }

  return result;
}

function inlineMarkdown(text: string): React.ReactNode {
  // Handle **bold**, *italic*, `code`, and /path links
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    // **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // *italic* (not **)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    // `code`
    const codeMatch = remaining.match(/`(.+?)`/);
    // /path link
    const pathMatch = remaining.match(/(\/(?:listings|sellers|plans|chat|profile|search)[^\s,)]*)/);

    // Find earliest match
    const candidates = [
      boldMatch && { type: 'bold', match: boldMatch },
      italicMatch && { type: 'italic', match: italicMatch },
      codeMatch && { type: 'code', match: codeMatch },
      pathMatch && { type: 'path', match: pathMatch },
    ].filter(Boolean) as { type: string; match: RegExpMatchArray }[];

    if (candidates.length === 0) {
      parts.push(<span key={k++}>{remaining}</span>);
      break;
    }

    candidates.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0));
    const first = candidates[0];
    const idx = first.match.index ?? 0;

    if (idx > 0) {
      parts.push(<span key={k++}>{remaining.slice(0, idx)}</span>);
    }

    if (first.type === 'bold') {
      parts.push(<strong key={k++} className="font-semibold">{first.match[1]}</strong>);
    } else if (first.type === 'italic') {
      parts.push(<em key={k++}>{first.match[1]}</em>);
    } else if (first.type === 'code') {
      parts.push(<code key={k++} className="rounded bg-black/10 px-1 py-0.5 text-[11px] font-mono">{first.match[1]}</code>);
    } else if (first.type === 'path') {
      parts.push(
        <a key={k++} href={first.match[1]} className="text-brand-primary underline underline-offset-2 hover:opacity-80">
          {first.match[1]}
        </a>
      );
    }

    remaining = remaining.slice(idx + first.match[0].length);
  }

  return <>{parts}</>;
}

// ── Draggable position hook with localStorage persistence ────────────────────
const AI_POS_KEY = 'sayin_ai_pos';

function useDraggable(defaultPos: { x: number; y: number }) {
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return defaultPos;
    try {
      const saved = localStorage.getItem(AI_POS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        // Validate saved position is still on screen
        if (p.x >= 0 && p.x < window.innerWidth - 40 && p.y >= 0 && p.y < window.innerHeight - 40) {
          return p;
        }
      }
    } catch {}
    return defaultPos;
  });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startRef.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    setDragging(true);
  }, [pos]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    startRef.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y };
    setDragging(true);
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!startRef.current) return;
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = cx - startRef.current.mx;
      const dy = cy - startRef.current.my;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 56, startRef.current.px + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, startRef.current.py + dy)),
      });
    };
    const onUp = () => {
      setDragging(false);
      // Save position to localStorage
      setPos((p) => {
        try { localStorage.setItem(AI_POS_KEY, JSON.stringify(p)); } catch {}
        return p;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging]);

  return { pos, dragging, onMouseDown, onTouchStart };
}


function loadSessions(): AISession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(sessions: AISession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {}
}

function makeSession(greeting: string): AISession {
  const id = `s-${Date.now()}`;
  return {
    id,
    title: NEW_CHAT_LABEL['uz'],
    messages: [{
      id: 'greeting',
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function deriveTitle(firstUserMsg: string): string {
  return firstUserMsg.slice(0, 40) + (firstUserMsg.length > 40 ? '...' : '');
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIAssistant() {
  const locale = useLocale();
  const { user, isAuthenticated } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = !!user?.is_admin;
  const role = isAdmin ? 'admin' : 'user';
  const firstName = user?.full_name?.split(' ')[0] ?? '';
  const language = LOCALE_LANGUAGE[locale] ?? 'Uzbek (Latin)';

  // Draggable position — default bottom-right
  const { pos, dragging, onMouseDown, onTouchStart } = useDraggable({
    x: typeof window !== 'undefined' ? window.innerWidth - 72 : 900,
    y: typeof window !== 'undefined' ? window.innerHeight - 120 : 600,
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // Load sessions from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = loadSessions();
    setSessions(stored);
    if (stored.length > 0) setActiveSessionId(stored[0].id);
  }, [isAuthenticated]);

  // Auto-scroll
  useEffect(() => {
    if (open && !minimized && !showSessions) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open, minimized, showSessions]);

  // Create new session when opening for first time
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    if (sessions.length === 0) {
      createNewSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuthenticated]);

  const createNewSession = useCallback(() => {
    const greetFns = GREETINGS[locale] ?? GREETINGS['uz'];
    const greeting = isAdmin ? greetFns.admin(firstName) : greetFns.user(firstName);
    const session = makeSession(greeting);
    session.title = NEW_CHAT_LABEL[locale] ?? NEW_CHAT_LABEL['uz'];
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(session.id);
    setShowSessions(false);
    setInput('');
  }, [locale, isAdmin, firstName]);

  const updateSession = useCallback((sessionId: string, updater: (s: AISession) => AISession) => {
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === sessionId ? updater(s) : s);
      saveSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      saveSessions(updated);
      if (activeSessionId === sessionId) {
        setActiveSessionId(updated[0]?.id ?? null);
        if (updated.length === 0) setShowSessions(false);
      }
      return updated;
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !activeSessionId) return;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Add user message and update title if first user message
    updateSession(activeSessionId, (s) => {
      const isFirstUser = !s.messages.some((m) => m.role === 'user');
      return {
        ...s,
        messages: [...s.messages, userMsg],
        title: isFirstUser ? deriveTitle(text) : s.title,
        updatedAt: Date.now(),
      };
    });
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await apiClient.post('/ai-moderation/assistant/', {
        message: text,
        role,
        locale,
        language,
        history,
        user_name: user?.full_name ?? '',
      });

      const reply = res.data?.reply ?? '...';
      const assistantMsg: AIMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };

      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: [...s.messages, assistantMsg],
        updatedAt: Date.now(),
      }));
    } catch {
      const errMsg: Record<string, string> = {
        uz: "Kechirasiz, hozir javob bera olmayapman.",
        'uz-cyrl': "Кечирасиз, ҳозир жавоб бера олмаяпман.",
        ru: 'Извините, сейчас не могу ответить.',
        en: "Sorry, I can't respond right now.",
      };
      const errAiMsg: AIMessage = {
        id: `a-err-${Date.now()}`,
        role: 'assistant',
        content: errMsg[locale] ?? errMsg['uz'],
        timestamp: Date.now(),
      };
      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: [...s.messages, errAiMsg],
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
    const endpoint = isAdmin ? '/ai-moderation/assistant/action/' : '/ai-moderation/assistant/user-action/';
    try {
      const res = await apiClient.post(endpoint, { action: actionKey, params });
      const result = res.data?.result ?? {};
      let displayText = '';
      if (result.listings && Array.isArray(result.listings)) {
        displayText = result.listings.map((l: any) =>
          `• ${l.title} — ${l.price?.toLocaleString()} UZS\n  ${l.url}`
        ).join('\n');
        if (result.search_url) displayText += `\n\n🔗 ${result.search_url}`;
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

  // ── Unauthenticated UI ────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <AnimatePresence>
          {!open && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onClick={() => !dragging && setOpen(true)}
              style={{ position: 'fixed', left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'grab' }}
              className="z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-[0_8px_32px_rgba(31,122,82,0.45)] select-none"
            >
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.94 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 w-[calc(100vw-2rem)] max-w-[320px]"
            >
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-primary/8 to-brand-primary/4 border-b border-brand-primary/15">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white">
                    <Bot className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <p className="flex-1 text-sm font-bold text-fg">{LOGIN_PROMPT[locale]?.title ?? 'SAYIN AI'}</p>
                  <button type="button" onClick={() => setOpen(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
                <div className="p-5 text-center">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <Sparkles className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-fg-muted mb-4">{LOGIN_PROMPT[locale]?.desc}</p>
                  <a href="/auth/login" className="btn btn-primary w-full justify-center">{LOGIN_PROMPT[locale]?.btn}</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Authenticated UI ──────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger button — draggable */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onClick={() => !dragging && setOpen(true)}
            style={{ position: 'fixed', left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'grab' }}
            className="z-[60] group inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-[0_8px_32px_rgba(31,122,82,0.45)] hover:shadow-[0_12px_40px_rgba(31,122,82,0.55)] transition-shadow select-none"
            aria-label="SAYIN AI"
          >
            <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" strokeWidth={1.75} />
            {isAdmin && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[8px] font-black text-white">A</span>}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 w-[calc(100vw-2rem)] max-w-[380px]"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated shadow-[0_24px_64px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.06] flex flex-col" style={{ height: '520px' }}>

              {/* Header */}
              <div className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/60 flex-shrink-0 ${
                isAdmin ? 'bg-gradient-to-r from-brand-accent/10 to-brand-primary/8' : 'bg-gradient-to-r from-brand-primary/8 to-brand-primary/4'
              }`}>
                {showSessions ? (
                  <button type="button" onClick={() => setShowSessions(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowSessions(true)} title="Suhbatlar"
                    className={`relative inline-flex h-8 w-8 items-center justify-center rounded-xl ${isAdmin ? 'bg-brand-accent text-white' : 'bg-brand-primary text-white'}`}>
                    {isAdmin ? <Zap className="h-4 w-4" strokeWidth={2} /> : <Bot className="h-4 w-4" strokeWidth={1.75} />}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-elevated bg-success" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-fg leading-tight truncate">
                    {showSessions
                      ? (locale === 'ru' ? 'Чаты' : locale === 'en' ? 'Chats' : 'Suhbatlar')
                      : (isAdmin ? 'SAYIN ADMIN AI' : 'SAYIN AI')}
                  </p>
                  {!showSessions && activeSession && (
                    <p className="text-[10px] text-fg-muted leading-tight truncate">{activeSession.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {!showSessions && (
                    <button type="button" onClick={createNewSession} title={NEW_CHAT_LABEL[locale]}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle transition-colors">
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  )}
                  <button type="button" onClick={() => setMinimized((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle transition-colors">
                    {minimized ? <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} /> : <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                  <button type="button" onClick={() => setOpen(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle transition-colors">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <AnimatePresence initial={false}>
                {!minimized && (
                  <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col flex-1 min-h-0">

                    {/* Sessions list */}
                    {showSessions ? (
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button type="button" onClick={createNewSession}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-brand-primary/40 px-3 py-2.5 text-[13px] font-medium text-brand-primary hover:bg-brand-primary/8 transition-colors">
                          <Plus className="h-4 w-4" strokeWidth={2} />
                          {NEW_CHAT_LABEL[locale] ?? NEW_CHAT_LABEL['uz']}
                        </button>
                        {sessions.map((s) => (
                          <div key={s.id} className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                            s.id === activeSessionId ? 'bg-brand-primary/10' : 'hover:bg-bg-subtle'
                          }`} onClick={() => { setActiveSessionId(s.id); setShowSessions(false); }}>
                            <MessageSquare className="h-4 w-4 flex-shrink-0 text-fg-muted" strokeWidth={1.75} />
                            <span className="flex-1 truncate text-[13px] text-fg">{s.title}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                              className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-lg text-fg-muted hover:text-danger hover:bg-danger/10 transition-all">
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        ))}
                        {sessions.length === 0 && (
                          <p className="text-center text-xs text-fg-muted py-4">
                            {locale === 'ru' ? 'Нет чатов' : locale === 'en' ? 'No chats yet' : 'Suhbatlar yo\'q'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {msg.role === 'assistant' && (
                                <div className={`mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg ${
                                  isAdmin ? 'bg-brand-accent/15 text-brand-accent' : 'bg-brand-primary/12 text-brand-primary'
                                }`}>
                                  {isAdmin ? <Zap className="h-3 w-3" strokeWidth={2} /> : <Bot className="h-3 w-3" strokeWidth={1.75} />}
                                </div>
                              )}
                              <div className="flex flex-col gap-1 max-w-[84%]">
                                <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                                  msg.role === 'user'
                                    ? 'rounded-br-sm bg-brand-primary text-white'
                                    : 'rounded-bl-sm bg-bg-subtle text-fg'
                                }`}>
                                  {msg.role === 'assistant'
                                    ? <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                                    : msg.content}
                                </div>
                                {/* Action button */}
                                {msg.action && !msg.actionResult && (
                                  <button type="button" onClick={() => executeAction(msg.id, msg.action!.actionKey, msg.action!.params)}
                                    disabled={actionLoading === msg.id}
                                    className={`self-start inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                                      isAdmin ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent hover:bg-brand-accent/20'
                                        : 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20'
                                    }`}>
                                    {actionLoading === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" strokeWidth={2} />}
                                    {msg.action.label}
                                  </button>
                                )}
                                {/* Action result */}
                                {msg.actionResult && (
                                  <div className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] ${
                                    msg.actionResult.ok ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                                  }`}>
                                    {msg.actionResult.ok ? <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} /> : <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} />}
                                    <span className="font-mono break-all whitespace-pre-wrap">{msg.actionResult.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {/* Typing indicator */}
                          {loading && (
                            <div className="flex gap-2">
                              <div className={`mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg ${isAdmin ? 'bg-brand-accent/15 text-brand-accent' : 'bg-brand-primary/12 text-brand-primary'}`}>
                                {isAdmin ? <Zap className="h-3 w-3" strokeWidth={2} /> : <Bot className="h-3 w-3" strokeWidth={1.75} />}
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
                              placeholder={PLACEHOLDER[locale] ?? PLACEHOLDER['uz']}
                              rows={1} disabled={loading}
                              className="input-base flex-1 resize-none py-2 text-[13px] min-h-[36px]"
                              style={{ maxHeight: '80px' }} />
                            <button type="button" onClick={sendMessage} disabled={!input.trim() || loading}
                              className={`flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                isAdmin ? 'bg-brand-accent hover:bg-brand-accent/90' : 'bg-brand-primary hover:bg-brand-primary/90'
                              }`}>
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Send className="h-4 w-4" strokeWidth={2.25} />}
                            </button>
                          </div>
                          <p className="mt-1.5 text-[10px] text-fg-subtle text-center">
                            SAYIN AI · {locale === 'ru' ? 'Интеллектуальный помощник' : locale === 'en' ? 'Intelligent assistant' : "Aqlli yordamchi"}
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
