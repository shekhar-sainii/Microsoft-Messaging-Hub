import { baseApi } from '../../app/baseApi';

interface WrappedResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface Template {
    _id: string;
    name: string;
    description: string;
    type: 'adaptive_card' | 'html';
    content: any;
    userId: string;
    createdAt?: string;
    updatedAt?: string;
}

export const templatesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTemplates: builder.query<Template[], void>({
            query: () => '/templates',
            transformResponse: (response: WrappedResponse<Template[]>) => response.data || [],
            providesTags: ['Templates'],
        }),
        getTemplateById: builder.query<Template, string>({
            query: (id) => `/templates/${id}`,
            transformResponse: (response: WrappedResponse<Template>) => response.data,
            providesTags: (result, error, id) => [{ type: 'Templates', id }],
        }),
        createTemplate: builder.mutation<Template, Partial<Template>>({
            query: (template) => ({
                url: '/templates',
                method: 'POST',
                body: template,
            }),
            invalidatesTags: ['Templates'],
        }),
        updateTemplate: builder.mutation<Template, { id: string; template: Partial<Template> }>({
            query: ({ id, template }) => ({
                url: `/templates/${id}`,
                method: 'PATCH',
                body: template,
            }),
            invalidatesTags: (result, error, { id }) => ['Templates', { type: 'Templates', id }],
        }),
        deleteTemplate: builder.mutation<void, string>({
            query: (id) => ({
                url: `/templates/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Templates'],
        }),
    }),
});

export const {
    useGetTemplatesQuery,
    useGetTemplateByIdQuery,
    useCreateTemplateMutation,
    useUpdateTemplateMutation,
    useDeleteTemplateMutation,
} = templatesApi;
