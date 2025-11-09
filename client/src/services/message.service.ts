import api from '@/lib/api';
import { Message, PaginatedResponse } from '@/types';

export const messageService = {
  async send(data: {
    to?: string;
    groupId?: string;
    body: string;
    type?: string;
    attachments?: string[];
  }) {
    const response = await api.post('/messages', data);
    return response.data.data as Message;
  },

  async getMessages(params: { chatId?: string; groupId?: string; page?: number; limit?: number }) {
    const response = await api.get<PaginatedResponse<Message>>('/messages', { params });
    return response.data;
  },

  async markAsRead(messageId: string) {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  async delete(messageId: string) {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  async getConversations() {
    const response = await api.get('/messages/conversations');
    return response.data.conversations;
  }
};
