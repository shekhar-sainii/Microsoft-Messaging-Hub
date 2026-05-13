import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * RTK Query base API
 * - withCredentials: true sends the httpOnly session cookie automatically
 * - X-CSRF-Token header is read from the csrf-token cookie and echoed back
 */
const getCsrfToken = (): string => {
    const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
};

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL,
        credentials: 'include',
        prepareHeaders: (headers) => {
            const csrf = getCsrfToken();
            if (csrf) headers.set('X-CSRF-Token', csrf);
            
            // Core fallback wrapper: attach the dynamic JWT signature if SameSite cookies are dropped
            const sessionToken = localStorage.getItem('session_token');
            if (sessionToken) {
                headers.set('Authorization', `Bearer ${sessionToken}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Teams', 'Channels', 'Messages', 'Templates', 'Scheduler', 'Webhooks', 'Analytics', 'Audit', 'Users'],
    endpoints: () => ({}),
});
