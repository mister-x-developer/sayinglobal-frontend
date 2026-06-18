'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft, Send, Search as SearchIcon, MessageSquareText,
  Check, CheckCheck, MoreVertical, Flag, Languages, Info,
} from 'lucide-react';

import { AppNav } from '@/components/layout/AppNav';
import { Avatar } from '@/components/ui/Avatar';
import { ChatListSkeleton } from '@/components/shared/LoadingStates';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { useAuthStore } from '@/lib/store/auth';
import { chatApi } from '@/lib/api/chat';
import type { Conversation } from '@/lib/api/chat';
import { chatSocket } from '@/lib/ws/chatSocket';
import { formatRelativeTime } from '@/lib/utils/format';
import apiClient from '@/lib/api/client';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  original?: string;
  created_at: string;
  is_read?: boolean;
  translating?: boolean;
  translated?: boolean;
  failed?: boolean;
}

function normalizeChatMessage(raw: any): Message {
  return {
    id: String(raw.public_id ?? raw.id ?? `msg-${raw.created_at ?? Date.now()}`),
    sender_id: String(raw.sender?.public_id ?? raw.sender_id ?? ''),
    content: raw.content ?? raw.text ?? '',
    created_at: raw.created_at ?? new Date().toISOString(),
    is_read: raw.is_read ?? false,
  };
}

function isSameOutgoingMessage(a: Message, b: Message, myId: string | null): boolean {
  if (!myId) return false;
  if (a.sender_id !== myId || b.sender_id !== myId) return false;
  if (a.content !== b.content) return false;
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return false;
  return Math.abs(aTime - bTime) < 15_000;
}

function mergeMessageList(prev: Message[], incoming: Message, myId: string | null): Message[] {
  if (prev.some((m) => m.id === incoming.id)) return prev;
  const localMatch = prev.find((m) => m.id.startsWith('local-') && isSameOutgoingMessage(m, incoming, myId));
  if (localMatch) {
    return prev.map((m) => (
      m.id === localMatch.id
        ? { ...incoming, original: m.original, translated: m.translated, translating: false }
        : m
    ));
  }
  return [...prev, incoming];
}

