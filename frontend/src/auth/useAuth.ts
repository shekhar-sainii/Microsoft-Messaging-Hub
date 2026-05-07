import { useMsal } from "@azure/msal-react";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { loginRequest } from "./msalConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const useAuth = () => {
    const { instance, accounts } = useMsal();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const syncedAccountId = useRef<string | null>(null);
    const isSyncing = useRef(false);

    const getCsrfToken = useCallback((): string | null => {
        const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }, []);

    const syncWithBackend = useCallback(async (accountId: string) => {
        if (isSyncing.current) return;
        isSyncing.current = true;

        try {
            // Get the account object
            const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
            if (!account) {
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
                isSyncing.current = false;
                return;
            }

            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account,
            });

            const backendResponse = await axios.post(
                `${API_BASE_URL}/auth/msal-token`,
                { idToken: response.idToken, accessToken: response.accessToken },
                { withCredentials: true }
            );

            setUser(backendResponse.data.user);
            setIsAuthenticated(true);
            syncedAccountId.current = accountId;
        } catch (error: any) {
            if (
                error?.errorCode === 'interaction_required' ||
                error?.errorCode === 'login_required' ||
                error?.errorCode === 'consent_required'
            ) {
                setIsAuthenticated(false);
                setUser(null);
            } else {
                console.error('Backend sync failed:', error?.message || error);
            }
        } finally {
            isSyncing.current = false;
            setIsLoading(false);
        }
    }, [instance]);

    // accounts array changes when MSAL processes the redirect
    useEffect(() => {
        const currentAccountId = accounts[0]?.homeAccountId ?? null;

        if (!currentAccountId) {
            // No account — not logged in
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            syncedAccountId.current = null;
            return;
        }

        // Only sync if this is a new/different account
        if (currentAccountId !== syncedAccountId.current) {
            syncWithBackend(currentAccountId);
        } else {
            setIsLoading(false);
        }
    }, [accounts, syncWithBackend]);

    const login = () => instance.loginRedirect(loginRequest);

    const logout = async () => {
        try {
            await axios.post(
                `${API_BASE_URL}/auth/logout`,
                {},
                {
                    withCredentials: true,
                    headers: { 'X-CSRF-Token': getCsrfToken() || '' },
                }
            );
        } catch (_) {
            // proceed regardless
        }
        syncedAccountId.current = null;
        instance.logoutRedirect();
    };

    const account = accounts[0] || null;
    return { isAuthenticated, isLoading, user, login, logout, account };
};
