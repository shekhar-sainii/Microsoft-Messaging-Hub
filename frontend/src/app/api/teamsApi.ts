import { baseApi } from '../baseApi';

export const teamsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTeams: builder.query<any[], void>({
            query: () => '/teams',
            transformResponse: (res: any) => res.value || res || [],
            providesTags: ['Teams'],
        }),
        getChannels: builder.query<any[], string>({
            query: (teamId) => `/teams/${teamId}/channels`,
            transformResponse: (res: any) => res.value || res || [],
            providesTags: (_result, _err, teamId) => [{ type: 'Channels', id: teamId }],
        }),
        getTeamMembers: builder.query<any[], string>({
            query: (teamId) => `/teams/${teamId}/members`,
            transformResponse: (res: any) => res.value || res || [],
        }),
        getInitialData: builder.query<any, void>({
            query: () => '/teams/initial',
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetTeamsQuery,
    useGetChannelsQuery,
    useGetTeamMembersQuery,
    useGetInitialDataQuery,
} = teamsApi;
