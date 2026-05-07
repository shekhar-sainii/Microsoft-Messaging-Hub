import * as msal from '@azure/msal-node';
import { config } from './index';
import { redis } from './redis';

/**
 * Redis-based MSAL Cache Plugin
 * Ensures tokens are persisted across restarts and shared between worker processes.
 */
const cachePlugin: msal.ICachePlugin = {
    beforeCacheAccess: async (cacheContext) => {
        const cacheData = await redis.get('msal_cache');
        if (cacheData) {
            cacheContext.tokenCache.deserialize(cacheData);
        }
    },
    afterCacheAccess: async (cacheContext) => {
        if (cacheContext.cacheHasChanged) {
            await redis.set('msal_cache', cacheContext.tokenCache.serialize());
        }
    }
};

const msalConfig: msal.Configuration = {
    auth: {
        clientId: config.msal.clientId || '',
        authority: config.msal.authority,
        clientSecret: config.msal.clientSecret,
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message) {
                console.log(`[MSAL] ${message}`);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Info,
        },
    },
};

export const cca = new msal.ConfidentialClientApplication(msalConfig);
