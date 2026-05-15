import { LogLevel } from "@azure/msal-browser";

export const msalConfig: any = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage", // Required by assessment security rules
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: any, message: any, containsPii: any) => {
                if (containsPii) return;
                switch (level) {
                    case LogLevel.Error: console.error(message); break;
                    case LogLevel.Info: console.info(message); break;
                    case LogLevel.Warning: console.warn(message); break;
                    default: break;
                }
            },
        },
    },
};

export const loginRequest = {
    scopes: [
        "User.Read",
        "Team.ReadBasic.All",
        "Channel.ReadBasic.All",
        "ChannelMessage.Send",
        "openid",
        "profile",
        "offline_access"
    ],
};

/**
 * Admin Consent Request
 * Used for multi-tenant onboarding to grant application permissions at the tenant level.
 */
export const adminLoginRequest = {
    ...loginRequest,
    prompt: 'admin_consent',
    scopes: [
        ...loginRequest.scopes,
        "ChannelMessage.Read.All",
        "Subscription.Read.All"
    ]
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
