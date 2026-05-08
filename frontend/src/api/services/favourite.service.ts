import { apiClient } from '../apiClient';

export interface FavouriteChannel {
  teamId: string;
  channelId: string;
  teamName?: string;
  channelName?: string;
}

export const FavouriteService = {
  getFavourites: async (): Promise<FavouriteChannel[]> => {
    const response = await apiClient.get('/favourites');
    return response.data;
  },

  addFavourite: async (data: FavouriteChannel): Promise<any> => {
    const response = await apiClient.post('/favourites', data);
    return response.data;
  },

  removeFavourite: async (channelId: string): Promise<any> => {
    const response = await apiClient.delete(`/favourites/${channelId}`);
    return response.data;
  }
};
