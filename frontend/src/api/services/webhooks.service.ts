import { apiClient } from '../apiClient';

export interface WebhookSubscription {
  _id: string;
  subscriptionId: string;
  resource: string;
  changeType: string;
  expirationDateTime: string;
  clientState: string;
}

export const WebhooksService = {
  list: async () => {
    const response = await apiClient.get('/subscriptions');
    return response.data;
  },

  create: async () => {
    const response = await apiClient.post('/subscriptions');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/subscriptions/${id}`);
    return response.data;
  }
};
