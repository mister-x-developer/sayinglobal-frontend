/**
 * Notifications API — uses public_id (number) for all external identifiers.
 */

import apiClient, { handleApiError } from './client';

export type NotificationType =
  | 'listing_comment'
  | 'listing_favorite'
  | 'listing_sold'
  | 'listing_expired'
  | 'message_received'
  | 'follow'
  | 'rating'
  | 'complaint_update'
  | 'admin_message'
  | 'system';

export interface Notification {
  public_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  action_url?: string;
  from_user?: { public_id: number; full_name: string; avatar_url?: string } | null;
  listing?: { public_id: number; title: string } | null;
  metadata?: Record<string, unknown>;
}

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    try {
      const res = await apiClient.get<Notification[]>('/notifications/');
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  async unreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ count: number }>('/notifications/unread-count/');
      return res.data?.count ?? 0;
    } catch {
      return 0;
    }
  },

  async markRead(publicId: number): Promise<void> {
    try {
      await apiClient.post(`/notifications/${publicId}/read/`);
    } catch {}
  },

  async markAllRead(): Promise<void> {
    try {
      await apiClient.post('/notifications/read-all/');
    } catch {}
  },

  async deleteNotification(publicId: number): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${publicId}/delete/`);
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async deleteAll(): Promise<void> {
    try {
      await apiClient.delete('/notifications/delete-all/');
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },
};
