'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Send,
  Search as SearchIcon,
  MessageSquareText,
  Check,
  CheckCheck,
  MoreVertical,
  X,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { TranslateButton } from '@/components/shared/TranslateButton';
import { useAuthStore } from '@/lib/store/auth';
import { chatApi } from '@/lib/api/chat';
import type { Conversation, ChatMessage } from '@/lib/api/chat';
import { formatRelativeTime } from '@/lib/utils/format';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  _original?: string;
}

export default function ChatPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setHydrated(true), []);
  /* auth gating handled by middleware */

  // Load conversations from backend
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    setConvLoading(true);
    chatApi.getConversations().then((data) => {
      if (alive) setConversations(data);
    }).finally(() => alive && setConvLoading(false));
    return () => { alive = false; };
  }, [isAuthenticated]);

  // Auto-open conversation from ?with= param
  useEffect(() => {
    const withId = searchParams.get('with');
    if (withId && conversations.length > 0) {
      const conv = conversations.find((c) =>
        c.participants?.some((p: any) => p.public_id === Number(withId))
      );
      if (conv) openConversation(conv);
    }
  }, [searchParams, conversations]);

  const openConversation = (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    chatApi.getMessages(conv.id).then((msgs) => {
      setMessages(
        msgs.map((m: any) => ({
          id: String(m.id ?? m.public_id),
          sender_id: String(m.sender?.public_id ?? m.sender_id ?? ''),
          content: m.content ?? m.text ?? '',
          created_at: m.created_at,
          is_read: m.is_read,
        }))
      );
    });
  };

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const sendMessage = useCallback(async () => {
    if (!text.trim() || !activeConv) return;
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      sender_id: String(user?.public_id ?? 'me'),
      content: text.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    try {
      const sent = await chatApi.sendMessage(activeConv.id, optimistic.content);
      if (sent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id
              ? { ...m, id: String((sent as any).id ?? (sent as any).public_id ?? m.id) }
              : m
          )
        );
      }
    } catch {
      // Keep optimistic message — user can retry
    }
  }, [text, activeConv, user?.public_id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConvs = conversations.filter((c) => {
    const other = c.participants?.find((p: any) => p.public_id !== user?.public_id) ?? c.participants?.[0];
    return other?.full_name?.toLowerCase().includes(search.toLowerCase()) ?? true;
  });

  const myId = String(user?.public_id ?? 0);

  // Helper: get the other participant from a conversation
  const getOther = (conv: Conversation) =>
    conv.participants?.find((p: any) => String(p.public_id) !== myId) ??
    conv.participants?.[0] ?? { public_id: 0, full_name: '—', avatar_url: '' };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <main className="flex-1 overflow-hidden">
        <div className="container-page h-[calc(100vh-4rem)] py-4 sm:py-6">
          <div className="flex h-full overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-soft">

            {/* SIDEBAR */}
            <aside
              className={`flex w-full flex-col border-r border-border md:w-80 lg:w-96 ${
                activeConv ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="border-b border-border p-4">
                <h2 className="display-sm">{t('chat.title')}</h2>
                <div className="relative mt-3">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('chat.searchConversations')}
                    className="input-base h-10 w-full pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConvs.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={MessageSquareText}
                      title={t('chat.noConversations')}
                      description={t('chat.startConversation')}
                    />
                  </div>
                ) : (
                  filteredConvs.map((conv) => {
                    const active = activeConv?.id === conv.id;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => openConversation(conv)}
                        className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                          active ? 'bg-brand-primary/8' : 'hover:bg-bg-subtle'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={getOther(conv).avatar_url}
                            name={getOther(conv).full_name}
                            size="md"
                          />
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg-elevated bg-success" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-sm font-semibold text-fg">
                              {getOther(conv).full_name}
                            </span>
                            {conv.last_message_time && (
                              <span className="ml-2 flex-shrink-0 text-xs text-fg-subtle">
                                {formatRelativeTime(conv.last_message_time)}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between">
                            <p className="truncate text-xs text-fg-muted">{conv.last_message}</p>
                            {(conv.unread_count ?? 0) > 0 && (
                              <span className="ml-2 inline-flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* CONVERSATION */}
            <div className={`flex flex-1 flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
              {!activeConv ? (
                <div className="flex flex-1 items-center justify-center">
                  <EmptyState
                    icon={MessageSquareText}
                    title={t('chat.noMessages')}
                    description={t('chat.startConversation')}
                  />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setActiveConv(null)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg hover:bg-bg-subtle md:hidden"
                      aria-label={t('common.back')}
                    >
                      <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                    <Link href={`/sellers/${getOther(activeConv).public_id}`} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar
                          src={getOther(activeConv).avatar_url}
                          name={getOther(activeConv).full_name}
                          size="sm"
                        />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bg-elevated bg-success" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-fg">{getOther(activeConv).full_name}</p>
                        <p className="text-xs text-success">{t('chat.online')}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-fg hover:bg-bg-subtle"
                      aria-label="More"
                    >
                      <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="space-y-1">
                      {messages.map((msg, i) => {
                        const isMe = msg.sender_id === 'me' || msg.sender_id === myId;
                        const prevMsg = messages[i - 1];
                        const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                        const showTime =
                          !messages[i + 1] ||
                          new Date(messages[i + 1].created_at).getTime() - new Date(msg.created_at).getTime() > 300000;

                        return (
                          <div key={msg.id}>
                            <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isMe && (
                                <div className="w-7 flex-shrink-0">
                                  {showAvatar && (
                                    <Avatar
                                      src={getOther(activeConv).avatar_url}
                                      name={getOther(activeConv).full_name}
                                      size="xs"
                                    />
                                  )}
                                </div>
                              )}
                              <div className={`group relative max-w-[72%]`}>
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    isMe
                                      ? 'rounded-br-sm bg-brand-primary text-white'
                                      : 'rounded-bl-sm bg-bg-subtle text-fg'
                                  }`}
                                >
                                  {msg.content}
                                </motion.div>
                                {/* Translate button — appears on hover */}
                                <div className={`mt-1 flex opacity-0 transition-opacity group-hover:opacity-100 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <TranslateButton
                                    text={msg.content}
                                    compact
                                    className="text-[10px]"
                                    onTranslated={(translated) => {
                                      // Update message content inline
                                      if (translated) {
                                        setMessages((prev) =>
                                          prev.map((m) =>
                                            m.id === msg.id
                                              ? { ...m, content: translated, _original: m._original ?? m.content }
                                              : m
                                          )
                                        );
                                      } else {
                                        // Revert to original
                                        setMessages((prev) =>
                                          prev.map((m) =>
                                            m.id === msg.id && (m as any)._original
                                              ? { ...m, content: (m as any)._original, _original: undefined }
                                              : m
                                          )
                                        );
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            {showTime && (
                              <div className={`mt-1 mb-2 flex items-center gap-1 text-[11px] text-fg-subtle ${isMe ? 'justify-end pr-2' : 'justify-start pl-9'}`}>
                                <span>{formatRelativeTime(msg.created_at)}</span>
                                {isMe && (
                                  msg.is_read
                                    ? <CheckCheck className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} />
                                    : <Check className="h-3.5 w-3.5" strokeWidth={2} />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Typing indicator */}
                      <AnimatePresence>
                        {typing && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="flex items-end gap-2"
                          >
                            <div className="w-7 flex-shrink-0">
                              <Avatar
                                src={getOther(activeConv).avatar_url}
                                name={getOther(activeConv).full_name}
                                size="xs"
                              />
                            </div>
                            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bg-subtle px-4 py-3">
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  className="h-2 w-2 rounded-full bg-fg-subtle"
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-border p-3">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('chat.typeMessage')}
                        rows={1}
                        className="input-base flex-1 resize-none py-2.5 text-sm"
                        style={{ maxHeight: '120px' }}
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!text.trim()}
                        className="btn btn-primary btn-icon flex-shrink-0"
                        aria-label={t('chat.sendMessage')}
                      >
                        <Send className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
