import 'isomorphic-fetch';
import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Graph Client Factory
 * Creates an authenticated Microsoft Graph client using the provided access token.
 * Includes middleware for retry handling and performance.
 */
export class GraphClientFactory {
    static create(accessToken: string): Client {
        return Client.init({
            authProvider: (done) => {
                done(null, accessToken);
            }
        });
    }
}

export const createGraphClient = (accessToken: string) => GraphClientFactory.create(accessToken);
