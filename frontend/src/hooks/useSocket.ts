import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useGraphToken } from './useGraphToken';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

/**
 * useSocket Hook
 * Manages the Socket.IO connection and implements the full event contract.
 *
 * Client → Server events:
 *   subscribe:channel   — join a channel room for live replies
 *   unsubscribe:channel — leave a channel room
 *
 * Server → Client events (all contract events from spec):
 *   message:sent        — confirm message posted
 *   message:failed      — delivery failure
 *   message:reply       — live reply received from Teams webhook
 *   message:updated     — message edited in Teams
 *   schedule:sent       — scheduled message delivered
 *   schedule:failed     — scheduled message failed all retries
 *   subscription:renewed — Graph subscription auto-renewed
 *   subscription:expired — subscription renewal failed
 *   ratelimit:warning   — approaching Graph rate limit
 *   auth:token_expiring — prompt silent token refresh
 */
export const useSocket = (userId?: string) => {
    const socketRef = useRef<Socket | null>(null);
    const { refreshBackendSession } = useGraphToken();

    useEffect(() => {
        if (!userId) return;

        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true, // Send session cookie
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Connected to Real-time Hub');
            // Authenticate with the server to join the private user room
            socket.emit('authenticate', userId);
        });

        socket.on('disconnect', (reason) => {
            console.warn('Socket disconnected:', reason);
        });

        // ── Server → User events ──────────────────────────────────────────────

        socket.on('message:sent', (_data: { messageId: string; graphMsgId: string; sentAt: string }) => {
            toast.success('Message delivered to Teams');
        });

        socket.on('message:failed', (data: { messageId: string; error: string; retryAt?: string }) => {
            toast.error(`Message failed: ${data.error || 'Unknown error'}`);
        });

        socket.on('schedule:sent', (_data: { scheduledMsgId: string; sentAt: string }) => {
            toast.success('Scheduled message delivered!');
        });

        socket.on('schedule:failed', (data: { scheduledMsgId: string; error: string }) => {
            toast.error(`Scheduled delivery failed: ${data.error}`);
        });

        socket.on('subscription:renewed', (_data: { subscriptionId: string; newExpiry: string }) => {
            console.info('Graph subscription renewed');
        });

        socket.on('subscription:expired', (_data: { subscriptionId: string }) => {
            toast.error('Teams subscription expired. Real-time updates paused.', {
                duration: 6000,
                icon: '⚠️',
            });
        });

        socket.on('ratelimit:warning', (data: { endpoint: string; retryAfter: number }) => {
            toast(`Graph API rate limit approaching (${data.endpoint}). Throttling applied.`, {
                icon: '⏳',
            });
        });

        // Prompt silent token refresh when backend signals expiry
        socket.on('auth:token_expiring', async (_data: { expiresIn: number }) => {
            console.info('Token expiring — refreshing silently...');
            const ok = await refreshBackendSession();
            if (!ok) {
                toast.error('Session expired. Please sign in again.', { duration: 8000 });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [userId, refreshBackendSession]);

    /**
     * Join a channel room to receive live reply and update events.
     * Emits the contract event: subscribe:channel
     */
    const subscribeToChannel = useCallback((teamId: string, channelId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('subscribe:channel', { teamId, channelId });
        }
    }, []);

    /**
     * Leave a channel room.
     * Emits the contract event: unsubscribe:channel
     */
    const unsubscribeFromChannel = useCallback((teamId: string, channelId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('unsubscribe:channel', { teamId, channelId });
        }
    }, []);

    const emit = useCallback((event: string, data: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    const on = useCallback((event: string, callback: (data: any) => void) => {
        socketRef.current?.on(event, callback);
    }, []);

    const off = useCallback((event: string) => {
        socketRef.current?.off(event);
    }, []);

    return {
        emit,
        on,
        off,
        subscribeToChannel,
        unsubscribeFromChannel,
        socket: socketRef.current,
    };
};
