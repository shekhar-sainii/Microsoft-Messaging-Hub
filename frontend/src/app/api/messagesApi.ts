import { baseApi } from '../baseApi';

export const messagesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        sendMessage: builder.mutation<any, any>({
            query: (payload) => ({ url: '/messages/send', method: 'POST', body: payload }),
            invalidatesTags: ['Messages'],
        }),
        replyMessage: builder.mutation<any, any>({
            query: (payload) => ({ url: '/messages/reply', method: 'POST', body: payload }),
        }),
        getSentHistory: builder.query<any[], { limit?: number; skip?: number }>({
            query: ({ limit = 50, skip = 0 } = {}) => `/messages/sent?limit=${limit}&skip=${skip}`,
            providesTags: ['Messages'],
        }),
        searchMessages: builder.query<any[], string>({
            query: (q) => `/messages/search?q=${encodeURIComponent(q)}`,
        }),
        getReplies: builder.query<any[], { teamId: string; channelId: string; messageId: string }>({
            query: ({ teamId, channelId, messageId }) =>
                `/messages/${messageId}/replies?teamId=${teamId}&channelId=${channelId}`,
        }),
        deleteMessage: builder.mutation<any, { teamId: string; channelId: string; graphMsgId: string }>({
            query: ({ teamId, channelId, graphMsgId }) => ({
                url: `/messages/${graphMsgId}?teamId=${teamId}&channelId=${channelId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Messages'],
        }),
        retryMessage: builder.mutation<any, string>({
            query: (messageId) => ({ url: `/messages/retry/${messageId}`, method: 'POST' }),
            invalidatesTags: ['Messages'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useSendMessageMutation,
    useReplyMessageMutation,
    useGetSentHistoryQuery,
    useSearchMessagesQuery,
    useGetRepliesQuery,
    useDeleteMessageMutation,
    useRetryMessageMutation,
} = messagesApi;
