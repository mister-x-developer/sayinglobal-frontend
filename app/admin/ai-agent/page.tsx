'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Send, Loader2, Sparkles, MessageSquarePlus, Clock, ArrowLeft } from 'lucide-react';
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
  { key: 'stats', icon: '📊', text: 'Platform Statistics', desc: 'View overall status' },
  { key: 'queue', icon: '⏳', text: 'Pending Listings', desc: 'Moderation queue' },
  { key: 'scam', icon: '🚨', text: 'Suspicious Listings', desc: 'Possible fraud' },
  { key: 'broadcast', icon: '📢', text: 'Send Broadcast', desc: 'Notify everyone' },
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      const reply = res.data?.reply || res.data?.message || 'Error occurred.';
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: reply }]);
      apiClient.get('/ai-moderation/assistant/sessions/').then(r => setSessions(r.data)).catch(()=>{});
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: 'Temporary error. Please try again.' },
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

  return (
    <AdminLayout>
      <div className="flex h-[calc(100dvh-130px)] bg-bg-elevated overflow-hidden rounded-2xl border border-border shadow-sm relative">
        
        {/* Chat History Panel (Absolute overlay to save space) */}
        {showHistory && (
          <div className="absolute inset-0 z-20 flex">
            <div className="w-80 bg-bg-canvas border-r border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-left-8 duration-300">
              <div className="p-4 border-b border-border flex items-center justify-between bg-bg-elevated">
                <h3 className="font-bold text-fg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-primary" />
                  Chat History
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-2 rounded-full hover:bg-bg-subtle text-fg-subtle">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <button
                  onClick={createNewChat}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors shadow-sm"
                >
                  <MessageSquarePlus className="h-5 w-5" strokeWidth={2} />
                  <span className="font-semibold">New Chat</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-fg-muted text-center mt-4">History is empty</p>
                ) : (
                  sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      className={`flex flex-col items-start gap-1 w-full p-3 rounded-xl border transition-colors text-left ${s.id === sessionId ? 'border-brand-primary bg-brand-primary/5' : 'border-border bg-bg-elevated hover:bg-bg-subtle'}`}
                    >
                      <span className="text-sm font-semibold text-fg line-clamp-1">{s.title}</span>
                      <span className="text-[11px] text-fg-subtle font-medium">{new Date(s.updated_at).toLocaleString()}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg">
          
          {/* Clean Header */}
          <header className="h-16 border-b border-border bg-bg-elevated/95 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-brand-primary/10 border border-brand-primary/20 shrink-0 flex items-center justify-center shadow-inner">
                <Image src={aiLogo} alt="AI" width={32} height={32} className="object-contain mix-blend-luminosity" />
              </div>
              <div>
                <h1 className="text-base font-bold text-fg flex items-center gap-1.5">
                  AI Co-pilot <Sparkles className="h-4 w-4 text-brand-primary" />
                </h1>
                <p className="text-[11px] text-fg-muted font-medium uppercase tracking-wider">System Management & Analysis</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowHistory(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-canvas hover:bg-bg-subtle transition-colors text-sm font-semibold text-fg"
            >
              <Clock className="h-4 w-4 text-brand-primary" />
              <span className="hidden sm:inline">Tarix</span>
            </button>
          </header>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full animate-in fade-in duration-500">
                <div className="h-24 w-24 rounded-3xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-inner mb-6">
                  <Image src={aiLogo} alt="AI" width={80} height={80} className="object-contain mix-blend-luminosity opacity-90" />
                </div>
                <h2 className="text-2xl font-black text-fg mb-3 text-center">Tizimga xush kelibsiz</h2>
                <p className="text-center text-fg-muted mb-10 max-w-md text-sm leading-relaxed">
                  Men Sayin Global platformasining sun'iy intellekt yordamchisiman. Statistikani tahlil qilish, muammoli e'lonlarni tekshirish yoki bildirishnomalar yuborishda yordam beraman.
                </p>
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ADMIN_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => sendMessage(p.text)}
                      className="group flex flex-col items-start p-5 rounded-2xl border border-border bg-bg-elevated hover:border-brand-primary hover:shadow-lift transition-all text-left"
                    >
                      <span className="text-2xl mb-3 bg-bg-subtle p-2 rounded-xl group-hover:bg-brand-primary/10 transition-colors">{p.icon}</span>
                      <span className="text-[15px] font-bold text-fg mb-1">{p.text}</span>
                      <span className="text-[12px] text-fg-muted">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-6 w-full pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mr-4 shrink-0 h-10 w-10 rounded-2xl bg-brand-primary/10 overflow-hidden border border-brand-primary/20 flex items-center justify-center">
                      <Image src={aiLogo} alt="AI" width={28} height={28} className="object-contain mix-blend-luminosity" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-3xl px-6 py-4 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-primary text-white rounded-br-sm'
                      : 'bg-bg-elevated text-fg rounded-tl-sm border border-border'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="mr-4 shrink-0 h-10 w-10 rounded-2xl bg-brand-primary/10 overflow-hidden border border-brand-primary/20 flex items-center justify-center">
                    <Image src={aiLogo} alt="AI" width={28} height={28} className="object-contain mix-blend-luminosity" />
                  </div>
                  <div className="rounded-3xl rounded-tl-sm bg-bg-elevated border border-border px-6 py-5 shadow-sm flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* Clean Chat Input */}
          <div className="shrink-0 bg-bg p-4 sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="max-w-3xl mx-auto flex items-end gap-3 rounded-3xl border border-input-border bg-input pl-6 pr-3 py-3 shadow-sm focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all"
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
                placeholder="Agentga buyruq bering..."
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] text-fg placeholder:text-fg-muted focus:outline-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-md"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
              </button>
            </form>
            <p className="text-center text-[11px] text-fg-subtle mt-4 font-medium">
              AI Co-pilot xatoliklar qilishi mumkin. Muhim qarorlarni o'zingiz tekshiring.
            </p>
          </div>
          
        </div>
      </div>
    </AdminLayout>
  );
}
