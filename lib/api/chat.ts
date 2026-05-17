/**
 * Chat API — conversations and messages.
 * Backend: apps/chat/urls.py
 */

import apiClient, { handleApiError } from './client';

export interface ChatUser {
  public_id: number;
  full_name: string;
  avatar_url?: string;
}

export interface ChatMessage {
  id: string;
  sender: ChatUser;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export interface Conversation {
  id: string;
  participants: ChatUser[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export const chatApi = {
  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await apiClient.get('/chat/conversations/');
      const data = res.data;
      return Array.isArray(data) ? data : data?.results ?? [];
    } catch {
      return [];
    }
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get(`/chat/conversations/${conversationId}/messages/`);
      const data = res.data;
      return Array.isArray(data) ? data : data?.results ?? [];
    } catch {
      return [];
    }
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage | null> {
    try {
      const res = await apiClient.post(`/chat/conversations/${conversationId}/messages/`, { content });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async startConversation(participantPublicId: number): Promise<Conversation | null> {
    try {
      const res = await apiClient.post('/chat/conversations/', { participant_id: participantPublicId });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },
};
