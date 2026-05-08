import { apiClient } from '../apiClient';

export const AuthService = {
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  exchangeToken: async (msalToken: string) => {
    const response = await apiClient.post('/auth/msal-token', { msalToken });
    return response.data;
  }
};
