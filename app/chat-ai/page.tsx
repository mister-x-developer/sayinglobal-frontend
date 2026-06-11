'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Send, Loader2, Sparkles, MessageSquarePlus, MessageSquare, Clock, ArrowLeft, Menu } from 'lucide-react';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';
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

export default function ChatAIPage() {
  const t = useTranslations();
  const router = useRouter();

  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2));
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showHistory]);

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/ai-moderation/assistant/sessions/')
        .then(res => setSessions(res.data))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  if (!hydrated || !isAuthenticated) return null;

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg-elevated pt-safe pb-safe">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg px-4">
        <button 
          onClick={() => router.back()} 
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg hover:bg-bg-subtle"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-brand-primary/20">
          <Image src={aiLogo} alt="AI" width={36} height={36} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-fg flex items-center gap-1.5">
            {aiTitle}
            <Sparkles className="h-4 w-4 text-brand-primary" />
          </p>
          <p className="text-xs text-fg-subtle truncate">{aiSubtitle}</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${showHistory ? 'bg-brand-primary/10 text-brand-primary' : 'text-fg-subtle hover:bg-bg-subtle hover:text-fg'}`}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-bg-canvas space-y-4">
          <button
            onClick={createNewChat}
            className="flex items-center gap-3 w-full p-4 rounded-2xl border border-dashed border-brand-primary text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors shadow-sm"
          >
            <MessageSquarePlus className="h-5 w-5" strokeWidth={2} />
            <span className="font-semibold">{t('ai.newChat' as any) ?? 'Yangi chat ochish'}</span>
          </button>
          
          <div className="text-xs font-bold text-fg-subtle uppercase tracking-wider">{t('ai.chatHistory' as any) ?? 'Chatlar tarixi'}</div>
          {sessions.length === 0 ? (
            <p className="text-sm text-fg-muted text-center mt-8">{t('ai.noChats' as any) ?? 'Sizda hali suhbatlar yo\'q.'}</p>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`flex items-start gap-3 w-full p-4 rounded-2xl border transition-colors text-left ${s.id === sessionId ? 'border-brand-primary bg-brand-primary/5' : 'border-border bg-bg-elevated hover:bg-bg-subtle shadow-sm'}`}
                >
                  <MessageSquare className={`h-5 w-5 mt-0.5 shrink-0 ${s.id === sessionId ? 'text-brand-primary' : 'text-fg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-fg truncate leading-tight">{s.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-fg-subtle font-medium">
                      <Clock className="h-3.5 w-3.5" />
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
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-bg-canvas pb-8">
            {messages.length === 0 && (
              <div className="space-y-4 py-8">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-3xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                    <Image src={aiLogo} alt="AI" width={80} height={80} className="h-full w-full object-cover mix-blend-luminosity opacity-80" />
                  </div>
                </div>
                <h2 className="text-center text-xl font-bold text-fg px-4">
                  {t('ai.greeting' as any) ?? 'Salom! Qanday yordam bera olaman?'}
                </h2>
                <div className="grid grid-cols-2 gap-3 mt-8">
                  {USER_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => sendMessage(t(`ai.prompt.${p.key}` as any) ?? p.text)}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-bg-elevated p-4 text-center text-[13px] font-semibold text-fg hover:border-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm active:scale-95"
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <span className="line-clamp-2 leading-tight">{t(`ai.prompt.${p.key}` as any) ?? p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="mr-3 shrink-0 h-8 w-8 rounded-full bg-brand-primary/10 overflow-hidden border border-brand-primary/20">
                    <Image src={aiLogo} alt="AI" width={32} height={32} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-3xl px-5 py-3 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-primary text-white rounded-br-md'
                    : 'bg-bg-elevated text-fg rounded-tl-md border border-border'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="mr-3 shrink-0 h-8 w-8 rounded-full bg-brand-primary/10 overflow-hidden border border-brand-primary/20">
                  <Image src={aiLogo} alt="AI" width={32} height={32} className="h-full w-full object-cover" />
                </div>
                <div className="rounded-3xl rounded-tl-md bg-bg-elevated border border-border px-5 py-4 shadow-sm flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Input field fixed at bottom */}
          <div className="shrink-0 border-t border-border bg-bg-elevated p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-end gap-2 rounded-3xl border border-input-border bg-input pl-4 pr-1.5 py-1.5 shadow-sm focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={t('ai.placeholder' as any) ?? "Savol yozing..."}
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-3 text-[15px] text-fg placeholder:text-fg-muted focus:outline-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="mb-1 inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
