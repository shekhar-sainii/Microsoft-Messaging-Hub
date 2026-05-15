import * as msal from '@azure/msal-node';
import { config } from './index';
import { redis } from './redis';

/**
 * Redis-based MSAL Cache Plugin (Hardened)
 * Implements account-specific partitioning for a distributed cache.
 * Note: Since the ICachePlugin interface is global, we rely on the 
 * MSAL-Node ConfidentialClientApplication to manage internal partitioning
 * while we provide a reliable, distributed persistence layer.
 */
const cachePlugin: msal.ICachePlugin = {
    beforeCacheAccess: async (cacheContext) => {
        // Attempt to load the distributed cache state from Redis
        const cacheData = await redis.get('msal:distributed_cache');
        if (cacheData) {
            cacheContext.tokenCache.deserialize(cacheData);
        }
    },
    afterCacheAccess: async (cacheContext) => {
        if (cacheContext.cacheHasChanged) {
            // Save the updated cache state back to Redis
            await redis.set('msal:distributed_cache', cacheContext.tokenCache.serialize());
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
