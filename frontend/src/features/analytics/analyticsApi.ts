import { baseApi } from '../../app/baseApi';

export interface AuditLog {
  _id: string;
  eventType: string;
  details: string;
  status: 'success' | 'failure';
  createdAt: string;
}

export interface SummaryStats {
    activeSubs: number;
    totalSent: number;
    totalFailed: number;
    totalMessages: number;
    uptime: string;
}

interface WrappedResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export const analyticsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSummaryStats: builder.query<SummaryStats, void>({
            query: () => '/analytics/summary',
            transformResponse: (response: WrappedResponse<SummaryStats>) => response.data,
            providesTags: ['Analytics'],
        }),
        getMessageStats: builder.query<any[], void>({
            query: () => '/analytics/messages',
            transformResponse: (response: WrappedResponse<any[]>) => response.data,
            providesTags: ['Analytics'],
        }),
        getFailureLogs: builder.query<any[], void>({
            query: () => '/analytics/failures',
            transformResponse: (response: WrappedResponse<any[]>) => response.data,
            providesTags: ['Analytics'],
        }),
        getAuditLogs: builder.query<AuditLog[], { limit?: number; skip?: number }>({
            query: ({ limit = 10, skip = 0 }) => `/analytics/audit?limit=${limit}&skip=${skip}`,
            transformResponse: (response: WrappedResponse<AuditLog[]>) => response.data,
            providesTags: ['Audit'],
        }),
        retryMessage: builder.mutation<any, string>({
            query: (messageId) => ({
                url: `/messages/retry/${messageId}`,
                method: 'POST',
            }),
            transformResponse: (response: WrappedResponse<any>) => response.data,
            invalidatesTags: ['Analytics', 'Messages'],
        }),
    }),
});

export const {
    useGetSummaryStatsQuery,
    useGetMessageStatsQuery,
    useGetFailureLogsQuery,
    useGetAuditLogsQuery,
    useRetryMessageMutation,
} = analyticsApi;
