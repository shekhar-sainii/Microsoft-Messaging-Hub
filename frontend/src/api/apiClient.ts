import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Axios API Client
 *
 * Security:
 * - withCredentials: true — sends the httpOnly session cookie automatically
 * - X-CSRF-Token header — reads the csrf-token cookie and echoes it back
 *   to satisfy the backend CSRF check on all mutating requests
 * - Session JWT is NEVER stored in localStorage
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Send httpOnly session cookie on every request
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper: read CSRF token from cookie
const getCsrfToken = (): string | null => {
    const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

// Request interceptor: attach CSRF token header
apiClient.interceptors.request.use(
    (config) => {
        const csrf = getCsrfToken();
        if (csrf) {
            config.headers['X-CSRF-Token'] = csrf;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (session expired)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect — just reject so the component can handle it gracefully
            // Redirecting causes infinite reload loops when OBO fails
            console.warn('API 401 — session may be expired');
        }
        return Promise.reject(error);
    }
);
