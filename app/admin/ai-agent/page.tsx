'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Send, Loader2, Sparkles, MessageSquarePlus, MessageSquare, Clock, Menu } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';

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
  { key: 'stats', icon: '📊', text: 'Platforma statistikasi' },
  { key: 'queue', icon: '⏳', text: "Kutilayotgan e'lonlar" },
  { key: 'scam', icon: '🚨', text: "Shubhali e'lonlar" },
  { key: 'broadcast', icon: '📢', text: 'Hammaga xabar yozish' },
];

export default function AdminAIAgentPage() {
  const t = useTranslations();
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2));
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showHistory]);

  useEffect(() => {
    apiClient.get('/ai-moderation/assistant/sessions/')
      .then(res => setSessions(res.data))
      .catch(() => {});
  }, []);

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
      const reply = res.data?.reply || res.data?.message || 'Xatolik yuz berdi.';
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: reply }]);
      apiClient.get('/ai-moderation/assistant/sessions/').then(r => setSessions(r.data)).catch(()=>{});
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: "Vaqtinchalik xatolik. Qayta urining." },
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

  const aiLogo = '/images/admin_ai_logo.png';
  const aiTitle = 'Admin AI Co-pilot';
  const aiSubtitle = 'Agent (Tizim boshqaruvi)';

  return (
    <AdminLayout>
      <div className="flex h-[calc(100dvh-64px)] md:h-[100dvh] bg-bg-elevated overflow-hidden relative">
        
        {/* Sidebar History (Desktop) or Overlay (Mobile) */}
        <div className={`${showHistory ? 'translate-x-0' : '-translate-x-full'} absolute md:relative z-10 w-72 h-full bg-bg-canvas border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col`}>
          <div className="p-4">
            <button
              onClick={createNewChat}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-dashed border-brand-primary text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors shadow-sm"
            >
              <MessageSquarePlus className="h-5 w-5" strokeWidth={2} />
              <span className="font-semibold">Yangi Chat</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <div className="text-xs font-bold text-fg-subtle uppercase tracking-wider mb-3">Tarix</div>
            {sessions.length === 0 ? (
              <p className="text-sm text-fg-muted text-center mt-4">Suhbatlar yo'q</p>
            ) : (
              sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`flex items-start gap-3 w-full p-3 rounded-xl border transition-colors text-left ${s.id === sessionId ? 'border-brand-primary bg-brand-primary/5' : 'border-border bg-bg-elevated hover:bg-bg-subtle'}`}
                >
                  <MessageSquare className={`h-4 w-4 mt-0.5 shrink-0 ${s.id === sessionId ? 'text-brand-primary' : 'text-fg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">{s.title}</p>
                    <p className="text-[10px] text-fg-subtle mt-1">{new Date(s.updated_at).toLocaleDateString()}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg">
          {/* Header */}
          <div className="h-16 border-b border-border bg-bg/95 backdrop-blur flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowHistory(!showHistory)} className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl text-fg-subtle hover:bg-bg-subtle">
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-brand-primary/20 shrink-0">
                <Image src={aiLogo} alt="AI" width={40} height={40} className="object-cover" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-fg flex items-center gap-1.5">
                  {aiTitle} <Sparkles className="h-4 w-4 text-brand-primary" />
                </p>
                <p className="text-xs text-brand-primary font-medium">{aiSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 && (
              <div className="py-10 max-w-2xl mx-auto w-full">
                <div className="flex justify-center mb-6">
                  <div className="h-24 w-24 rounded-3xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-inner">
                    <Image src={aiLogo} alt="AI" width={96} height={96} className="object-cover mix-blend-luminosity opacity-80" />
                  </div>
                </div>
                <h2 className="text-center text-2xl font-black text-fg mb-2">Admin AI Agentga Xush Kelibsiz!</h2>
                <p className="text-center text-fg-muted mb-8 max-w-md mx-auto">
                  Men platformani boshqarish, statistikani ko'rish, muammolarni hal qilish va e'lonlarni tekshirish bo'yicha yordamchingizman. Menga to'g'ridan-to'g'ri buyruq berishingiz mumkin.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ADMIN_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => sendMessage(p.text)}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-bg-elevated p-4 text-left font-semibold text-fg hover:border-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{p.icon}</span>
                      <span className="text-[14px]">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-6 w-full pb-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mr-3 shrink-0 h-10 w-10 rounded-full bg-brand-primary/10 overflow-hidden border border-brand-primary/20">
                      <Image src={aiLogo} alt="AI" width={40} height={40} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm ${
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
                  <div className="mr-3 shrink-0 h-10 w-10 rounded-full bg-brand-primary/10 overflow-hidden border border-brand-primary/20">
                    <Image src={aiLogo} alt="AI" width={40} height={40} className="h-full w-full object-cover" />
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
          </div>

          {/* Chat Input */}
          <div className="shrink-0 border-t border-border bg-bg/90 backdrop-blur p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="max-w-3xl mx-auto flex items-end gap-2 rounded-3xl border border-input-border bg-input pl-5 pr-2 py-2 shadow-sm focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all"
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
                placeholder="Agentga buyruq bering (masalan: Statistikani ko'rsat, Falonchini blokla...)"
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-3 text-[15px] text-fg placeholder:text-fg-muted focus:outline-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4.5 w-4.5 ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
