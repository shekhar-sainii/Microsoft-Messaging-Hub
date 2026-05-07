import * as msal from '@azure/msal-node';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { redis } from '../config/redis';

/**
 * MSAL On-Behalf-Of (OBO) Service
 * Exchanges a user's access token for a Graph-scoped token.
 *
 * Personal Microsoft accounts (MSA) use tenant 9188040d-... and require
 * the authority to be set to that specific tenant for OBO to work.
 * Work/school accounts use their own tenant ID.
 */
export class MsalOboService {
    /**
     * Creates a per-tenant CCA instance for OBO.
     * Personal accounts need authority = their MSA tenant, not 'common'.
     */
    private static getCca(tenantId: string): msal.ConfidentialClientApplication {
        const cachePlugin: msal.ICachePlugin = {
            beforeCacheAccess: async (cacheContext) => {
                const cacheData = await redis.get(`msal_cache:${tenantId}`);
                if (cacheData) cacheContext.tokenCache.deserialize(cacheData);
            },
            afterCacheAccess: async (cacheContext) => {
                if (cacheContext.cacheHasChanged) {
                    await redis.set(`msal_cache:${tenantId}`, cacheContext.tokenCache.serialize());
                }
            },
        };

        return new msal.ConfidentialClientApplication({
            auth: {
                clientId: config.msal.clientId || '',
                authority: `https://login.microsoftonline.com/${tenantId}`,
                clientSecret: config.msal.clientSecret,
            },
            cache: { cachePlugin },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message) {
                        if (loglevel === msal.LogLevel.Error) console.error(`[MSAL] ${message}`);
                    },
                    piiLoggingEnabled: false,
                    logLevel: msal.LogLevel.Error,
                },
            },
        });
    }

    static async getGraphToken(userToken: string): Promise<string | null> {
        try {
            // Decode token to get the tenant ID
            const decoded: any = jwt.decode(userToken);
            const tenantId = decoded?.tid || 'common';

            const cca = this.getCca(tenantId);

            const oboRequest: msal.OnBehalfOfRequest = {
                oboAssertion: userToken,
                scopes: ['https://graph.microsoft.com/.default'],
            };

            const response = await cca.acquireTokenOnBehalfOf(oboRequest);
            return response?.accessToken || null;
        } catch (error) {
            console.error('❌ OBO Token Exchange Failed:', error);
            return null;
        }
    }
}
