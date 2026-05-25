'use client';

/**
 * SAYIN GLOBAL — Platform AI Assistant
 *
 * Floating premium widget. Role-aware. Multilingual. DB/API-aware.
 * Uses Gemini 2.5 Flash via backend proxy endpoint.
 *
 * Capabilities:
 * - Platform questions (listings, sellers, plans, referrals)
 * - Moderation help (admin only)
 * - Broadcast drafting (admin only)
 * - User guidance
 * - Multilingual responses
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Bot, X, Send, Loader2, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SYSTEM_CONTEXT = {
  user: `You are a helpful assistant for SAYIN GLOBAL, a livestock marketplace in Uzbekistan.
Help users with: finding listings, understanding how the platform works, creating listings, 
managing their profile, understanding plans and referrals, and general marketplace questions.
Always be friendly, concise, and helpful. Respond in the user's language (Uzbek, Russian, or English).
Do NOT reveal internal system details, API keys, or admin-only information.`,

  admin: `You are an AI co-pilot for SAYIN GLOBAL platform administrators.
You can help with: moderation decisions, reviewing reports, drafting broadcasts, 
analyzing platform metrics, understanding user behavior, and operational tasks.
You have access to platform context. Be precise and professional.
Do NOT reveal superuser-only system internals, security configurations, or credentials.
Respond in the admin's preferred language.`,
};

export function AIAssistant() {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = !!user?.is_admin;
  const role = isAdmin ? 'admin' : 'user';

  // Auto-scroll to bottom
  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  // Greeting on first open
  useEffect(() => {
    if (open && !hasGreeted && isAuthenticated) {
      setHasGreeted(true);
      const greeting = isAdmin
        ? `Salom, ${user?.full_name?.split(' ')[0] ?? 'Admin'}! Men SAYIN GLOBAL AI yordamchisiman. Moderatsiya, e'lonlar, foydalanuvchilar yoki platforma bo'yicha savollaringizga javob beraman.`
        : `Salom${user?.full_name ? ', ' + user.full_name.split(' ')[0] : ''}! Men SAYIN GLOBAL yordamchisiman. E'lonlar, sotuvchilar, planlar yoki platforma haqida savollaringiz bo'lsa, yordam beraman.`;
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [open, hasGreeted, isAuthenticated, isAdmin, user?.full_name]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await apiClient.post('/ai-moderation/assistant/', {
        message: text,
        role,
        system_context: SYSTEM_CONTEXT[role],
        history,
        user_name: user?.full_name ?? '',
      });

      const reply = res.data?.reply ?? res.data?.response ?? 'Kechirasiz, javob bera olmadim.';
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `a-err-${Date.now()}`,
        role: 'assistant',
        content: 'Kechirasiz, hozir javob bera olmayapman. Keyinroq urinib ko\'ring.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-[0_8px_32px_rgba(31,122,82,0.4)] hover:bg-brand-primary/90 transition-all hover:scale-105 active:scale-95"
            aria-label="AI Assistant"
          >
            <Sparkles className="h-6 w-6" strokeWidth={1.75} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] max-w-sm"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-[0_20px_60px_rgba(0,0,0,0.2)] ring-1 ring-black/5">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border bg-brand-primary/5 px-4 py-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white">
                  <Bot className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-fg">SAYIN AI</p>
                  <p className="text-[11px] text-fg-muted">
                    {isAdmin ? 'Admin yordamchisi' : 'Platforma yordamchisi'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMinimized((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle"
                  >
                    {minimized
                      ? <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                      : <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <AnimatePresence>
                {!minimized && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-72 overflow-y-auto px-4 py-3 space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="mr-2 mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                              <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'rounded-br-sm bg-brand-primary text-white'
                                : 'rounded-bl-sm bg-bg-subtle text-fg'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="mr-2 mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                            <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </div>
                          <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bg-subtle px-4 py-3">
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-fg-subtle"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-border p-3">
                      <div className="flex items-end gap-2">
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Savol bering..."
                          rows={1}
                          disabled={loading}
                          className="input-base flex-1 resize-none py-2 text-sm"
                          style={{ maxHeight: '80px' }}
                        />
                        <button
                          type="button"
                          onClick={sendMessage}
                          disabled={!input.trim() || loading}
                          className="btn btn-primary btn-icon flex-shrink-0 h-9 w-9"
                        >
                          {loading
                            ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                            : <Send className="h-4 w-4" strokeWidth={2.25} />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-fg-subtle text-center">
                        AI yordamchi · Faqat ma'lumot uchun
                      </p>
                    </div>
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
