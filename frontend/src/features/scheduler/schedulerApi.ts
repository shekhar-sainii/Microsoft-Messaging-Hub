import { baseApi } from '../../app/baseApi';

interface WrappedResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface Schedule {
    _id: string;
    teamId: string;
    channelId: string;
    content: string;
    scheduledFor: string;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrenceEndDate?: string;
    createdAt: string;
}

export const schedulerApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getScheduledMessages: builder.query<Schedule[], void>({
            query: () => '/schedule',
            transformResponse: (response: WrappedResponse<Schedule[]>) => response.data || [],
            providesTags: ['Scheduler'],
        }),
        cancelSchedule: builder.mutation<any, { id: string; cancelSeries?: boolean }>({
            query: ({ id, cancelSeries = false }) => ({
                url: `/schedule/${id}?cancelSeries=${cancelSeries}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Scheduler'],
        }),
        createSchedule: builder.mutation<Schedule, Partial<Schedule>>({
            query: (payload) => ({
                url: '/schedule',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Scheduler'],
        }),
    }),
});

export const {
    useGetScheduledMessagesQuery,
    useCancelScheduleMutation,
    useCreateScheduleMutation,
} = schedulerApi;
