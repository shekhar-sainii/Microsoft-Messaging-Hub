import { MsalOboService } from './msalOboService';
import { cca } from '../config/msal';

// Mock the MSAL Confidential Client Application
jest.mock('../config/msal', () => ({
  cca: {
    acquireTokenOnBehalfOf: jest.fn(),
  },
}));

describe('MsalOboService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully exchange a user token for a Graph token via OBO', async () => {
    const mockUserToken = 'mock-user-token';
    const mockGraphToken = 'mock-graph-token';

    // Set up mock to return a valid access token
    (cca.acquireTokenOnBehalfOf as jest.Mock).mockResolvedValue({
      accessToken: mockGraphToken,
      account: { homeAccountId: '123' },
    });

    const result = await MsalOboService.getGraphToken(mockUserToken);

    expect(cca.acquireTokenOnBehalfOf).toHaveBeenCalledWith({
      oboAssertion: mockUserToken,
      scopes: ['https://graph.microsoft.com/.default'],
    });
    expect(result).toBe(mockGraphToken);
  });

  it('should return null when the OBO exchange fails', async () => {
    const mockUserToken = 'invalid-user-token';

    // Mock an error during token exchange
    (cca.acquireTokenOnBehalfOf as jest.Mock).mockRejectedValue(new Error('AADSTS50013: Assertion failed'));

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await MsalOboService.getGraphToken(mockUserToken);

    expect(cca.acquireTokenOnBehalfOf).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();

    consoleSpy.mockRestore();
  });
});
