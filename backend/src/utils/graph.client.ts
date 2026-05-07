import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';

export interface GraphRequestOptions extends AxiosRequestConfig {
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Enhanced Microsoft Graph Client
 * Features:
 * - 429/503 automatic retry with exponential backoff
 * - Circuit Breaker (5 failures -> 60s cooldown)
 * - Observability: logs duration, status, and x-ms-request-id
 */
export class GraphClient {
  private axiosInstance: AxiosInstance;
  
  // Circuit Breaker State
  private static failureCount = 0;
  private static circuitOpenUntil = 0;
  private static readonly MAX_FAILURES = 5;
  private static readonly CIRCUIT_COOLDOWN_MS = 60000;

  constructor(private accessToken: string) {
    this.axiosInstance = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor: Check Circuit Breaker and inject timestamp
    this.axiosInstance.interceptors.request.use((config) => {
      if (Date.now() < GraphClient.circuitOpenUntil) {
        throw new Error('Circuit Breaker is OPEN. Graph API calls are temporarily throttled.');
      }
      (config as any).metadata = { startTime: Date.now() };
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { config, status, headers } = response;
        const duration = Date.now() - (config as any).metadata.startTime;
        const requestId = headers['x-ms-request-id'];

        // Reset failures on success
        GraphClient.failureCount = 0;

        logger.info('graph:call', {
          method: config.method?.toUpperCase(),
          url: config.url,
          status,
          durationMs: duration,
          requestId
        });

        return response;
      },
      async (error: any) => {
        const { config, response } = error;
        const originalRequest = config as GraphRequestOptions;

        // If no response (network error) or 5xx error, increment failure count
        if (!response || (response.status >= 500)) {
          GraphClient.failureCount++;
          if (GraphClient.failureCount >= GraphClient.MAX_FAILURES) {
            GraphClient.circuitOpenUntil = Date.now() + GraphClient.CIRCUIT_COOLDOWN_MS;
            logger.error('CIRCUIT BREAKER OPENED', { failures: GraphClient.failureCount });
          }
        }

        // Initialize retry count
        originalRequest.retryCount = originalRequest.retryCount || 0;
        originalRequest.maxRetries = originalRequest.maxRetries || 3;

        // Handle 429 (Too Many Requests) - Read Retry-After header
        if (response?.status === 429 && originalRequest.retryCount < originalRequest.maxRetries) {
          const retryAfter = parseInt(response.headers['retry-after'] || '1', 10);
          logger.warn(`Rate limited (429). Retrying after ${retryAfter} seconds...`, {
            requestId: response.headers['x-ms-request-id']
          });
          
          originalRequest.retryCount++;
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return this.axiosInstance(originalRequest);
        }

        // Handle 503/504 (Server Overloaded) - Exponential Backoff
        if ([503, 504].includes(response?.status) && originalRequest.retryCount < originalRequest.maxRetries) {
          originalRequest.retryCount++;
          const delay = Math.pow(2, originalRequest.retryCount) * 1000;
          logger.warn(`Server busy (${response.status}). Retrying in ${delay}ms...`, {
            requestId: response.headers['x-ms-request-id']
          });
          return new Promise((resolve) => setTimeout(() => resolve(this.axiosInstance(originalRequest)), delay));
        }

        const duration = (config as any).metadata ? (Date.now() - (config as any).metadata.startTime) : 0;
        logger.error('graph:error', {
          method: config.method?.toUpperCase(),
          url: config.url,
          status: response?.status,
          durationMs: duration,
          requestId: response?.headers['x-ms-request-id'],
          error: error.message
        });

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  async batch(requests: { id: string; method: string; url: string; body?: any; headers?: any }[]) {
    return this.post('/$batch', { requests });
  }
}
