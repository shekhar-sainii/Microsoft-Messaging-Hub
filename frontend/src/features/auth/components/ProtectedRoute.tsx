import React from 'react';
import { useAuth } from '../../../auth/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * ProtectedRoute
 * Renders children only when the user is authenticated.
 * Shows a loading spinner during auth check, and the fallback (or null) when unauthenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback = null }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
