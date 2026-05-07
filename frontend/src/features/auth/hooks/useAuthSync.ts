import { useMsal, useAccount } from "@azure/msal-react";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const useAuthSync = () => {
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const syncWithBackend = async () => {
            if (account) {
                try {
                    const response = await instance.acquireTokenSilent({
                        scopes: ["User.Read"],
                        account: account
                    });

                    const idToken = response.idToken;
                    const accessToken = response.accessToken;

                    // Send to backend
                    const backendResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                        idToken,
                        accessToken
                    });

                    setUser(backendResponse.data.user);
                    setIsAuthenticated(true);
                    // Store local session token if needed
                    localStorage.setItem("session_token", backendResponse.data.sessionToken);
                } catch (error) {
                    console.error("Backend sync failed:", error);
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
                localStorage.removeItem("session_token");
            }
            setIsLoading(false);
        };

        syncWithBackend();
    }, [account, instance]);

    return { isAuthenticated, isLoading, user };
};
