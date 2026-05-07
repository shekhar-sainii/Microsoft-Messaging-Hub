import { socketServer } from '../socket/socketServer';

/**
 * Socket Service — thin wrapper around SocketServer for use in workers/controllers.
 * Delegates all calls to the singleton SocketServer instance.
 */
export const socketService = {
    emitToUser: (userId: string, event: string, data: any) => {
        socketServer.emitToUser(userId, event, data);
    },

    emitToChannel: (channelId: string, event: string, data: any) => {
        socketServer.emitToChannel(channelId, event, data);
    },

    notifyTokenExpiring: (userId: string, expiresInSeconds: number) => {
        socketServer.notifyTokenExpiring(userId, expiresInSeconds);
    },
};
