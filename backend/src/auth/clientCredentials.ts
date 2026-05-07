import { cca } from '../config/msal';
import * as msal from '@azure/msal-node';

/**
 * MSAL Client Credentials Service
 * Obtains an application-only token for background/daemon tasks.
 */
export class ClientCredentialsService {
    static async getAppToken(): Promise<string | null> {
        const clientCredentialRequest: msal.ClientCredentialRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };

        try {
            const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
            return response?.accessToken || null;
        } catch (error) {
            console.error('❌ Client Credentials Token Failed:', error);
            return null;
        }
    }
}
