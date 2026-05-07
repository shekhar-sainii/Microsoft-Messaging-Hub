/**
 * Microsoft Graph Batching Utility
 * Allows combining multiple Graph API requests into a single HTTP call.
 * Reduces network overhead and helps stay within API rate limits.
 */
export interface BatchRequest {
    id: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    url: string;
    body?: any;
    headers?: Record<string, string>;
}

export class GraphBatchBuilder {
    private requests: BatchRequest[] = [];

    add(request: Omit<BatchRequest, 'id'>): string {
        const id = Math.random().toString(36).substring(7);
        this.requests.push({ ...request, id });
        return id;
    }

    build() {
        return {
            requests: this.requests
        };
    }

    clear() {
        this.requests = [];
    }

    get count() {
        return this.requests.length;
    }
}
