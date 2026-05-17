'use client';
import apiClient from './client';

export interface UserSession {
  id: string;
  device_name: string;
  platform: 'web' | 'android' | 'ios';
  os_version: string;
  app_version: string;
  ip_address: string | null;
  last_activity: string;
  created_at: string;
  is_current: boolean;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  ip_address: string | null;
  device_info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const sessionsApi = {
  async list(refreshJti: string): Promise<UserSession[]> {
    const res = await apiClient.get<UserSession[]>('/users/sessions/', {
      headers: { 'X-Refresh-JTI': refreshJti },
    });
    return res.data;
  },

  async revoke(sessionId: string, refreshJti: string): Promise<void> {
    await apiClient.delete(`/users/sessions/${sessionId}/`, {
      headers: { 'X-Refresh-JTI': refreshJti },
    });
  },

  async revokeAllOthers(refreshJti: string): Promise<{ revoked_count: number }> {
    const res = await apiClient.delete<{ revoked_count: number }>('/users/sessions/all-others/', {
      headers: { 'X-Refresh-JTI': refreshJti },
    });
    return res.data;
  },

  async securityEvents(): Promise<SecurityEvent[]> {
    const res = await apiClient.get<SecurityEvent[]>('/users/security-events/');
    return res.data;
  },
};
