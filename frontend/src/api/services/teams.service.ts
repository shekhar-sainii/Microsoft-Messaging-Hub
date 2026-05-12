import { apiClient } from '../apiClient';

export const TeamsService = {
  getTeams: async () => {
    const response = await apiClient.get('/teams');
    const data = response.data.data;
    return Array.isArray(data) ? data : data?.value || [];
  },

  getTeamDetails: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}`);
    return response.data.data;
  },

  getChannels: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/channels`);
    const data = response.data.data;
    return Array.isArray(data) ? data : data?.value || [];
  },

  getChannelDetails: async (teamId: string, chId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/channels/${chId}`);
    return response.data.data;
  },

  getTeamMembers: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/members`);
    const data = response.data.data;
    return Array.isArray(data) ? data : data?.value || [];
  },

  getTeamPhoto: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/photo`);
    return response.data.data;
  }
};
