import { baseApi } from '../../app/baseApi';

interface WrappedResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export const teamsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getInitialData: builder.query<any, void>({
            query: () => '/teams/initial',
            transformResponse: (response: WrappedResponse<any>) => response.data,
        }),
        getTeams: builder.query<any[], void>({
            query: () => '/teams',
            transformResponse: (response: WrappedResponse<any>) => {
                const data = response.data;
                return Array.isArray(data) ? data : (data as any).value || [];
            },
            providesTags: ['Teams'],
        }),
        getChannels: builder.query<any[], string>({
            query: (teamId) => `/teams/${teamId}/channels`,
            transformResponse: (response: WrappedResponse<any>) => {
                const data = response.data;
                return Array.isArray(data) ? data : (data as any).value || [];
            },
            providesTags: (result, error, teamId) => [{ type: 'Channels', id: teamId }],
        }),
        getTeamPhoto: builder.query<string, string>({
            query: (teamId) => `/teams/${teamId}/photo`,
            transformResponse: (response: WrappedResponse<any>) => response.data?.photo || '',
        }),
        getTeamMembers: builder.query<any[], string>({
            query: (teamId) => `/teams/${teamId}/members`,
            transformResponse: (response: WrappedResponse<any>) => {
                const data = response.data;
                return Array.isArray(data) ? data : (data as any).value || [];
            },
        }),
    }),
});

export const {
    useGetInitialDataQuery,
    useGetTeamsQuery,
    useGetChannelsQuery,
    useGetTeamPhotoQuery,
    useGetTeamMembersQuery,
} = teamsApi;
