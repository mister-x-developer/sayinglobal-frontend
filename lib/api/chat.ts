/**
 * Chat API — conversations and messages.
 * All external IDs use public_id (9-digit int). UUID never exposed.
 */

import apiClient, { handleApiError } from './client';

export interface ChatUser {
  public_id: number;
  full_name: string;
  avatar_url?: string;
}

export interface ChatMessage {
  id: string;           // message public_id (as string for React keys)
  sender_id?: string;   // sender public_id as string
  sender?: ChatUser;
  content: string;
  created_at: string;
  is_read?: boolean;
  message_type?: string;
}

export interface Conversation {
  /** public_id — 9-digit numeric identifier. This is the ONLY external ID. */
  public_id: number;
  id: string; // kept as alias = String(public_id) so existing code keeps working
  participants: ChatUser[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

/** Normalize a conversation from the API — ensures both id and public_id are set. */
function normalizeConversation(raw: any): Conversation {
  const pid = raw.public_id ?? 0;
  return {
    ...raw,
    public_id: pid,
    id: String(pid), // alias so chat/page.tsx conv.id still works
  };
}

export const chatApi = {
  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await apiClient.get('/chat/conversations/');
      const data = res.data;
      const list: any[] = Array.isArray(data) ? data : data?.results ?? [];
      return list.map(normalizeConversation);
    } catch {
      return [];
    }
  },

  async getMessages(conversationId: string | number): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get(`/chat/conversations/${conversationId}/messages/`);
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.results) return data.results;
      return [];
    } catch {
      return [];
    }
  },

  async sendMessage(conversationId: string | number, content: string): Promise<ChatMessage | null> {
    try {
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
      const res = await apiClient.post('/chat/conversations/create/', {
        participant_id: participantPublicId,
      });
      return normalizeConversation(res.data);
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },
};
