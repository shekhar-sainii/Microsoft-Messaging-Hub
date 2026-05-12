import { baseApi } from '../baseApi';

export interface User {
    _id: string;
    microsoftId: string;
    displayName: string;
    email: string;
    tenantId: string;
    role: 'admin' | 'manager' | 'member';
    createdAt: string;
    updatedAt: string;
}

export const usersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<{ success: boolean; data: User[] }, void>({
            query: () => '/users',
            providesTags: ['Users'],
        }),
        updateUserRole: builder.mutation<{ success: boolean; data: User }, { id: string; role: string }>({
            query: ({ id, role }) => ({
                url: `/users/${id}/role`,
                method: 'PATCH',
                body: { role },
            }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const { useGetUsersQuery, useUpdateUserRoleMutation } = usersApi;
