/**
 * Notifications store — uses public_id (number) as the identifier.
 * Unread count is always derived from items to stay consistent.
 */

import { create } from 'zustand';
import type { Notification } from '../api/notifications';

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  setItems: (items: Notification[]) => void;
  setUnreadCount: (n: number) => void;
  markRead: (publicId: number) => void;
  markAllRead: () => void;
  remove: (publicId: number) => void;
  addItem: (item: Notification) => void;
  /**
   * F-51 fix: clear all in-memory notifications + unread count. Called from
   * the auth-store sign-out path so the next user (or anonymous render) does
   * not briefly see the previous user's notifications.
   */
  reset: () => void;
}

function countUnread(items: Notification[]) {
  return items.filter((n) => !n.is_read).length;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  unreadCount: 0,

  setItems: (items) =>
    set({ items, unreadCount: countUnread(items) }),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  markRead: (publicId) =>
    set((state) => {
      const items = state.items.map((n) =>
        n.public_id === publicId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      );
      return { items, unreadCount: countUnread(items) };
    }),

  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  remove: (publicId) =>
    set((state) => {
      const items = state.items.filter((n) => n.public_id !== publicId);
      return { items, unreadCount: countUnread(items) };
    }),

  addItem: (item) =>
    set((state) => {
      const items = [item, ...state.items];
      return { items, unreadCount: countUnread(items) };
    }),

  reset: () => set({ items: [], unreadCount: 0 }),
}));
