import { baseApi } from '../../app/baseApi';

export interface FavouriteChannel {
  teamId: string;
  channelId: string;
  teamName?: string;
  channelName?: string;
}

interface WrappedResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export const favouritesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getFavourites: builder.query<FavouriteChannel[], void>({
            query: () => '/favourites',
            transformResponse: (response: WrappedResponse<FavouriteChannel[]>) => response.data,
            providesTags: ['Audit'], // Using Audit tag as a placeholder or we can add Favourites to tagTypes
        }),
        addFavourite: builder.mutation<any, FavouriteChannel>({
            query: (data) => ({
                url: '/favourites',
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Audit'],
        }),
        removeFavourite: builder.mutation<any, string>({
            query: (channelId) => ({
                url: `/favourites/${channelId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Audit'],
        }),
    }),
});

export const {
    useGetFavouritesQuery,
    useAddFavouriteMutation,
    useRemoveFavouriteMutation,
} = favouritesApi;
