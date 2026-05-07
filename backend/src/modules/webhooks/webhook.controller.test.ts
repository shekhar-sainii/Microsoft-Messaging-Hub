import { Request, Response } from 'express';
import { WebhookController } from './webhook.controller';

// Mock Dependencies
jest.mock('../../services/socket.service', () => ({
  socketService: {
    emitToChannel: jest.fn(),
  },
}));

jest.mock('../../utils/crypto.utils', () => ({
  cryptoUtils: {
    decryptSymmetricKey: jest.fn(),
    decryptContent: jest.fn(),
  },
}));

describe('WebhookController', () => {
  let webhookController: WebhookController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let setMock: jest.Mock;

  beforeEach(() => {
    webhookController = new WebhookController();
    process.env.WEBHOOK_CLIENT_STATE = 'secret-hmac';

    sendMock = jest.fn();
    setMock = jest.fn().mockReturnValue({ send: sendMock });
    statusMock = jest.fn().mockReturnValue({ set: setMock, send: sendMock });

    mockResponse = {
      status: statusMock,
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook validation handshake', () => {
    it('should return 200 and echo the validationToken for handshake requests', async () => {
      mockRequest = {
        query: { validationToken: '12345-token' },
      };

      await webhookController.handleWebhook(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(setMock).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(sendMock).toHaveBeenCalledWith('12345-token');
    });
  });

  describe('handleWebhook notification payload', () => {
    it('should return 202 and ignore payloads with invalid clientState', async () => {
      mockRequest = {
        query: {},
        body: {
          value: [
            {
              clientState: 'wrong-hmac',
              resourceData: { id: 'msg-1' },
            },
          ],
        },
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await webhookController.handleWebhook(mockRequest as Request, mockResponse as Response);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid client state received');
      expect(statusMock).toHaveBeenCalledWith(202);
      expect(sendMock).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should return 202 and process payloads with valid clientState', async () => {
      mockRequest = {
        query: {},
        body: {
          value: [
            {
              clientState: 'secret-hmac',
              resourceData: { id: 'msg-1', channelId: 'chan-1', body: { content: 'test' } },
            },
          ],
        },
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await webhookController.handleWebhook(mockRequest as Request, mockResponse as Response);

      expect(consoleLogSpy).toHaveBeenCalledWith('Processed Message:', 'test');
      expect(statusMock).toHaveBeenCalledWith(202);
      expect(sendMock).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });
});
