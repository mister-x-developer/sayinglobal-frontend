'use client';

/**
 * SAYIN GLOBAL AI Assistant — floating draggable button.
 * Smooth draggable using framer-motion native drag.
 * Glow effect added, Admin AI removed.
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

const USER_QUICK_PROMPTS = [
  { key: 'findCattle', icon: '🐄', text: 'Qoramol topish' },
  { key: 'findHorse', icon: '🐎', text: 'Ot topish' },
  { key: 'priceCheck', icon: '💰', text: 'Narx tekshirish' },
  { key: 'nearbyListings', icon: '📍', text: "Yaqin eʼlonlar" },
];

export function AIAssistantButton() {
  const t = useTranslations();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2));
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dragged, setDragged] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open && !showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, showHistory]);

  useEffect(() => {
    if (open) {
      apiClient.get('/ai-moderation/assistant/sessions/')
        .then(res => setSessions(res.data))
        .catch(() => {});
    }
  }, [open]);

  if (!mounted || !isAuthenticated || !user?.terms_accepted_at) return null;

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

  const isAdmin = user?.is_staff || user?.is_admin;
  const aiLogo = isAdmin ? '/images/admin_ai_logo.png' : '/images/user_ai_logo.png';
  const aiTitle = isAdmin ? 'Admin AI Co-pilot' : 'SAYIN AI';
  const aiSubtitle = isAdmin ? 'Moderation & Analytics' : (t('ai.subtitle' as any) ?? 'Chorva bozori yordamchisi');

  return (
    <motion.div
      drag={!open}
      dragConstraints={{ left: -windowSize.width + 80, right: 0, top: -windowSize.height + 140, bottom: 0 }}
      dragMomentum={true}
      dragElastic={0.2}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragStart={() => setDragged(true)}
      onDragEnd={() => setTimeout(() => setDragged(false), 100)} // short delay so click doesn't trigger on drag end
      className="fixed bottom-40 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end"
      style={{ touchAction: open ? 'auto' : 'none' }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="absolute bottom-[calc(100%+16px)] right-0 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-bg-elevated shadow-[0_24px_64px_-12px_rgb(0_0_0/0.45)] cursor-auto"
            style={{ originX: 1, originY: 1, maxHeight: '70dvh' }}
            onPointerDown={(e) => e.stopPropagation()} // prevent dragging when clicking inside chat
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-brand-primary/5 px-4 py-3.5">
              <div className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-sm border border-brand-primary/20">
                <Image src={aiLogo} alt="AI" width={40} height={40} className="h-full w-full object-cover pointer-events-none select-none" />
                <div className="absolute inset-0 bg-brand-primary/10 mix-blend-overlay"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg flex items-center gap-1.5">
                  {aiTitle}
                  <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                </p>
                <p className="text-[11px] text-fg-subtle">{aiSubtitle}</p>
              </div>
              
              <button 
                type="button" 
                onClick={() => setShowHistory(!showHistory)} 
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${showHistory ? 'bg-brand-primary text-white shadow-sm' : 'text-fg-subtle hover:bg-bg-subtle hover:text-fg'}`}
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
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-dashed border-brand-primary/40 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors shadow-sm"
                >
                  <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
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
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bg-elevated">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-center text-sm text-fg-muted">
                        {t('ai.greeting' as any) ?? '👋 Salom! Chorva bozori haqida savollaringiz bormi?'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {USER_QUICK_PROMPTS.map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => sendMessage(t(`ai.prompt.${p.key}` as any) ?? p.text)}
                            className="flex items-center gap-2 rounded-xl border border-border bg-bg-subtle px-3 py-2.5 text-left text-xs font-medium text-fg hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors shadow-sm"
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
                        <div className="mr-2 mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 overflow-hidden border border-brand-primary/20">
                          <Image src={aiLogo} alt="AI" width={36} height={36} className="h-full w-full object-cover pointer-events-none select-none" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
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
                      <div className="mr-2 mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 overflow-hidden border border-brand-primary/20">
                        <Image src={aiLogo} alt="AI" width={36} height={36} className="h-full w-full object-cover pointer-events-none select-none" />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-bg-subtle px-4 py-3 shadow-sm">
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

                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="border-t border-border px-3 py-3 bg-bg-elevated/80 backdrop-blur-md"
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
                      className="flex-1 resize-none rounded-xl border border-border bg-bg-canvas px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 transition-all shadow-inner"
                      style={{ minHeight: '38px', maxHeight: '96px' }}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-[0_2px_8px_-2px_rgb(31_122_82/0.5)] transition-all hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!dragged) setOpen((v) => !v);
        }}
        className={`relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full shadow-[0_8px_32px_-4px_rgb(31_122_82/0.6)] transition-colors overflow-hidden border-2 ${
          open ? 'bg-bg-elevated border-border text-fg' : 'bg-brand-primary border-brand-primary/20 text-white'
        }`}
        aria-label={open ? t('common.close') : (t('ai.openAssistant' as any) ?? 'AI Assistant')}
      >
        {/* Glow effect */}
        {!open && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-brand-primary" style={{ animationDuration: '3s' }}></div>
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <ChevronDown className="h-7 w-7" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span key="ai" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} className="h-full w-full pointer-events-none">
              <Image src={aiLogo} alt="AI" width={64} height={64} className="h-full w-full object-cover pointer-events-none select-none" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
