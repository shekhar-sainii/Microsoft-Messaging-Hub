import { Client } from '@microsoft/microsoft-graph-client';

export interface BatchRequest {
    id: string;
    method: string;
    url: string;
    body?: any;
    headers?: Record<string, string>;
}

export interface BatchResponse {
    id: string;
    status: number;
    body: any;
    headers?: Record<string, string>;
}

/**
 * Helper to execute multiple Graph requests in a single HTTP call.
 * Microsoft Graph limits batches to 20 requests.
 */
export class GraphBatch {
    static async execute(client: Client, requests: BatchRequest[]): Promise<BatchResponse[]> {
        if (requests.length === 0) return [];
        if (requests.length > 20) {
            throw new Error('Graph $batch exceeds maximum of 20 requests');
        }

        const payload = { requests };
        const response = await client.api('/$batch').post(payload);
        
        return response.responses;
    }

    /**
     * Helper to map batch responses back to a predictable object.
     */
    static mapResponses<T = any>(responses: BatchResponse[]): Record<string, T> {
        const map: Record<string, T> = {};
        for (const res of responses) {
            map[res.id] = res.body;
        }
        return map;
    }
}
