import { Request, Response } from 'express';
import { webhookController } from './webhook.controller';
import { socketService } from '../../services/socket.service';

// Mock Dependencies
jest.mock('../../services/socket.service', () => ({
  socketService: {
    emitToRoom: jest.fn(),
    emitToChannel: jest.fn(),
  },
}));

jest.mock('../../utils/crypto.utils', () => ({
  CryptoUtils: {
    decryptSymmetricKey: jest.fn(),
    decryptPayload: jest.fn(),
  },
}));

describe('WebhookController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let setMock: jest.Mock;

  beforeEach(() => {
    process.env.WEBHOOK_CLIENT_STATE = 'secret-hmac';

    sendMock = jest.fn();
    setMock = jest.fn().mockReturnValue({ send: sendMock });
    statusMock = jest.fn().mockReturnValue({ set: setMock, send: sendMock });

    mockResponse = {
      status: statusMock,
      set: setMock,
      send: sendMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleNotification validation handshake', () => {
    it('should return 200 and echo the validationToken for handshake requests', async () => {
      mockRequest = {
        query: { validationToken: '12345-token' },
      };

      await webhookController.handleNotification(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(setMock).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(sendMock).toHaveBeenCalledWith('12345-token');
    });
  });

  describe('handleNotification payload', () => {
    it('should return 202 and process payloads with valid clientState', async () => {
      mockRequest = {
        query: {},
        body: {
          value: [
            {
              clientState: 'secret-hmac',
              resource: 'teams/team-id/channels/chan-id/messages/msg-id',
              resourceData: { id: 'msg-id' },
            },
          ],
        },
      };

      await webhookController.handleNotification(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(202);
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
