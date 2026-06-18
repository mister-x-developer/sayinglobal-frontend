'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Send, Loader2, Sparkles, MessageSquarePlus, Clock, ArrowLeft, Terminal } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import apiClient from '@/lib/api/client';
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

export default function AdminAIAgentPage() {
  const t = useTranslations();
  const locale = useLocale();

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
        // Pass current UI locale so the AI responds in the same language
        locale,
      });
      const reply = res.data?.reply || res.data?.message || t('ai.errorReply');
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: reply }]);
      apiClient.get('/ai-moderation/assistant/sessions/').then(r => setSessions(r.data)).catch(() => {});
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: t('ai.errorReply') },
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

  const quickPrompts = [
    { key: 'adminCheckNew', icon: '🔍' },
    { key: 'adminComplaints', icon: '⚠️' },
    { key: 'adminStats', icon: '📊' },
    { key: 'adminSpam', icon: '🚨' },
  ];

  return (
    <AdminLayout noPadding>
      <div className="flex h-[100dvh] bg-bg text-fg overflow-hidden relative font-sans">

        {/* Chat History Drawer */}
        {showHistory && (
          <div className="absolute inset-0 z-50 flex">
            <div className="w-80 bg-bg-elevated border-r border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-left-8 duration-300 relative z-10">
              <div className="p-5 border-b border-border flex items-center justify-between bg-bg-subtle/50">
                <h3 className="font-bold text-fg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-fg-muted" />
                  {t('ai.chatHistory')}
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl hover:bg-bg transition-colors">
                  <ArrowLeft className="h-4 w-4 text-fg-muted" />
                </button>
              </div>
              <div className="p-4">
                <button
                  onClick={createNewChat}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shadow-sm"
                >
                  <MessageSquarePlus className="h-5 w-5" strokeWidth={2} />
                  <span className="font-bold tracking-wide text-sm">{t('ai.newChat')}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 no-scrollbar">
                {sessions.length === 0 ? (
                  <p className="text-sm text-fg-subtle text-center mt-4">{t('ai.noChats')}</p>
                ) : (
                  sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      className={`flex flex-col items-start gap-1 w-full p-4 rounded-xl border transition-all text-left group ${s.id === sessionId ? 'border-brand-primary/50 bg-brand-primary/5 shadow-sm' : 'border-border bg-bg-subtle hover:bg-bg-elevated hover:border-border-hover'}`}
                    >
                      <span className="text-sm font-semibold text-fg line-clamp-1">{s.title}</span>
                      <span className="text-xs text-fg-subtle">{new Date(s.updated_at).toLocaleDateString(locale)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          </div>
        )}

        {/* Main Interface */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">

          {/* Header */}
          <header className="h-16 border-b border-border bg-bg-elevated/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-subtle border border-border">
                <AdminAILogo size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none text-fg tracking-tight flex items-center gap-2">
                  {t('ai.adminTitle')}
                  <Sparkles className="h-4 w-4 text-brand-primary" />
                </h1>
                <p className="text-xs text-fg-muted mt-0.5">{t('ai.adminSubtitle')}</p>
              </div>
            </div>

            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-bg hover:bg-bg-subtle transition-colors text-sm font-semibold text-fg-muted"
            >
              <Terminal className="h-4 w-4" />
              <span className="hidden sm:inline">{t('ai.chatHistory')}</span>
            </button>
          </header>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 space-y-6 no-scrollbar bg-bg">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-700">
                <div className="mb-8 h-24 w-24 rounded-2xl bg-bg-subtle flex items-center justify-center border border-border shadow-sm">
                  <AdminAILogo size={56} />
                </div>
                <h2 className="text-2xl font-bold text-fg tracking-tight mb-3 text-center">{t('ai.adminGreeting')}</h2>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {quickPrompts.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => sendMessage(t(`ai.prompt.${p.key}` as any))}
                      className="group flex flex-col items-start p-5 rounded-xl border border-border bg-bg-elevated hover:bg-bg-subtle hover:border-brand-primary/30 transition-all text-left shadow-sm hover:shadow-md"
                    >
                      <span className="text-xl mb-3">{p.icon}</span>
                      <span className="text-sm font-bold text-fg mb-1">{t(`ai.prompt.${p.key}` as any)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto space-y-6 w-full pb-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 mb-1 h-10 w-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center shadow-sm">
                      <AdminAILogo size={24} />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-6 py-4 text-[15px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-brand-primary text-white rounded-br-sm shadow-md'
                      : 'bg-bg-elevated text-fg rounded-tl-sm border border-border shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start items-end gap-3 animate-in fade-in duration-300">
                  <div className="shrink-0 mb-1 h-10 w-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center shadow-sm">
                    <AdminAILogo size={24} className="animate-pulse" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-bg-elevated border border-border px-6 py-5 flex items-center gap-2 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-brand-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 bg-bg border-t border-border p-4 sm:p-6 sm:pb-8">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="max-w-4xl mx-auto flex items-end gap-3 rounded-2xl border border-border bg-bg-elevated pl-5 pr-2 py-2 shadow-sm focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all"
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
                placeholder={t('ai.inputPlaceholder')}
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm font-medium text-fg placeholder:text-fg-muted focus:outline-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white transition-all hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
              </button>
            </form>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
