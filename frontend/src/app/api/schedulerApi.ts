import { baseApi } from '../baseApi';

export const schedulerApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getScheduledMessages: builder.query<any[], void>({
            query: () => '/schedule',
            providesTags: ['Scheduler'],
        }),
        scheduleMessage: builder.mutation<any, any>({
            query: (payload) => ({ url: '/schedule', method: 'POST', body: payload }),
            invalidatesTags: ['Scheduler'],
        }),
        updateSchedule: builder.mutation<any, { id: string; payload: any }>({
            query: ({ id, payload }) => ({ url: `/schedule/${id}`, method: 'PATCH', body: payload }),
            invalidatesTags: ['Scheduler'],
        }),
        cancelSchedule: builder.mutation<any, { id: string; cancelSeries?: boolean }>({
            query: ({ id, cancelSeries = false }) => ({
                url: `/schedule/${id}?cancelSeries=${cancelSeries}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Scheduler'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetScheduledMessagesQuery,
    useScheduleMessageMutation,
    useUpdateScheduleMutation,
    useCancelScheduleMutation,
} = schedulerApi;
