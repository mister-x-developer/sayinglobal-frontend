'use client';

/**
 * SAYIN GLOBAL — Platform AI Assistant
 *
 * Floating premium widget. Role-aware. Multilingual. DB/API-aware.
 * - User AI: platform help, listings, plans, referrals
 * - Admin AI: full platform control, can execute moderation actions
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  Bot, X, Send, Loader2, Minimize2, Maximize2,
  Sparkles, Zap, ChevronDown, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: { label: string; actionKey: string; params: Record<string, unknown> };
  actionResult?: { ok: boolean; text: string };
}

const LOCALE_LANGUAGE: Record<string, string> = {
  uz: 'Uzbek (Latin)',
  'uz-cyrl': 'Uzbek (Cyrillic)',
  ru: 'Russian',
  en: 'English',
};

const GREETINGS: Record<string, {
  user: (n: string) => string;
  admin: (n: string) => string;
}> = {
  uz: {
    user: (n) => `Assalomu alaykum${n ? ', ' + n : ''}! Men SAYIN AI — SAYIN GLOBAL yordamchisiman.\n\nE'lonlar, sotuvchilar, planlar, referral yoki platforma haqida istalgan savolni bering.`,
    admin: (n) => `Assalomu alaykum, ${n || 'Admin'}! Men SAYIN ADMIN AI — platformaning kuchli yordamchisiman.\n\nModeratsiya, e'lonlar, foydalanuvchilar, broadcast, statistika — barchasida yordam beraman va amallarni bajaraman.`,
  },
  'uz-cyrl': {
    user: (n) => `Ассалому алайкум${n ? ', ' + n : ''}! Мен SAYIN AI — SAYIN GLOBAL ёрдамчисиман.\n\nЭълонлар, сотувчилар, режалар ёки платформа ҳақида саволларингизни беринг.`,
    admin: (n) => `Ассалому алайкум, ${n || 'Admin'}! Мен SAYIN ADMIN AI — платформанинг кучли ёрдамчисиман.\n\nМодерация, эълонлар, фойдаланувчилар ва бошқа барча ишларда ёрдам бераман.`,
  },
  ru: {
    user: (n) => `Здравствуйте${n ? ', ' + n : ''}! Я SAYIN AI — помощник платформы SAYIN GLOBAL.\n\nЗадайте любой вопрос об объявлениях, продавцах, тарифах или функциях платформы.`,
    admin: (n) => `Здравствуйте, ${n || 'Admin'}! Я SAYIN ADMIN AI — мощный помощник платформы.\n\nМодерация, объявления, пользователи, рассылки, статистика — помогу со всем и выполню действия.`,
  },
  en: {
    user: (n) => `Hello${n ? ', ' + n : ''}! I'm SAYIN AI — your SAYIN GLOBAL assistant.\n\nAsk me anything about listings, sellers, plans, referrals, or platform features.`,
    admin: (n) => `Hello, ${n || 'Admin'}! I'm SAYIN ADMIN AI — your powerful platform co-pilot.\n\nModeration, listings, users, broadcasts, stats — I can help with everything and execute actions.`,
  },
};

const PLACEHOLDER: Record<string, string> = {
  uz: 'Savol bering...',
  'uz-cyrl': 'Савол беринг...',
  ru: 'Задайте вопрос...',
  en: 'Ask a question...',
};

const FOOTER_TEXT: Record<string, string> = {
  uz: "SAYIN AI · Sun'iy intellekt yordamchi",
  'uz-cyrl': "SAYIN AI · Сунъий интеллект ёрдамчи",
  ru: "SAYIN AI · Интеллектуальный помощник",
  en: "SAYIN AI · Intelligent assistant",
};

// Login prompt per locale
const LOGIN_PROMPT: Record<string, { title: string; desc: string; btn: string }> = {
  uz: { title: 'SAYIN AI', desc: "AI yordamchidan foydalanish uchun tizimga kiring.", btn: "Kirish" },
  'uz-cyrl': { title: 'SAYIN AI', desc: "AI ёрдамчидан фойдаланиш учун тизимга киринг.", btn: "Кириш" },
  ru: { title: 'SAYIN AI', desc: "Войдите, чтобы использовать AI-помощника.", btn: "Войти" },
  en: { title: 'SAYIN AI', desc: "Sign in to use the AI assistant.", btn: "Sign in" },
};

/** Renders AI message content with clickable links and basic formatting */
function AIMessageContent({ content }: { content: string }) {
  // Split by lines, render each line with link detection
  const lines = content.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        // Detect internal links like /listings/123 or /plans
        const linkMatch = line.match(/🔗\s*(\/[^\s]+)/);
        if (linkMatch) {
          const url = linkMatch[1];
          const label = line.replace(/🔗\s*\/[^\s]+/, '').trim() || url;
          return (
            <div key={i}>
              {label && <span>{label} </span>}
              <a
                href={url}
                className="inline-flex items-center gap-1 text-brand-primary underline underline-offset-2 font-medium hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                🔗 {url}
              </a>
            </div>
          );
        }
        // Detect listing links like /listings/123456789
        const listingLinkMatch = line.match(/^\s+🔗\s*(\/listings\/\d+)/);
        if (listingLinkMatch) {
          return (
            <div key={i} className="pl-2">
              <a
                href={listingLinkMatch[1]}
                className="text-brand-primary underline underline-offset-2 text-[12px] hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                Ko'rish →
              </a>
            </div>
          );
        }
        // Detect bare internal paths like /listings/123 at end of line
        const inlineLink = line.match(/\s+(\/(?:listings|sellers|plans|chat|profile)[^\s]*)/);
        if (inlineLink && !line.startsWith('  ')) {
          const before = line.slice(0, line.lastIndexOf(inlineLink[1])).trim();
          return (
            <div key={i}>
              {before && <span>{before} </span>}
              <a
                href={inlineLink[1]}
                className="text-brand-primary underline underline-offset-2 font-medium hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                {inlineLink[1]}
              </a>
            </div>
          );
        }
        // Indented lines (listing details) — smaller text
        if (line.startsWith('  ') && line.trim()) {
          return (
            <div key={i} className="pl-2 text-[11px] text-fg-muted">
              {line.trim()}
            </div>
          );
        }
        return <div key={i}>{line || '\u00A0'}</div>;
      })}
    </div>
  );
}

