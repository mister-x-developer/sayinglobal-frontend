'use client';

import { useAuthStore } from '../store/auth';

const WS_BASE = (() => {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (wsUrl) return wsUrl.replace(/\/ws\/?$/, '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  return apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
})();

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type?: string;
}

type MessageHandler = (msg: ChatMessage) => void;
type TypingHandler = (userId: string, isTyping: boolean) => void;
type HistoryHandler = (messages: ChatMessage[]) => void;

class ChatSocketService {
  private ws: WebSocket | null = null;
  private conversationId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private readonly maxDelay = 30000;
  private shouldReconnect = false;

  private onMessageCb: MessageHandler | null = null;
  private onTypingCb: TypingHandler | null = null;
  private onHistoryCb: HistoryHandler | null = null;

  connect(
    conversationId: string,
    accessToken: string,
    callbacks: {
      onMessage: MessageHandler;
      onTyping?: TypingHandler;
      onHistory?: HistoryHandler;
    }
  ): void {
    // Disconnect existing connection if switching conversations
    if (this.conversationId !== conversationId) {
      this.disconnect();
    }
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.conversationId = conversationId;
    this.shouldReconnect = true;
    this.onMessageCb = callbacks.onMessage;
    this.onTypingCb = callbacks.onTyping || null;
    this.onHistoryCb = callbacks.onHistory || null;

    const url = `${WS_BASE}/ws/chat/${conversationId}/?access_token=${accessToken}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      if (this.shouldReconnect) this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);

        // F-50 fix: forward the backend `session.revoked` JSON event
        // payload to a localized toast before onclose(4403) sweeps the
        // user to /auth. Same handling as in notificationSocket.
        if (data.type === 'session.revoked' || data.event === 'session.revoked') {
          if (typeof window !== 'undefined') {
            void Promise.all([
              import('@/components/ui/Toast'),
              import('@/lib/i18n/runtime'),
            ]).then(([{ toast }, runtime]) => {
              try {
                const reason = (data.reason as string | undefined) ?? 'session_revoked';
                const localeKey = reason === 'admin_revoke'
                  ? 'auth.sessionRevokedByAdmin'
                  : reason === 'user_revoke_other_session'
                    ? 'auth.sessionRevokedByOtherSession'
                    : 'auth.sessionRevoked';
                const localized = runtime.tRuntime?.(localeKey)
                  ?? 'Sizning seansingiz tugatildi.';
                toast.warning(localized);
              } catch {
                /* never block the close path */
              }
            }).catch(() => {});
          }
          return;
        }

        if (data.type === 'message_history' && this.onHistoryCb) {
          this.onHistoryCb(data.messages || []);
        } else if (data.type === 'chat_message' && this.onMessageCb) {
          const msg = data.message;
          // Play sound for incoming messages (not own messages)
          import('../utils/notificationSound').then(({ playChatSound }) => {
            playChatSound();
          }).catch(() => {});
          this.onMessageCb({
            id: msg.id,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            sender_avatar: msg.sender_avatar,
            content: msg.content,
            created_at: msg.created_at,
            is_read: msg.is_read,
            message_type: msg.message_type,
          });
        } else if (data.type === 'typing' && this.onTypingCb) {
          this.onTypingCb(data.user_id, data.is_typing);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.ws = null;
      // F-49 fix: align with notificationSocket. Auth-fatal close codes
      // (4001 / 4401 legacy and spec; 4003 / 4403 legacy and spec) must
      // both stop reconnecting AND force a sign-out + redirect, so the
      // user is not left staring at a stale conversation list while
      // their session is revoked server-side.
      if (
        event.code === 4001 || event.code === 4401 ||
        event.code === 4003 || event.code === 4403
      ) {
        this.shouldReconnect = false;
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return;
      }
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.conversationId = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000);
      this.ws = null;
    }
  }

  sendMessage(content: string): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat_message', content }));
      return true;
    }
    return false;
  }

  sendTyping(isTyping: boolean): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  }

  markRead(messageId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'mark_read', message_id: messageId }));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = this.reconnectDelay;
    this.reconnectTimer = setTimeout(() => {
      const token = useAuthStore.getState().accessToken;
      if (token && this.shouldReconnect && this.conversationId) {
        this.connect(this.conversationId, token, {
          onMessage: this.onMessageCb!,
          onTyping: this.onTypingCb || undefined,
          onHistory: this.onHistoryCb || undefined,
        });
      }
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
    }, delay);
  }
}

export const chatSocket = new ChatSocketService();
