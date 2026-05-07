import { apiClient } from '../apiClient';

export interface MessageTemplate {
  _id?: string;
  name: string;
  content: string; // HTML or Adaptive Card JSON
  description?: string;
  type: 'html' | 'adaptive_card';
  createdAt?: string;
  updatedAt?: string;
}

export const TemplatesService = {
  list: async () => {
    const response = await apiClient.get('/templates');
    return response.data;
  },

  save: async (template: Partial<MessageTemplate>) => {
    const response = await apiClient.post('/templates', template);
    return response.data;
  },

  update: async (id: string, template: Partial<MessageTemplate>) => {
    const response = await apiClient.patch(`/templates/${id}`, template);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/templates/${id}`);
    return response.data;
  }
};
