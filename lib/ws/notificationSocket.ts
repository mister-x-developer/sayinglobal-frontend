'use client';

/**
 * NotificationSocketService — manages the WebSocket connection to the
 * backend notifications consumer.
 *
 * Features:
 * - Connects with access token (and optional refresh_jti for session revocation)
 * - Dispatches incoming messages to the Zustand notifications store
 * - Plays a sound on new notifications (respects user preference)
 * - Reconnects with exponential backoff (1s → 2s → 4s … max 30s)
 * - On close code 4001 (session revoked): logs out and redirects to /auth
 */

import { useAuthStore } from '../store/auth';
import { useNotificationsStore } from '../store/notifications';
import { playNotificationSound } from '../utils/notificationSound';

// Derive WebSocket base URL from env vars.
// NEXT_PUBLIC_WS_URL takes priority (e.g. wss://sayinglobal.up.railway.app/ws).
// Falls back to NEXT_PUBLIC_API_URL with http→ws and /api suffix stripped.
const WS_BASE = (() => {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (wsUrl) {
    // Strip trailing /ws if present — we'll append /ws/notifications/ ourselves
    return wsUrl.replace(/\/ws\/?$/, '');
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  return apiUrl
    .replace(/^http/, 'ws')
    .replace(/\/api\/?$/, '');
})();

class NotificationSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private readonly maxDelay = 30000;
  private shouldReconnect = false;
  private currentToken: string | null = null;

  connect(accessToken: string, refreshJti?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldReconnect = true;
    this.currentToken = accessToken;

    let url = `${WS_BASE}/ws/notifications/?access_token=${accessToken}`;
    if (refreshJti) url += `&refresh_jti=${refreshJti}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      // WebSocket constructor can throw in some environments
      if (this.shouldReconnect) this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      // Reset backoff on successful connection
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        const store = useNotificationsStore.getState();

        if (data.type === 'unread_count') {
          store.setUnreadCount(data.count ?? 0);
        } else if (data.type === 'notification') {
          // Play sound for new incoming notifications
          playNotificationSound();

          // Pick title/body based on current UI locale
          const uiLocale = (() => {
            if (typeof document === 'undefined') return 'uz';
            try {
              return document.cookie
                .split(';')
                .find((c) => c.trim().startsWith('sayin-locale='))
                ?.split('=')[1]?.trim() || 'uz';
            } catch { return 'uz'; }
          })();

          const localeKey = uiLocale.replace('-', '_'); // uz-cyrl → uz_cyrl
          const localizedTitle =
            data[`title_${localeKey}`] || data.title_uz || data.title || '';
          const localizedBody =
            data[`message_${localeKey}`] || data.message_uz || data.body || data.message || '';

          // Build notification object with all locale fields
          const notifItem = {
            public_id: data.notification_id ? Number(data.notification_id) : Date.now(),
            notification_type: (data.notif_type || data.notification_type || 'system') as any,
            title: localizedTitle,
            title_uz: data.title_uz || data.title || '',
            title_uz_cyrl: data.title_uz_cyrl || data.title || '',
            title_ru: data.title_ru || data.title || '',
            title_en: data.title_en || data.title || '',
            message: localizedBody,
            message_uz: data.message_uz || data.body || '',
            message_uz_cyrl: data.message_uz_cyrl || data.body || '',
            message_ru: data.message_ru || data.body || '',
            message_en: data.message_en || data.body || '',
            is_read: false,
            created_at: new Date().toISOString(),
            action_url: data.related_id ? `/notifications/${data.notification_id}` : undefined,
          };

          // Add to store
          store.addItem(notifItem);

          // Show toast with localized text
          if (typeof window !== 'undefined') {
            import('@/components/ui/Toast').then(({ toast }) => {
              const msg = localizedTitle
                ? `${localizedTitle}: ${localizedBody}`.slice(0, 80)
                : localizedBody.slice(0, 80);
              if (msg) toast.info(msg);
            }).catch(() => {});
          }
        }
      } catch {
        // Malformed message — ignore
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.ws = null;

      if (event.code === 4001) {
        // Session revoked by server — force logout
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
      // onerror is always followed by onclose — let onclose handle reconnect
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.currentToken = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000);
      this.ws = null;
    }
  }

  send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = this.reconnectDelay;
    this.reconnectTimer = setTimeout(() => {
      const token = this.currentToken || useAuthStore.getState().accessToken;
      if (token && this.shouldReconnect) {
        this.connect(token);
      }
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
    }, delay);
  }
}

export const notificationSocket = new NotificationSocketService();
