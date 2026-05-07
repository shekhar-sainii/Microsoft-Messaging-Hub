import { apiClient } from '../apiClient';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface ScheduledMessage {
  _id: string;
  teamId: string;
  channelId: string;
  content: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error?: string;
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  parentJobId?: string;
  createdAt: string;
}

export interface SchedulePayload {
  teamId: string;
  channelId: string;
  content: string;
  scheduledFor: string; // ISO string
  recurrence?: RecurrenceType;
  recurrenceEndDate?: string; // ISO string
}

export const SchedulerService = {
  list: async () => {
    const response = await apiClient.get('/schedule');
    return response.data;
  },

  schedule: async (payload: SchedulePayload) => {
    const response = await apiClient.post('/schedule', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<SchedulePayload>) => {
    const response = await apiClient.patch(`/schedule/${id}`, payload);
    return response.data;
  },

  cancel: async (id: string, cancelSeries = false) => {
    const response = await apiClient.delete(`/schedule/${id}?cancelSeries=${cancelSeries}`);
    return response.data;
  }
};
