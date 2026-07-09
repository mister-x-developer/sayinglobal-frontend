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

        // F-50 fix: consume the backend `session.revoked` JSON event payload
        // before the close-code redirect path runs. The event carries the
        // session_id (our own session, not someone else's) plus an optional
        // reason string that lets us surface a localized toast. Once the
        // toast is rendered the close-code handler below sweeps the user
        // to /auth.
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
                /* never block the close path on toast failures */
              }
            }).catch(() => {});
          }
          return;
        }

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
          // notification_id is now a 9-digit id (int), not UUID
          const notifPublicId = data.notification_id ? Number(data.notification_id) : 0;
          const notifItem = {
            id: notifPublicId || Date.now(),
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
            // action_url from backend (already uses id routes)
            action_url: data.action_url || (notifPublicId ? `/notifications/${notifPublicId}` : undefined),
          };

          // Add to store
          store.addItem(notifItem);

          // Show toast with localized text and navigation
          if (typeof window !== 'undefined') {
            import('@/components/ui/Toast').then(({ toast }) => {
              const actionUrl = notifItem.action_url;
              const markAsRead = () => {
                // Mark notification as read when toast is clicked
                if (notifItem.id) {
                  notificationSocket.markRead(notifItem.id);
                  useNotificationsStore.getState().markRead(notifItem.id);
                }
              };
              if (localizedTitle) {
                toast.notification(localizedTitle, localizedBody.slice(0, 100) || undefined, actionUrl || '/notifications', markAsRead);
              } else if (localizedBody) {
                toast.info(localizedBody.slice(0, 80), undefined, actionUrl || '/notifications');
              }
            }).catch(() => {});
          }
        }
      } catch {
        // Malformed message — ignore
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.ws = null;

      // F-47 fix: recognise the full spec-mandated close-code map.
      //   4001 — backend's legacy "session revoked" code (pre-F-20)
      //   4401 — spec-mandated "unauthenticated" (post-F-20 backend)
      //   4003 — backend's legacy "session revoked" alternate
      //   4403 — spec-mandated "session revoked" (post-F-20 backend)
      // All four are auth-fatal: stop reconnecting, clear auth state, and
      // bounce the user to /auth. The previous code only matched 4001 and
      // would reconnect-loop forever on the new codes.
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

  /** Mark a notification as read by its id (9-digit int). */
  markRead(publicId: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'mark_read',
        notification_id: publicId,  // backend accepts id (int)
      }));
    }
  }

  /** Mark all notifications as read. */
  markAllRead(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'mark_all_read' }));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = this.reconnectDelay;
    this.reconnectTimer = setTimeout(() => {
      // F-48 fix: always re-read the live access token from the auth store.
      // The previous `this.currentToken || useAuthStore.getState().accessToken`
      // short-circuited to `currentToken` whenever it was non-null, which
      // was always during the lifetime of a connected session — so
      // post-rotation reconnects used the OLD token and 4001/4401'd
      // until the backoff cap or until the next REST refresh.
      const token = useAuthStore.getState().accessToken;
      if (token && this.shouldReconnect) {
        this.connect(token);
      }
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
    }, delay);
  }
}

export const notificationSocket = new NotificationSocketService();
