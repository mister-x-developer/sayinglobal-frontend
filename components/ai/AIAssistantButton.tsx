'use client';

/**
 * SAYIN GLOBAL AI Assistant — floating draggable button.
 *
 * Design principles:
 * - SAYIN GLOBAL identity (brand green, not Gemini blue)
 * - Draggable — user can move it anywhere on screen
 * - Only visible to authenticated users
 * - Smooth, premium animations
 * - Opens a slide-up chat panel
 * - Mobile-first, touch-friendly
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X, Send, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useAuthHydrated } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { key: 'findCattle', icon: '🐄' },
  { key: 'findHorse', icon: '🐎' },
  { key: 'priceCheck', icon: '💰' },
  { key: 'nearbyListings', icon: '📍' },
];

export function AIAssistantButton() {
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydrated();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  // Draggable position
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Don't render for unauthenticated users or before mount
  // Use mounted instead of hydrated — hydrated can get stuck false if
  // Zustand's onFinishHydration callback never fires.
  if (!mounted || !isAuthenticated) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (open) return; // don't drag when panel is open
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setPos({ x: dragStart.current.bx + dx, y: dragStart.current.by + dy });
  };

  const onPointerUp = () => {
    setDragging(false);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/ai-moderation/chat/', {
        message: text.trim(),
        session_id: sessionId,
      });
      const reply = (res.data?.reply || res.data?.message || t('ai.errorReply' as any)) ?? 'Kechirasiz, javob bera olmadim.';
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: t('ai.errorReply' as any) ?? 'Vaqtinchalik xatolik. Qayta urinib ko\'ring.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        ref={btnRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => !dragging && setOpen((v) => !v)}
        style={{ x: pos.x, y: pos.y }}
        drag={!open}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(_, info) => {
          setPos((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }));
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed bottom-24 right-5 z-[900] flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_8px_24px_-4px_rgb(31_122_82/0.55)] transition-colors md:bottom-8 md:right-8 ${
          open
            ? 'bg-bg-elevated border border-border text-fg'
            : 'bg-brand-primary text-white'
        }`}
        aria-label={open ? t('common.close') : (t('ai.openAssistant' as any) ?? 'AI Assistant')}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <ChevronDown className="h-6 w-6" strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span key="ai" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[calc(6rem+1rem)] right-5 z-[899] flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-bg-elevated shadow-[0_24px_64px_-12px_rgb(0_0_0/0.35)] md:bottom-[calc(5rem+1rem)] md:right-8"
            style={{ maxHeight: 'min(520px, calc(100dvh - 10rem))' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-brand-primary/5 px-4 py-3.5">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
                <Sparkles className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg">SAYIN AI</p>
                <p className="text-[11px] text-fg-subtle">{t('ai.subtitle' as any) ?? 'Chorva bozori yordamchisi'}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle hover:text-fg transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-fg-muted">
                    {t('ai.greeting' as any) ?? '👋 Salom! Chorva bozori haqida savollaringiz bormi?'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => sendMessage(t(`ai.prompt.${p.key}` as any) ?? p.key)}
                        className="flex items-center gap-2 rounded-xl border border-border bg-bg-subtle px-3 py-2.5 text-left text-xs font-medium text-fg hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                      >
                        <span>{p.icon}</span>
                        <span className="line-clamp-2">{t(`ai.prompt.${p.key}` as any) ?? p.key}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="mr-2 mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary">
                      <Sparkles className="h-3 w-3" strokeWidth={2} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-primary text-white rounded-br-sm'
                        : 'bg-bg-subtle text-fg rounded-bl-sm border border-border/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="mr-2 mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary">
                    <Sparkles className="h-3 w-3" strokeWidth={2} />
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
            <form onSubmit={handleSubmit} className="border-t border-border px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
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
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Send className="h-4 w-4 translate-x-0.5" strokeWidth={2.25} />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
