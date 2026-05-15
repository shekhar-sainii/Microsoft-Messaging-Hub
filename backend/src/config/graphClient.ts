import 'isomorphic-fetch';
import { 
    Client, 
    Middleware, 
    Context, 
    RetryHandler, 
    RetryHandlerOptions,
    TelemetryHandler,
    AuthenticationHandler,
    AuthenticationProvider,
    HTTPMessageHandler
} from '@microsoft/microsoft-graph-client';
import { logger } from '../utils/logger';

/**
 * Custom Observability Middleware
 * Logs request duration, status, and x-ms-request-id for every Graph call.
 */
class GraphLoggingMiddleware implements Middleware {
    public nextMiddleware!: Middleware;

    public async execute(context: Context): Promise<void> {
        const startTime = Date.now();
        try {
            await this.nextMiddleware.execute(context);
            const duration = Date.now() - startTime;
            const requestId = context.response?.headers?.get('x-ms-request-id');
            
            logger.info('graph:call', {
                method: context.options?.method || 'GET',
                url: context.request,
                status: context.response?.status,
                durationMs: duration,
                requestId
            });
        } catch (error: any) {
            const duration = Date.now() - startTime;
            logger.error('graph:error', {
                method: context.options?.method || 'GET',
                url: context.request,
                status: error.statusCode || error.status,
                durationMs: duration,
                error: error.message
            });
            throw error;
        }
    }

    public setNext(next: Middleware): void {
        this.nextMiddleware = next;
    }
}

/**
 * Graph Client Factory
 * Creates an authenticated Microsoft Graph client with a hardened middleware chain.
 * Chain: Logging -> Retry -> Telemetry -> Authentication
 */
export class GraphClientFactory {
    static create(accessToken: string): Client {
        // Configure Retry Policy (respects Retry-After header)
        const retryOptions = new RetryHandlerOptions(3, 3);
        
        // Define Auth Provider
        const authProvider: AuthenticationProvider = {
            getAccessToken: async () => accessToken
        };

        // Build Middleware Chain
        const loggingMiddleware = new GraphLoggingMiddleware();
        const retryHandler = new RetryHandler(retryOptions);
        const telemetryHandler = new TelemetryHandler();
        const authHandler = new AuthenticationHandler(authProvider);
        const httpHandler = new HTTPMessageHandler();

        // Connect chain: Logging -> Retry -> Telemetry -> Authentication -> HTTP
        loggingMiddleware.setNext(retryHandler);
        retryHandler.setNext(telemetryHandler);
        telemetryHandler.setNext(authHandler);
        authHandler.setNext(httpHandler);

        return Client.initWithMiddleware({
            middleware: loggingMiddleware
        });
    }
}

export const createGraphClient = (accessToken: string) => GraphClientFactory.create(accessToken);
