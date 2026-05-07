import { apiClient } from '../apiClient';

export interface Mention {
  id: number;
  mentionText: string;
  mentioned: {
    user?: {
      displayName: string;
      id: string;
    };
    conversation?: {
      id: string;
      displayName: string;
      conversationIdentityType: string;
    };
  };
}

export interface SendMessagePayload {
  teamId: string;
  channelId: string;
  content?: string;
  mentions?: Mention[];
  isAdaptiveCard?: boolean;
  cardJson?: any;
}

export interface ReplyPayload {
  teamId: string;
  channelId: string;
  messageId: string;
  content: string;
}

export const MessagesService = {
  send: async (payload: SendMessagePayload) => {
    const response = await apiClient.post('/messages/send', payload);
    return response.data;
  },

  reply: async (payload: ReplyPayload) => {
    const response = await apiClient.post('/messages/reply', payload);
    return response.data;
  },

  getSentHistory: async (limit: number = 50, skip: number = 0) => {
    const response = await apiClient.get(`/messages/sent?limit=${limit}&skip=${skip}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await apiClient.get(`/messages/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getReplies: async (teamId: string, channelId: string, messageId: string) => {
    const response = await apiClient.get(`/messages/${messageId}/replies?teamId=${teamId}&channelId=${channelId}`);
    return response.data.value || response.data;
  },

  delete: async (teamId: string, channelId: string, graphMsgId: string) => {
    const response = await apiClient.delete(`/messages/${graphMsgId}?teamId=${teamId}&channelId=${channelId}`);
    return response.data;
  }
};
