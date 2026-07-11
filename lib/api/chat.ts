/**
 * Chat API — conversations and messages.
 * Backend: apps/chat/urls.py
 */

import apiClient, { handleApiError } from './client';

export interface ChatUser {
  id: number;
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
  id: number;
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

  async getMessages(conversationId: number | string): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get(`/chat/conversations/${conversationId}/messages/`);
      const data = res.data;
      // Backend returns { results: [...], count, page, page_size }
      if (Array.isArray(data)) return data;
      if (data?.results) return data.results;
      return [];
    } catch {
      return [];
    }
  },

  async sendMessage(conversationId: number | string, content: string): Promise<ChatMessage | null> {
    try {
      // Backend endpoint: POST /chat/messages/send/ with { conversation_id, content }
      const res = await apiClient.post('/chat/messages/send/', {
        conversation_id: conversationId,
        content,
      });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async startConversation(participantPublicId: number): Promise<Conversation | null> {
    try {
      // Backend endpoint: POST /chat/conversations/create/
      const res = await apiClient.post('/chat/conversations/create/', {
        participant_id: participantPublicId,
      });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },
};
