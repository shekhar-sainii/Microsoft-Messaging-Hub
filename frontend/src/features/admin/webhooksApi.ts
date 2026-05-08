import { baseApi } from '../../app/baseApi';

interface WrappedResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface WebhookSubscription {
    _id: string;
    subscriptionId: string;
    resource: string;
    expirationDateTime: string;
    clientState: string;
    notificationUrl: string;
}

export const webhooksApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getWebhooks: builder.query<WebhookSubscription[], void>({
            query: () => '/subscriptions',
            transformResponse: (response: WrappedResponse<WebhookSubscription[]>) => response.data || [],
            providesTags: ['Webhooks'],
        }),
        createWebhook: builder.mutation<WebhookSubscription, void>({
            query: () => ({
                url: '/subscriptions/subscribe',
                method: 'POST',
            }),
            transformResponse: (response: WrappedResponse<WebhookSubscription>) => response.data,
            invalidatesTags: ['Webhooks'],
        }),
        deleteWebhook: builder.mutation<any, string>({
            query: (subscriptionId) => ({
                url: `/subscriptions/${subscriptionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Webhooks'],
        }),
    }),
});

export const {
    useGetWebhooksQuery,
    useCreateWebhookMutation,
    useDeleteWebhookMutation,
} = webhooksApi;
