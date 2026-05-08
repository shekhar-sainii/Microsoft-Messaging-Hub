import { apiClient } from '../apiClient';

export const TeamsService = {
  getTeams: async () => {
    const response = await apiClient.get('/teams');
    return response.data.value || response.data;
  },

  getTeamDetails: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}`);
    return response.data;
  },

  getChannels: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/channels`);
    return response.data.value || response.data;
  },

  getChannelDetails: async (teamId: string, chId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/channels/${chId}`);
    return response.data;
  },

  getTeamMembers: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/members`);
    return response.data.value || response.data;
  },

  getTeamPhoto: async (teamId: string) => {
    const response = await apiClient.get(`/teams/${teamId}/photo`);
    return response.data;
  }
};
