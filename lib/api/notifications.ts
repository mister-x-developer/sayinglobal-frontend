/**
 * Notifications API — uses id (number) for all external identifiers.
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
  | 'broadcast'
  | 'system';

export interface Notification {
  id: number;
  notification_type: NotificationType;
  title: string;
  title_uz?: string;
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  message: string;
  message_uz?: string;
  message_uz_cyrl?: string;
  message_ru?: string;
  message_en?: string;
  original_locale?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  action_url?: string;
  from_user?: { id: number; full_name: string; avatar_url?: string } | null;
  listing?: { id: number; title: string } | null;
  metadata?: Record<string, unknown>;
}

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    try {
      const res = await apiClient.get('/notifications/');
      const data = res.data;
      // Backend returns { results: [...], count, page, page_size }
      if (Array.isArray(data)) return data;
      if (data?.results) return data.results;
      return [];
    } catch {
      return [];
    }
  },

  async getById(publicId: number): Promise<Notification | null> {
    try {
      const res = await apiClient.get<Notification>(`/notifications/${publicId}/`);
      return res.data;
    } catch {
      return null;
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
