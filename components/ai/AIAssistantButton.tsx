'use client';

/**
 * SAYIN GLOBAL AI Assistant — floating draggable button.
 * Visible to ALL authenticated users (user + admin).
 * Admin gets the full admin AI; user gets the marketplace AI.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X, Send, Loader2, Sparkles, ChevronDown, Menu, MessageSquarePlus, MessageSquare, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

const ADMIN_QUICK_PROMPTS = [
  { key: 'adminCheckNew', icon: '🔍', text: "Yangi e'lonlarni tekshirish" },
  { key: 'adminComplaints', icon: '⚠️', text: "Shikoyatlarni ko'rib chiqish" },
  { key: 'adminStats', icon: '📈', text: 'Tizim statistikasi' },
  { key: 'adminSpam', icon: '🛡️', text: "Spam va shubhali e'lonlar" },
];

const USER_QUICK_PROMPTS = [
  { key: 'findCattle', icon: '🐄', text: 'Qoramol topish' },
  { key: 'findHorse', icon: '🐎', text: 'Ot topish' },
  { key: 'priceCheck', icon: '💰', text: 'Narx tekshirish' },
  { key: 'nearbyListings', icon: '📍', text: "Yaqin e'lonlar" },
];

export function AIAssistantButton() {
  const t = useTranslations();

  // ── ALL hooks must be at the top — no conditional hooks ──────────────────
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2));
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragHasMoved = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open && !showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, showHistory]);

  // Fetch sessions when opening history or the chat
  useEffect(() => {
    if (open) {
      apiClient.get('/ai-moderation/assistant/sessions/')
        .then(res => setSessions(res.data))
        .catch(() => {});
    }
  }, [open]);

  // ── Guard: only render after mount and when authenticated and terms accepted
  if (!mounted || !isAuthenticated || !user?.terms_accepted_at) return null;

  // ── Drag (desktop pointer + mobile touch friendly) ─────────────────────────
  const DRAG_THRESHOLD = 6;

  const clampPosition = (nx: number, ny: number) => {
    // Keep button fully visible with safe margins (above bottom nav, below header, sides)
    const margin = 12;
    const btn = 56;
    const minX = -window.innerWidth + btn + margin + 60; // don't go too far left
    const maxX = window.innerWidth - btn - margin - 20;
    const minY = -window.innerHeight + 120; // below top header area
    const maxY = window.innerHeight - btn - 90; // above bottom nav + safe
    return {
      x: Math.max(minX, Math.min(maxX, nx)),
      y: Math.max(minY, Math.min(maxY, ny)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (open) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragHasMoved.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const nx = dragStart.current.bx + (e.clientX - dragStart.current.mx);
    const ny = dragStart.current.by + (e.clientY - dragStart.current.my);
    const clamped = clampPosition(nx, ny);
    setPos(clamped);

    const dx = Math.abs(e.clientX - dragStart.current.mx);
    const dy = Math.abs(e.clientY - dragStart.current.my);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      dragHasMoved.current = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
    // small timeout so the click handler (which fires after) sees the flag
    setTimeout(() => { dragHasMoved.current = false; }, 0);
  };

  // Touch fallbacks for reliable mobile drag (prevent scroll while dragging the FAB)
  const onTouchStart = (e: React.TouchEvent) => {
    if (open) return;
    setDragging(true);
    dragHasMoved.current = false;
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, bx: pos.x, by: pos.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    e.preventDefault(); // stop page scroll while dragging the button
    const t = e.touches[0];
    const nx = dragStart.current.bx + (t.clientX - dragStart.current.mx);
    const ny = dragStart.current.by + (t.clientY - dragStart.current.my);
    setPos(clampPosition(nx, ny));

    const dx = Math.abs(t.clientX - dragStart.current.mx);
    const dy = Math.abs(t.clientY - dragStart.current.my);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) dragHasMoved.current = true;
  };
  const onTouchEnd = () => {
    setDragging(false);
    setTimeout(() => { dragHasMoved.current = false; }, 0);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await apiClient.post('/ai-moderation/assistant/', {
        message: text.trim(),
        session_id: sessionId,
      });
      const reply = res.data?.reply || res.data?.message || (t('ai.errorReply' as any) ?? 'Xatolik yuz berdi.');
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: reply }]);
      
      // Refresh session list quietly so the new session appears with its auto-title
      apiClient.get('/ai-moderation/assistant/sessions/').then(r => setSessions(r.data)).catch(()=>{});
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: t('ai.errorReply' as any) ?? "Vaqtinchalik xatolik. Qayta urinib ko'ring." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── History actions ───────────────────────────────────────────────────────
  const loadSession = async (id: string) => {
    try {
      const res = await apiClient.get(`/ai-moderation/assistant/sessions/${id}/`);
      setSessionId(id);
      setMessages(res.data.messages || []);
      setShowHistory(false);
    } catch (e) {
      console.error(e);
    }
  };

  const createNewChat = () => {
    setSessionId(Math.random().toString(36).slice(2));
    setMessages([]);
    setShowHistory(false);
  };

  const isAdmin = user?.is_admin || user?.is_staff;
  const aiLogo = isAdmin ? '/images/admin_ai_logo.png' : '/images/user_ai_logo.png';

  return (
    <motion.div
      className="fixed bottom-40 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end"
      style={{ x: pos.x, y: pos.y }}
    >
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="absolute bottom-[calc(100%+12px)] right-0 flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-bg-elevated shadow-[0_24px_64px_-12px_rgb(0_0_0/0.35)]"
            style={{ originX: 1, originY: 1, maxHeight: 'min(520px, calc(100dvh - 8rem))' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-brand-primary/5 px-4 py-3.5">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm overflow-hidden">
                <Image src={aiLogo} alt="AI" width={36} height={36} className="h-full w-full object-cover pointer-events-none select-none" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg">SAYIN AI {isAdmin && <span className="ml-1 text-[10px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded-full">{t('nav.admin')}</span>}</p>
                <p className="text-[11px] text-fg-subtle">{isAdmin ? 'Platforma nazoratchisi' : (t('ai.subtitle' as any) ?? 'Chorva bozori yordamchisi')}</p>
              </div>
              
              <button 
                type="button" 
                onClick={() => setShowHistory(!showHistory)} 
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${showHistory ? 'bg-brand-primary text-white' : 'text-fg-subtle hover:bg-bg-subtle hover:text-fg'}`}
                title="Chatlar tarixi"
              >
                <Menu className="h-4 w-4" strokeWidth={2} />
              </button>
              
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle hover:text-fg transition-colors">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-bg-canvas flex flex-col gap-3">
                <button
                  onClick={createNewChat}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-dashed border-border text-fg hover:border-brand-primary hover:bg-brand-primary/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <span className="font-medium text-sm">{t('ai.newChat')}</span>
                </button>
                
                <div className="text-xs font-semibold text-fg-subtle mt-2 uppercase tracking-wider">{t('ai.chatHistory')}</div>
                {sessions.length === 0 ? (
                  <p className="text-sm text-fg-muted text-center mt-4">{t('ai.noChats')}</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => loadSession(s.id)}
                        className={`flex items-start gap-3 w-full p-3 rounded-xl border transition-colors text-left ${s.id === sessionId ? 'border-brand-primary bg-brand-primary/5' : 'border-border bg-bg-elevated hover:bg-bg-subtle'}`}
                      >
                        <MessageSquare className={`h-5 w-5 mt-0.5 shrink-0 ${s.id === sessionId ? 'text-brand-primary' : 'text-fg-muted'}`} strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-fg truncate">{s.title}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-fg-subtle">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bg-elevated">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-center text-sm text-fg-muted">
                        {isAdmin 
                          ? (t('ai.adminGreeting' as any) ?? '👋 Assalomu alaykum! Platformani boshqarish bo\'yicha savollaringiz bormi?')
                          : (t('ai.greeting' as any) ?? '👋 Salom! Chorva bozori haqida savollaringiz bormi?')}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(isAdmin ? ADMIN_QUICK_PROMPTS : USER_QUICK_PROMPTS).map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => sendMessage(t(`ai.prompt.${p.key}` as any) ?? p.text)}
                            className="flex items-center gap-2 rounded-xl border border-border bg-bg-subtle px-3 py-2.5 text-left text-xs font-medium text-fg hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                          >
                            <span>{p.icon}</span>
                            <span className="line-clamp-2">{t(`ai.prompt.${p.key}` as any) ?? p.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="mr-2 mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary overflow-hidden">
                          <Image src={aiLogo} alt="AI" width={36} height={36} className="h-full w-full object-cover pointer-events-none select-none" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-brand-primary text-white rounded-br-sm'
                          : 'bg-bg-subtle text-fg rounded-bl-sm border border-border/60'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="mr-2 mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary overflow-hidden">
                        <Image src={aiLogo} alt="AI" width={36} height={36} className="h-full w-full object-cover pointer-events-none select-none" />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-bg-subtle px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/60 animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/60 animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/60 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="border-t border-border px-3 py-3 bg-bg-elevated"
                >
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                      }}
                      placeholder={t('ai.inputPlaceholder' as any) ?? 'Savol yozing...'}
                      rows={1}
                      disabled={loading}
                      className="flex-1 resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 transition-all"
                      style={{ minHeight: '38px', maxHeight: '96px' }}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm transition-all hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Send className="h-4 w-4 translate-x-0.5" strokeWidth={2.25} />}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating button ── */}
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          // Only toggle if it was not a real drag (prevents accidental open after drag)
          if (!dragging && !dragHasMoved.current) setOpen((v) => !v);
        }}
        style={{ touchAction: dragging ? 'none' : 'manipulation' }}
        className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl shadow-[0_8px_24px_-4px_rgb(31_122_82/0.55)] transition-all hover:scale-105 active:scale-95 overflow-hidden z-50 ${
          open ? 'bg-bg-elevated border border-border text-fg' : 'bg-brand-primary text-white'
        }`}
        aria-label={open ? t('common.close') : (t('ai.openAssistant' as any) ?? 'AI Assistant')}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <ChevronDown className="h-6 w-6" strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span key="ai" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} className="h-full w-full pointer-events-none">
              <Image src={aiLogo} alt="AI" width={56} height={56} className="h-full w-full object-cover pointer-events-none select-none" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
