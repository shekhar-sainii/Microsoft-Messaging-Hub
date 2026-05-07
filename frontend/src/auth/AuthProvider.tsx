import React, { useEffect, useState } from 'react';
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        msalInstance.initialize().then(async () => {
            // CRITICAL: Handle the redirect response after loginRedirect.
            // Without this, MSAL never processes the auth code from the URL
            // and accounts[] stays empty — user appears not logged in.
            try {
                const result = await msalInstance.handleRedirectPromise();
                if (result?.account) {
                    // Set the active account from the redirect result
                    msalInstance.setActiveAccount(result.account);
                }
            } catch (err) {
                console.error('MSAL redirect handling failed:', err);
            }

            // Set active account if one exists in cache
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
                msalInstance.setActiveAccount(accounts[0]);
            }

            setIsInitialized(true);
        }).catch(err => {
            console.error("MSAL initialization failed:", err);
            setIsInitialized(true);
        });
    }, []);

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <MsalProvider instance={msalInstance}>
            {children}
        </MsalProvider>
    );
};
