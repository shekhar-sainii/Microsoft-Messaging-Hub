import { baseApi } from '../baseApi';

export const webhooksApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getWebhooks: builder.query<any[], void>({
            query: () => '/subscriptions',
            providesTags: ['Webhooks'],
        }),
        createWebhook: builder.mutation<any, void>({
            query: () => ({ url: '/subscriptions', method: 'POST', body: {} }),
            invalidatesTags: ['Webhooks'],
        }),
        deleteWebhook: builder.mutation<any, string>({
            query: (id) => ({ url: `/subscriptions/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Webhooks'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetWebhooksQuery,
    useCreateWebhookMutation,
    useDeleteWebhookMutation,
} = webhooksApi;