export default function ChatPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Track our pending optimistic message ids to prevent WS echo duplication
  const pendingOptimisticIds = useRef<Set<string>>(new Set());

  // My public_id as string — used for isMe check
  const myId = user?.public_id != null ? String(user.public_id) : null;

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }, 50);
  };

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    setConvLoading(true);
    chatApi.getConversations().then((data) => {
      if (!alive) return;
      const normalized = data.map((c: any) => ({
        ...c,
        last_message: typeof c.last_message === 'object' && c.last_message !== null
          ? c.last_message.content ?? '' : c.last_message ?? '',
        last_message_time: c.last_message_time
          ?? (typeof c.last_message === 'object' && c.last_message !== null
            ? c.last_message.created_at : undefined),
      }));
      setConversations(normalized);
    }).finally(() => alive && setConvLoading(false));
    return () => { alive = false; };
  }, [isAuthenticated]);

  // Handle ?with= param — open or create conversation
  useEffect(() => {
    const withId = searchParams.get('with');
    if (!withId || !isAuthenticated || convLoading) return;
    const sellerId = Number(withId);
    if (!sellerId) return;
    const existing = conversations.find((c) =>
      c.participants?.some((p: any) => p.public_id === sellerId)
    );
    if (existing) {
      if (activeConv?.public_id !== existing.public_id) {
        openConversation(existing);
        window.history.replaceState(null, '', '/chat');
      }
    } else {
      chatApi.startConversation(sellerId).then((conv) => {
        if (!conv) return;
        const norm: Conversation = {
          ...conv,
          last_message: typeof (conv as any).last_message === 'object'
            ? (conv as any).last_message?.content ?? '' : (conv as any).last_message ?? '',
        };
        setConversations((prev) => prev.some((c) => c.public_id === norm.public_id) ? prev : [norm, ...prev]);
        openConversation(norm);
        window.history.replaceState(null, '', '/chat');
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations, convLoading, isAuthenticated]);

  // Disconnect WebSocket on unmount
  useEffect(() => {
    return () => { chatSocket.disconnect(); };
  }, []);

  // Disconnect when no active conversation
  useEffect(() => {
    if (!activeConv) chatSocket.disconnect();
  }, [activeConv]);

  const openConversation = (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    setMessagesLoading(true);
    setMoreOpen(false);
    setTypingUserId(null);
    chatApi.getMessages(conv.id ?? conv.public_id).then((msgs: any) => {
      const list = Array.isArray(msgs) ? msgs : msgs?.results ?? [];
      const mapped: Message[] = list.map(normalizeChatMessage).reverse();
      setMessages(mapped);
      scrollToBottom(false);
    }).finally(() => setMessagesLoading(false));

    // Connect WebSocket for real-time messages
    const token = useAuthStore.getState().accessToken;
    if (token && (conv.id ?? conv.public_id)) {
      chatSocket.connect(String(conv.id ?? conv.public_id), token, {
        onMessage: (msg) => {
          setMessages((prev) => {
            const incoming = normalizeChatMessage(msg);
            const next = mergeMessageList(prev, incoming, myId);
            if (next !== prev) {
              pendingOptimisticIds.current.forEach((id) => {
                if (!next.some((m) => m.id === id)) pendingOptimisticIds.current.delete(id);
              });
            }
            return next;
          });
          scrollToBottom();
          // Update conversation last_message
          setConversations((prev) => prev.map((c) =>
            c.public_id === conv.public_id
              ? { ...c, last_message: msg.content, last_message_time: msg.created_at }
              : c
          ));
        },
        onTyping: (userId, isTyping) => {
          if (userId !== myId) {
            setTypingUserId(isTyping ? userId : null);
            // Auto-clear typing indicator after 3s
            if (isTyping) {
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              typingTimerRef.current = setTimeout(() => setTypingUserId(null), 3000);
            }
          }
        },
      });
    }
  };

  const sendMessage = useCallback(async () => {
    const content = text.trim();
    if (!content || !activeConv || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      sender_id: myId ?? 'me',
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      failed: false,
    };
    pendingOptimisticIds.current.add(optimistic.id);
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    scrollToBottom();

    // Send via WebSocket (primary) or HTTP fallback
    const sentViaWs = chatSocket.sendMessage(content);
    if (sentViaWs) {
      // WS echo will replace the optimistic message via onMessage handler
      setSending(false);
    } else {
      try {
        const sent = await chatApi.sendMessage(activeConv.id ?? activeConv.public_id, content);
        if (sent) {
          const sentId = String((sent as any).public_id ?? (sent as any).id ?? optimistic.id);
          pendingOptimisticIds.current.delete(optimistic.id);
          setMessages((prev) => prev.map((m) =>
            m.id === optimistic.id ? { ...m, id: sentId } : m
          ));
          setConversations((prev) => prev.map((c) =>
            c.public_id === activeConv.public_id
              ? { ...c, last_message: content, last_message_time: new Date().toISOString() }
              : c
          ));
        }
      } catch {
        pendingOptimisticIds.current.delete(optimistic.id);
        setMessages((prev) => prev.map((m) =>
          m.id === optimistic.id ? { ...m, failed: true } : m
        ));
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    }
    inputRef.current?.focus();
  }, [text, activeConv, sending, myId]);

  const retryMessage = useCallback(async (msgId: string, content: string) => {
    if (!activeConv) return;
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, failed: false } : m
    ));
    try {
      const sent = await chatApi.sendMessage(activeConv.id ?? activeConv.public_id, content);
      if (sent) {
        const sentId = String((sent as any).public_id ?? (sent as any).id ?? msgId);
        setMessages((prev) => prev.map((m) =>
          m.id === msgId ? { ...m, id: sentId, failed: false } : m
        ));
        setConversations((prev) => prev.map((c) =>
          c.public_id === activeConv.public_id
            ? { ...c, last_message: content, last_message_time: new Date().toISOString() }
            : c
        ));
      }
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, failed: true } : m
      ));
    }
  }, [activeConv]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Translate a single message
  const translateMessage = async (msgId: string, content: string) => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, translating: true } : m));
    try {
      const targetLang = locale === 'ru' ? 'ru' : locale === 'en' ? 'en' : locale === 'uz-cyrl' ? 'uz-cyrl' : 'uz';
      const res = await apiClient.post('/listings/translate/', { text: content, target_lang: targetLang });
      const translated = res.data?.translated_text ?? res.data?.text ?? content;
      setMessages((prev) => prev.map((m) =>
        m.id === msgId
          ? { ...m, translating: false, translated: true, original: m.original ?? m.content, content: translated }
          : m
      ));
    } catch {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, translating: false } : m));
    }
  };

  const revertTranslation = (msgId: string) => {
    setMessages((prev) => prev.map((m) =>
      m.id === msgId && m.original
        ? { ...m, content: m.original, original: undefined, translated: false }
        : m
    ));
  };

  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const other = getOther(c);
    return other?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  const getOther = (conv: Conversation) =>
    conv.participants?.find((p: any) => String(p.public_id) !== myId) ??
    conv.participants?.[0] ?? { public_id: 0, full_name: '—', avatar_url: '' };

  const isMyMessage = (msg: Message) => {
    if (!myId) return false;
    return msg.sender_id === myId || msg.sender_id === 'me';
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppNav />
      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <aside className={`flex flex-col border-r border-border bg-bg-elevated ${
          activeConv ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'
        }`}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h1 className="text-lg font-bold text-fg">{t('chat.title')}</h1>
          </div>
          {/* Search */}
          <div className="px-3 py-2.5">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('chat.searchConversations')}
                className="h-9 w-full rounded-xl border border-border bg-bg-subtle pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {convLoading ? (
              <ChatListSkeleton count={7} />
            ) : filteredConvs.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquareText className="mx-auto mb-2 h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg">{t('chat.noConversations')}</p>
                <p className="mt-1 text-xs text-fg-muted">{t('chat.startConversation')}</p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredConvs.map((conv) => {
                  const other = getOther(conv);
                  const isActive = activeConv?.public_id === conv.public_id;
                  return (
                    <button
                      key={conv.public_id}
                      type="button"
                      onClick={() => openConversation(conv)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-brand-primary/10 text-fg'
                          : 'hover:bg-bg-subtle'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar src={(other as any).avatar_url} name={other.full_name} size="md" />
                        {/* No hardcoded online dot — we don't track presence */}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm font-semibold ${isActive ? 'text-brand-primary' : 'text-fg'}`}>
                            {other.full_name}
                          </span>
                          {conv.last_message_time && (
                            <span className="flex-shrink-0 text-[11px] text-fg-subtle">
                              {formatRelativeTime(conv.last_message_time)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="truncate text-xs text-fg-muted">{conv.last_message || '...'}</p>
                          {(conv.unread_count ?? 0) > 0 && (
                            <span className="flex-shrink-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CHAT AREA ── */}
        <main className={`flex flex-1 flex-col overflow-hidden bg-bg ${
          !activeConv ? 'hidden md:flex' : 'flex'
        }`}>
          {!activeConv ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                <MessageSquareText className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-fg">{t('chat.noMessages')}</p>
              <p className="text-sm text-fg-muted">{t('chat.startConversation')}</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border bg-bg-elevated px-4 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveConv(null)}
                  className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-fg hover:bg-bg-subtle"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
                </button>
                <Link href={`/sellers/detail?id=${getOther(activeConv).public_id}`} className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={(getOther(activeConv) as any).avatar_url}
                      name={getOther(activeConv).full_name}
                      size="sm"
                    />
                    {/* No hardcoded online indicator — presence not tracked */}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-fg">{getOther(activeConv).full_name}</p>
                    <p className="text-xs text-fg-muted">
                      {locale === 'ru' ? 'Продавец' : locale === 'en' ? 'Seller' : 'Sotuvchi'}
                    </p>
                  </div>
                </Link>
                {/* Header actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle hover:text-danger transition-colors"
                    title={t('chat.reportUser')}
                  >
                    <Flag className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMoreOpen((v) => !v)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <AnimatePresence>
                      {moreOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-10 z-50 min-w-[160px] overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-lift"
                        >
                          <Link
                            href={`/sellers/detail?id=${getOther(activeConv).public_id}`}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg hover:bg-bg-subtle"
                            onClick={() => setMoreOpen(false)}
                          >
                            <Info className="h-4 w-4" strokeWidth={1.75} />
                            {t('common.view')} profil
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setReportOpen(true); setMoreOpen(false); }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/8"
                          >
                            <Flag className="h-4 w-4" strokeWidth={1.75} />
                            {t('chat.reportUser')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Messages area — wrapped in ErrorBoundary for granular crash recovery */}
              <ErrorBoundary>
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                onClick={() => setMoreOpen(false)}
              >
                {/* Messages loading skeleton */}
                {messagesLoading && (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} gap-2`}>
                        {i % 2 !== 0 && <div className="h-7 w-7 rounded-full bg-bg-subtle animate-pulse flex-shrink-0 self-end" />}
                        <div className={`h-10 rounded-2xl bg-bg-subtle animate-pulse ${i % 2 === 0 ? 'rounded-br-sm w-48' : 'rounded-bl-sm w-56'}`} />
                      </div>
                    ))}
                  </div>
                )}
                {!messagesLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                      <MessageSquareText className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-fg-muted">
                      {locale === 'ru' ? 'Начните разговор' : locale === 'en' ? 'Start the conversation' : 'Suhbatni boshlang'}
                    </p>
                  </div>
                )}
                {!messagesLoading && messages.map((msg, i) => {
                  const isMe = isMyMessage(msg);
                  const prevMsg = messages[i - 1];
                  const nextMsg = messages[i + 1];
                  const isFirstInGroup = !prevMsg || isMyMessage(prevMsg) !== isMe;
                  const isLastInGroup = !nextMsg || isMyMessage(nextMsg) !== isMe;
                  const showTime = isLastInGroup || (
                    nextMsg && new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() > 300_000
                  );

                  // Date separator
                  const msgDate = new Date(msg.created_at).toLocaleDateString();
                  const prevDate = prevMsg ? new Date(prevMsg.created_at).toLocaleDateString() : null;
                  const showDateSep = msgDate !== prevDate;
                  const today = new Date().toLocaleDateString();
                  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
                  const dateSepLabel = msgDate === today
                    ? (locale === 'ru' ? 'Сегодня' : locale === 'en' ? 'Today' : 'Bugun')
                    : msgDate === yesterday
                      ? (locale === 'ru' ? 'Вчера' : locale === 'en' ? 'Yesterday' : 'Kecha')
                      : new Date(msg.created_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-US' : 'uz-UZ', { day: 'numeric', month: 'long' });

                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {showDateSep && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[11px] font-semibold text-fg-subtle bg-bg px-2.5 py-0.5 rounded-full border border-border">{dateSepLabel}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Avatar + bubble row */}
                      <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar — only for other, only on last in group */}
                        {!isMe && (
                          <div className="w-7 flex-shrink-0 self-end mb-0.5">
                            {isLastInGroup ? (
                              <Avatar
                                src={(getOther(activeConv) as any).avatar_url}
                                name={getOther(activeConv).full_name}
                                size="xs"
                              />
                            ) : <div className="h-7 w-7" />}
                          </div>
                        )}
                        {/* Bubble */}
                        <div className="flex flex-col gap-0.5">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className={`relative px-3.5 py-2 text-sm leading-relaxed break-words ${
                              msg.failed
                                ? 'bg-danger/10 border border-danger/30 text-danger rounded-t-2xl rounded-br-2xl rounded-bl-sm'
                                : isMe
                                  ? `bg-brand-primary text-white ${isFirstInGroup ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isLastInGroup ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-lg'}`
                                  : `bg-bg-elevated border border-border text-fg ${isFirstInGroup ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isLastInGroup ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-lg'}`
                            }`}
                          >
                            {msg.content}
                            {msg.failed && (
                              <span className="ml-1 text-[10px] opacity-70">{t('chat.sendFailed')}</span>
                            )}
                            {msg.translated && (
                              <span className={`ml-1 text-[10px] opacity-70 ${isMe ? 'text-white' : 'text-fg-muted'}`}>
                                (tarjima)
                              </span>
                            )}
                          </motion.div>
                          {msg.failed && (
                            <button
                              type="button"
                              onClick={() => retryMessage(msg.id, msg.content)}
                              className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-danger hover:bg-danger/10 transition-colors"
                            >
                              {t('chat.retry')}
                            </button>
                          )}
                          {/* Actions: Translate + Report */}
                          <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'} px-1`}>
                            <button
                              type="button"
                              onClick={() => msg.translated ? revertTranslation(msg.id) : translateMessage(msg.id, msg.original ?? msg.content)}
                              disabled={msg.translating}
                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle hover:text-brand-primary hover:bg-brand-primary/8 transition-colors disabled:opacity-50"
                            >
                              <Languages className="h-3 w-3" strokeWidth={2} />
                              {msg.translating
                                ? '...'
                                : msg.translated
                                  ? (locale === 'ru' ? 'Оригинал' : locale === 'en' ? 'Original' : 'Asl')
                                  : (locale === 'ru' ? 'Перевести' : locale === 'en' ? 'Translate' : 'Tarjima')}
                            </button>
                            {/* Report message button */}
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Open report dialog specifically for this user
                                  setReportOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle hover:text-danger hover:bg-danger/10 transition-colors"
                                title={t('chat.reportUser')}
                              >
                                <Flag className="h-3 w-3" strokeWidth={2} />
                                {locale === 'ru' ? 'Пожаловаться' : locale === 'en' ? 'Report' : 'Shikoyat'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Time + read status */}
                      {showTime && (
                        <div className={`flex items-center gap-1 mt-0.5 mb-1 text-[11px] text-fg-subtle ${isMe ? 'pr-1' : 'pl-9'}`}>
                          <span>{formatRelativeTime(msg.created_at)}</span>
                          {isMe && (
                            msg.is_read
                              ? <CheckCheck className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} />
                              : <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                  );
                })}
                {/* Typing indicator */}
                {typingUserId && (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-fg-subtle"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14 }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-fg-muted">...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              </ErrorBoundary>

              {/* Input area — pb-safe for iOS keyboard */}
              <div className="border-t border-border bg-bg-elevated px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        chatSocket.sendTyping(e.target.value.length > 0);
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t('chat.typeMessage')}
                      rows={1}
                      className="w-full resize-none rounded-2xl border border-border bg-bg-subtle px-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={sendMessage}
                    disabled={!text.trim() || sending}
                    whileTap={{ scale: 0.92 }}
                    className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white shadow-md transition-all hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={t('chat.sendMessage')}
                  >
                    {sending
                      ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : <Send className="h-4 w-4 translate-x-0.5" strokeWidth={2.25} />}
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Report dialog */}
      {activeConv && (
        <ReportDialog
          open={reportOpen}
          target={{
            kind: 'chat',
            publicId: getOther(activeConv).public_id as number,
            fullName: getOther(activeConv).full_name,
          }}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