export function AIAssistant() {
  const locale = useLocale();
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = !!user?.is_admin;
  const role = isAdmin ? 'admin' : 'user';
  const firstName = user?.full_name?.split(' ')[0] ?? '';
  const language = LOCALE_LANGUAGE[locale] ?? 'Uzbek (Latin)';

  // Auto-scroll
  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  // Reset on locale change
  useEffect(() => {
    setHasGreeted(false);
    setMessages([]);
  }, [locale]);

  // Greeting on first open
  useEffect(() => {
    if (open && !hasGreeted && isAuthenticated) {
      setHasGreeted(true);
      const greetFns = GREETINGS[locale] ?? GREETINGS['uz'];
      const greeting = isAdmin ? greetFns.admin(firstName) : greetFns.user(firstName);
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [open, hasGreeted, isAuthenticated, isAdmin, firstName, locale]);

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

      const reply = res.data?.reply ?? res.data?.response ?? '...';
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      const errMsg: Record<string, string> = {
        uz: "Kechirasiz, hozir javob bera olmayapman. Keyinroq urinib ko'ring.",
        'uz-cyrl': "Кечирасиз, ҳозир жавоб бера олмаяпман.",
        ru: 'Извините, сейчас не могу ответить. Попробуйте позже.',
        en: "Sorry, I can't respond right now. Please try again later.",
      };
      setMessages((prev) => [...prev, {
        id: `a-err-${Date.now()}`,
        role: 'assistant',
        content: errMsg[locale] ?? errMsg['uz'],
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const executeAction = async (msgId: string, actionKey: string, params: Record<string, unknown>) => {
    setActionLoading(msgId);
    // Admin actions go to /assistant/action/, user actions to /assistant/user-action/
    const endpoint = isAdmin
      ? '/ai-moderation/assistant/action/'
      : '/ai-moderation/assistant/user-action/';
    try {
      const res = await apiClient.post(endpoint, { action: actionKey, params });
      const result = res.data?.result ?? {};

      // Format result nicely for display
      let displayText = '';
      if (result.listings && Array.isArray(result.listings)) {
        displayText = result.listings.map((l: any) =>
          `• ${l.title} — ${l.price?.toLocaleString()} ${l.currency ?? 'UZS'}\n  ${l.url}`
        ).join('\n');
        if (result.search_url) displayText += `\n\n🔗 ${result.search_url}`;
      } else if (result.categories && Array.isArray(result.categories)) {
        displayText = result.categories.map((c: any) => `• ${c.name_uz || c.name}`).join('\n');
      } else if (result.plans && Array.isArray(result.plans)) {
        displayText = result.plans.map((p: any) =>
          `• ${p.name}: ${p.price > 0 ? p.price.toLocaleString() + ' UZS' : 'Bepul'} — ${p.listing_limit} ta/oy`
        ).join('\n');
      } else {
        displayText = JSON.stringify(result, null, 2);
      }

      setMessages((prev) => prev.map((m) =>
        m.id === msgId
          ? { ...m, actionResult: { ok: true, text: displayText } }
          : m
      ));
    } catch (e: any) {
      setMessages((prev) => prev.map((m) =>
        m.id === msgId
          ? { ...m, actionResult: { ok: false, text: e?.response?.data?.error ?? 'Xato yuz berdi' } }
          : m
      ));
    } finally {
      setActionLoading(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isAuthenticated) {
    // Show button + login prompt for unauthenticated users
    return (
      <>
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={() => setOpen(true)}
              className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-[0_8px_32px_rgba(31,122,82,0.45)] hover:shadow-[0_12px_40px_rgba(31,122,82,0.55)] transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="SAYIN AI"
            >
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.94 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 w-[calc(100vw-2rem)] max-w-[320px]"
            >
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-primary/8 to-brand-primary/4 border-b border-brand-primary/15">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white">
                    <Bot className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-fg">{LOGIN_PROMPT[locale]?.title ?? 'SAYIN AI'}</p>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
                <div className="p-5 text-center">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <Sparkles className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-fg-muted mb-4">{LOGIN_PROMPT[locale]?.desc}</p>
                  <a href="/auth/login" className="btn btn-primary w-full justify-center">
                    {LOGIN_PROMPT[locale]?.btn}
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 group inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-[0_8px_32px_rgba(31,122,82,0.45)] hover:shadow-[0_12px_40px_rgba(31,122,82,0.55)] transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="SAYIN AI Assistant"
          >
            <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" strokeWidth={1.75} />
            {isAdmin && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[8px] font-black text-white">
                A
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-28 right-4 z-[60] md:bottom-8 md:right-6 w-[calc(100vw-2rem)] max-w-[360px]"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated shadow-[0_24px_64px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06]">

              {/* Header */}
              <div className={`flex items-center gap-3 px-4 py-3 ${
                isAdmin
                  ? 'bg-gradient-to-r from-brand-accent/10 to-brand-primary/8 border-b border-brand-accent/20'
                  : 'bg-gradient-to-r from-brand-primary/8 to-brand-primary/4 border-b border-brand-primary/15'
              }`}>
                <div className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                  isAdmin ? 'bg-brand-accent text-white' : 'bg-brand-primary text-white'
                }`}>
                  {isAdmin ? <Zap className="h-4 w-4" strokeWidth={2} /> : <Bot className="h-4 w-4" strokeWidth={1.75} />}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-elevated bg-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-fg leading-tight">
                    {isAdmin ? 'SAYIN ADMIN AI' : 'SAYIN AI'}
                  </p>
                  <p className="text-[10px] text-fg-muted leading-tight">
                    {isAdmin
                      ? (locale === 'ru' ? 'Помощник администратора' : locale === 'en' ? 'Admin co-pilot' : 'Admin yordamchisi')
                      : (locale === 'ru' ? 'Интеллектуальный помощник' : locale === 'en' ? 'Intelligent assistant' : "Aqlli yordamchi")}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setMinimized((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle transition-colors"
                    aria-label={minimized ? 'Expand' : 'Minimize'}
                  >
                    {minimized
                      ? <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                      : <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <AnimatePresence initial={false}>
                {!minimized && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Messages */}
                    <div className="h-[280px] overflow-y-auto px-3 py-3 space-y-2.5 scroll-smooth">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {msg.role === 'assistant' && (
                            <div className={`mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg ${
                              isAdmin ? 'bg-brand-accent/15 text-brand-accent' : 'bg-brand-primary/12 text-brand-primary'
                            }`}>
                              {isAdmin ? <Zap className="h-3 w-3" strokeWidth={2} /> : <Bot className="h-3 w-3" strokeWidth={1.75} />}
                            </div>
                          )}
                          <div className="flex flex-col gap-1 max-w-[82%]">
                            <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                              msg.role === 'user'
                                ? 'rounded-br-sm bg-brand-primary text-white'
                                : 'rounded-bl-sm bg-bg-subtle text-fg'
                            }`}>
                              {msg.role === 'assistant' ? <AIMessageContent content={msg.content} /> : msg.content}
                            </div>
                            {/* Action button — shown for both user and admin */}
                            {msg.action && !msg.actionResult && (
                              <button
                                type="button"
                                onClick={() => executeAction(msg.id, msg.action!.actionKey, msg.action!.params)}
                                disabled={actionLoading === msg.id}
                                className={`self-start inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                                  isAdmin
                                    ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent hover:bg-brand-accent/20'
                                    : 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20'
                                }`}
                              >
                                {actionLoading === msg.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Sparkles className="h-3 w-3" strokeWidth={2} />}
                                {msg.action.label}
                              </button>
                            )}
                            {/* Action result */}
                            {msg.actionResult && (
                              <div className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] ${
                                msg.actionResult.ok
                                  ? 'bg-success/10 text-success border border-success/20'
                                  : 'bg-danger/10 text-danger border border-danger/20'
                              }`}>
                                {msg.actionResult.ok
                                  ? <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} />
                                  : <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" strokeWidth={2} />}
                                <span className="font-mono break-all">{msg.actionResult.text}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {loading && (
                        <div className="flex gap-2">
                          <div className={`mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-lg ${
                            isAdmin ? 'bg-brand-accent/15 text-brand-accent' : 'bg-brand-primary/12 text-brand-primary'
                          }`}>
                            {isAdmin ? <Zap className="h-3 w-3" strokeWidth={2} /> : <Bot className="h-3 w-3" strokeWidth={1.75} />}
                          </div>
                          <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bg-subtle px-3.5 py-2.5">
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-fg-subtle"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14 }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className="border-t border-border/60 p-3">
                      <div className="flex items-end gap-2">
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={PLACEHOLDER[locale] ?? PLACEHOLDER['uz']}
                          rows={1}
                          disabled={loading}
                          className="input-base flex-1 resize-none py-2 text-[13px] min-h-[36px]"
                          style={{ maxHeight: '80px' }}
                        />
                        <button
                          type="button"
                          onClick={sendMessage}
                          disabled={!input.trim() || loading}
                          className={`flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            isAdmin
                              ? 'bg-brand-accent hover:bg-brand-accent/90'
                              : 'bg-brand-primary hover:bg-brand-primary/90'
                          }`}
                          aria-label="Send"
                        >
                          {loading
                            ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                            : <Send className="h-4 w-4" strokeWidth={2.25} />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-fg-subtle text-center">
                        {FOOTER_TEXT[locale] ?? FOOTER_TEXT['uz']}
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
