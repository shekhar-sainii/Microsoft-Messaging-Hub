import { baseApi } from '../baseApi';

export const templatesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTemplates: builder.query<any[], void>({
            query: () => '/templates',
            providesTags: ['Templates'],
        }),
        saveTemplate: builder.mutation<any, any>({
            query: (payload) => ({ url: '/templates', method: 'POST', body: payload }),
            invalidatesTags: ['Templates'],
        }),
        updateTemplate: builder.mutation<any, { id: string; payload: any }>({
            query: ({ id, payload }) => ({ url: `/templates/${id}`, method: 'PATCH', body: payload }),
            invalidatesTags: ['Templates'],
        }),
        deleteTemplate: builder.mutation<any, string>({
            query: (id) => ({ url: `/templates/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Templates'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetTemplatesQuery,
    useSaveTemplateMutation,
    useUpdateTemplateMutation,
    useDeleteTemplateMutation,
} = templatesApi;
