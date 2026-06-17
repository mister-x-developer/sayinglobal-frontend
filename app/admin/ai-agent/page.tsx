'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Loader2, Sparkles, MessageSquarePlus, Clock, ArrowLeft, Terminal, Bot, Zap, Cpu } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { AdminAILogo } from '@/components/ai/AILogos';

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

  return (
    <AdminLayout noPadding>
      <div className="flex h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden relative font-sans">
        
        {/* Cyber Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)] pointer-events-none opacity-40 z-0" />

        {/* Chat History Drawer */}
        {showHistory && (
          <div className="absolute inset-0 z-50 flex">
            <div className="w-80 bg-black/80 backdrop-blur-3xl border-r border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-left-8 duration-300 relative z-10">
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-black tracking-wider text-white/90 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  ARCHIVE
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <button
                  onClick={createNewChat}
                  className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <MessageSquarePlus className="h-5 w-5" strokeWidth={2} />
                  <span className="font-bold tracking-widest uppercase text-xs">New Uplink</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 no-scrollbar">
                {sessions.length === 0 ? (
                  <p className="text-xs text-white/40 text-center mt-4 tracking-widest uppercase font-mono">No Logs Found</p>
                ) : (
                  sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      className={`flex flex-col items-start gap-1 w-full p-4 rounded-xl border transition-all text-left group ${s.id === sessionId ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'}`}
                    >
                      <span className="text-sm font-bold text-white/90 line-clamp-1 group-hover:text-white transition-colors">{s.title}</span>
                      <span className="text-[10px] text-white/40 font-mono tracking-wider">{new Date(s.updated_at).toLocaleString()}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          </div>
        )}

        {/* Main Interface */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          
          {/* Header */}
          <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-4">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <AdminAILogo size={32} />
                <div className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-black border border-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-black leading-none text-white tracking-tight flex items-center gap-2">
                  AI CO-PILOT
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                </h1>
                <p className="mt-1 text-[10px] font-mono text-indigo-400/70 uppercase tracking-[0.2em] flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  SYSTEM MANAGEMENT ENGINE
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowHistory(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs font-black tracking-widest uppercase text-white/80"
            >
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span className="hidden sm:inline">Logs</span>
            </button>
          </header>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 space-y-8 no-scrollbar bg-transparent">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-700">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                  <div className="h-28 w-28 rounded-[2rem] bg-indigo-500/5 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)] relative z-10">
                    <AdminAILogo size={80} />
                  </div>
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tight mb-4 text-center">SYSTEM READY</h2>
                <p className="text-center text-white/50 mb-12 max-w-lg text-sm leading-relaxed font-medium">
                  Men Sayin Global platformasining sun'iy intellekt yordamchisiman. Statistikani tahlil qilish, muammoli e'lonlarni tekshirish yoki bildirishnomalar yuborishda yordam beraman.
                </p>
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ADMIN_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => sendMessage(p.text)}
                      className="group flex flex-col items-start p-6 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/[0.02] hover:border-indigo-500/30 backdrop-blur-xl transition-all text-left"
                    >
                      <span className="text-2xl mb-4 bg-white/5 p-3 rounded-xl border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all shadow-inner">{p.icon}</span>
                      <span className="text-sm font-black text-white/90 mb-1.5 uppercase tracking-wider">{p.text}</span>
                      <span className="text-xs text-white/40 font-medium">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8 w-full pb-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mr-4 shrink-0 h-10 w-10 rounded-2xl bg-indigo-500/5 overflow-hidden border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.05)] mt-1">
                      <AdminAILogo size={26} />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-3xl px-6 py-4 text-[15px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm shadow-[0_4px_20px_rgba(79,70,229,0.3)]'
                      : 'bg-white/[0.03] text-white/90 rounded-tl-sm border border-white/10 backdrop-blur-md shadow-2xl'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="mr-4 shrink-0 h-10 w-10 rounded-2xl bg-indigo-500/5 overflow-hidden border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.05)] mt-1">
                    <AdminAILogo size={26} className="animate-pulse" />
                  </div>
                  <div className="rounded-3xl rounded-tl-sm bg-white/[0.03] border border-white/10 px-6 py-5 backdrop-blur-md flex items-center gap-2 shadow-2xl">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 sm:p-6 sm:pb-8 pt-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="max-w-4xl mx-auto flex items-end gap-3 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl pl-6 pr-3 py-3 shadow-2xl focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all"
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
                placeholder="Enter command directive..."
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] font-medium text-white placeholder:text-white/30 focus:outline-none placeholder:font-mono placeholder:tracking-widest"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
              </button>
            </form>
            <p className="text-center text-[10px] text-white/30 mt-4 font-mono tracking-[0.2em] uppercase">
              AI RESPONSES MAY REQUIRE HUMAN VERIFICATION
            </p>
          </div>
          
        </div>
      </div>
    </AdminLayout>
  );
}
