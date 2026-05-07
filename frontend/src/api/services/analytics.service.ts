import { apiClient } from '../apiClient';

export interface AuditLog {
  _id: string;
  eventType: string;
  details: string;
  status: 'success' | 'failure';
  createdAt: string;
}

export const AnalyticsService = {
  getStats: async () => {
    const response = await apiClient.get('/analytics/messages');
    return response.data;
  },

  getFailures: async () => {
    const response = await apiClient.get('/analytics/failures');
    return response.data;
  },

  getAuditLogs: async (limit: number = 10, skip: number = 0) => {
    const response = await apiClient.get(`/analytics/audit?limit=${limit}&skip=${skip}`);
    return response.data;
  },

  async retryMessage(messageId: string) {
    const { data } = await apiClient.post(`/messages/retry/${messageId}`);
    return data;
  }
};
