import { baseApi } from '../../app/baseApi';

interface WrappedResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface SendMessagePayload {
    teamId: string;
    channelId: string;
    content: string;
    mentions?: any[];
    isAdaptiveCard?: boolean;
    cardJson?: any;
    subject?: string;
    importance?: 'normal' | 'high' | 'urgent';
    attachments?: any[];
}

export interface ReplyPayload {
    teamId: string;
    channelId: string;
    messageId: string;
    content: string;
}

export const messagesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMessagesHistory: builder.query<any[], { limit?: number; skip?: number }>({
            query: ({ limit = 50, skip = 0 }) => `/messages/history?limit=${limit}&skip=${skip}`,
            transformResponse: (response: WrappedResponse<any[]>) => response.data,
            providesTags: ['Messages'],
        }),
        searchMessages: builder.query<any[], string>({
            query: (query) => `/messages/search?query=${query}`,
            transformResponse: (response: WrappedResponse<any[]>) => response.data,
        }),
        sendMessage: builder.mutation<any, SendMessagePayload>({
            query: (payload) => ({
                url: '/messages/send',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Messages', 'Analytics'],
        }),
        replyMessage: builder.mutation<any, ReplyPayload>({
            query: (payload) => ({
                url: '/messages/reply',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Messages'],
        }),
        deleteMessage: builder.mutation<any, { teamId: string, channelId: string, msgId: string }>({
            query: ({ teamId, channelId, msgId }) => ({
                url: `/messages/${teamId}/${channelId}/${msgId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Messages'],
        }),
        getMessageReplies: builder.query<any[], { teamId: string, channelId: string, messageId: string }>({
            query: ({ teamId, channelId, messageId }) => `/messages/${teamId}/${channelId}/${messageId}/replies`,
            transformResponse: (response: WrappedResponse<any[]>) => response.data,
        }),
    }),
});

export const {
    useGetMessagesHistoryQuery,
    useSearchMessagesQuery,
    useSendMessageMutation,
    useReplyMessageMutation,
    useDeleteMessageMutation,
    useGetMessageRepliesQuery,
} = messagesApi;
