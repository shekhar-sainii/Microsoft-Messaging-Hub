import { useMsal, useAccount } from "@azure/msal-react";
import { useCallback } from "react";
import { loginRequest } from "../auth/msalConfig";

/**
 * useGraphToken Hook
 * Provides a helper to silently acquire a fresh Graph access token.
 * Used when the frontend needs to call Graph-adjacent operations
 * or when the backend signals token expiry via auth:token_expiring.
 *
 * Note: All actual Graph calls go through the backend — this hook
 * is used to refresh the token and re-sync with the backend session.
 */
export const useGraphToken = () => {
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    /**
     * Silently acquires a fresh access token.
     * Falls back to interactive redirect if silent acquisition fails.
     */
    const getToken = useCallback(async (): Promise<string | null> => {
        if (!account) return null;

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account,
            });
            return response.accessToken;
        } catch (error: any) {
            if (
                error?.errorCode === 'interaction_required' ||
                error?.errorCode === 'login_required' ||
                error?.errorCode === 'consent_required'
            ) {
                // Trigger interactive login
                await instance.acquireTokenRedirect({ ...loginRequest, account });
            }
            return null;
        }
    }, [instance, account]);

    /**
     * Silently refreshes the backend session by re-exchanging the token.
     * Called when the server emits auth:token_expiring via Socket.IO.
     */
    const refreshBackendSession = useCallback(async (): Promise<boolean> => {
        if (!account) return false;

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account,
                forceRefresh: true, // Force a fresh token
            });

            const { apiClient } = await import('../api/apiClient');
            await apiClient.post('/auth/msal-token', {
                idToken: response.idToken,
                accessToken: response.accessToken,
            });

            return true;
        } catch (error) {
            console.error('Failed to refresh backend session:', error);
            return false;
        }
    }, [instance, account]);

    return { getToken, refreshBackendSession };
};
