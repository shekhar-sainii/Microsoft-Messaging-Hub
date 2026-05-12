import * as msal from '@azure/msal-node';
import { MsalOboService } from './msalOboService';
import { redis } from '../config/redis';

// Mock the entire MSAL module
jest.mock('@azure/msal-node', () => {
  return {
    ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
      acquireTokenOnBehalfOf: jest.fn(),
      getTokenCache: jest.fn().mockReturnValue({
        deserialize: jest.fn(),
        serialize: jest.fn(),
      }),
    })),
    LogLevel: { Error: 0 },
  };
});

describe('MsalOboService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redis.quit(); // Ensure redis connection is closed
  });

  it('should successfully exchange a user token for a Graph token via OBO', async () => {
    const mockUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJtb2NrLXRlbmFudCJ9.sig'; // Mock JWT with tid
    const mockGraphToken = 'mock-graph-token';

    const acquireTokenMock = jest.fn().mockResolvedValue({
      accessToken: mockGraphToken,
      account: { homeAccountId: '123' },
    });

    (msal.ConfidentialClientApplication as any).mockImplementation(() => ({
      acquireTokenOnBehalfOf: acquireTokenMock,
    }));

    const result = await MsalOboService.getGraphToken(mockUserToken);

    expect(acquireTokenMock).toHaveBeenCalledWith({
      oboAssertion: mockUserToken,
      scopes: ['https://graph.microsoft.com/.default'],
    });
    expect(result).toBe(mockGraphToken);
  });

  it('should return null when the OBO exchange fails', async () => {
    const mockUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJtb2NrLXRlbmFudCJ9.sig';

    const acquireTokenMock = jest.fn().mockRejectedValue(new Error('AADSTS50013: Assertion failed'));

    (msal.ConfidentialClientApplication as any).mockImplementation(() => ({
      acquireTokenOnBehalfOf: acquireTokenMock,
    }));

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await MsalOboService.getGraphToken(mockUserToken);

    expect(acquireTokenMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();

    consoleSpy.mockRestore();
  });
});
