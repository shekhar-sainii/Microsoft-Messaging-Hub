import { baseApi } from '../baseApi';

export const analyticsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMessageStats: builder.query<any[], void>({
            query: () => '/analytics/messages',
            providesTags: ['Analytics'],
        }),
        getFailureLogs: builder.query<any[], void>({
            query: () => '/analytics/failures',
            providesTags: ['Analytics'],
        }),
        getAuditLogs: builder.query<any[], { limit?: number; skip?: number }>({
            query: ({ limit = 10, skip = 0 } = {}) => `/analytics/audit?limit=${limit}&skip=${skip}`,
            providesTags: ['Audit'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetMessageStatsQuery,
    useGetFailureLogsQuery,
    useGetAuditLogsQuery,
} = analyticsApi;
