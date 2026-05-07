import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';

/**
 * Socket.IO Server Manager
 * Implements the full event contract from the task specification.
 *
 * Client → Server:
 *   authenticate        — join private user room
 *   subscribe:channel   — join channel room for live replies
 *   unsubscribe:channel — leave channel room
 *   join_channel        — legacy alias for subscribe:channel
 *   leave_channel       — legacy alias for unsubscribe:channel
 *
 * Server → User (emitToUser):
 *   message:sent, message:failed, schedule:sent, schedule:failed,
 *   subscription:renewed, subscription:expired, ratelimit:warning,
 *   auth:token_expiring
 *
 * Server → Room (emitToChannel):
 *   message:reply, message:updated, message:new
 */
export class SocketServer {
    private io: SocketIOServer | null = null;

    initialize(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.FRONTEND_URL
                    ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:80']
                    : ['http://localhost:5173', 'http://localhost:80'],
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingTimeout: 60000,
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info(`New Client Connected: ${socket.id}`);

            // User authenticates and joins their private room
            socket.on('authenticate', (userId: string) => {
                if (!userId) return;
                socket.join(`user_${userId}`);
                logger.info(`User ${userId} joined private room`);
            });

            // Contract event: subscribe:channel — join channel room for live replies
            socket.on('subscribe:channel', ({ teamId, channelId }: { teamId: string; channelId: string }) => {
                if (!channelId) return;
                socket.join(`channel_${channelId}`);
                logger.info(`Socket ${socket.id} subscribed to channel ${channelId} (team ${teamId})`);
            });

            // Contract event: unsubscribe:channel — leave channel room
            socket.on('unsubscribe:channel', ({ teamId, channelId }: { teamId: string; channelId: string }) => {
                if (!channelId) return;
                socket.leave(`channel_${channelId}`);
                logger.info(`Socket ${socket.id} unsubscribed from channel ${channelId}`);
            });

            // Legacy aliases (kept for backward compatibility)
            socket.on('join_channel', (channelId: string) => {
                socket.join(`channel_${channelId}`);
            });

            socket.on('leave_channel', (channelId: string) => {
                socket.leave(`channel_${channelId}`);
            });

            socket.on('disconnect', (reason) => {
                logger.info(`Client Disconnected (${reason}): ${socket.id}`);
            });
        });

        return this.io;
    }

    /** Emit to all sockets in a channel room */
    emitToChannel(channelId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(`channel_${channelId}`).emit(event, data);
        }
    }

    /** Emit to a specific user's private room */
    emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(`user_${userId}`).emit(event, data);
        }
    }

    /**
     * Notify a user that their token is expiring soon.
     * The frontend will silently refresh via MSAL.
     */
    notifyTokenExpiring(userId: string, expiresInSeconds: number) {
        this.emitToUser(userId, 'auth:token_expiring', { expiresIn: expiresInSeconds });
    }

    getIO() {
        return this.io;
    }
}

export const socketServer = new SocketServer();
