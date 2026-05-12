import { apiClient } from '../apiClient';

export interface AuditLog {
  _id: string;
  eventType: string;
  details: string;
  status: 'success' | 'failure';
  createdAt: string;
}

export const AnalyticsService = {
  getSummary: async () => {
    const response = await apiClient.get('/analytics/summary');
    return response.data.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/analytics/messages');
    return response.data.data;
  },

  getFailures: async () => {
    const response = await apiClient.get('/analytics/failures');
    return response.data.data;
  },

  getAuditLogs: async (limit: number = 10, skip: number = 0) => {
    const response = await apiClient.get(`/analytics/audit?limit=${limit}&skip=${skip}`);
    return response.data.data || [];
  },

  async retryMessage(messageId: string) {
    const response = await apiClient.post(`/messages/retry/${messageId}`);
    return response.data.data;
  }
};
