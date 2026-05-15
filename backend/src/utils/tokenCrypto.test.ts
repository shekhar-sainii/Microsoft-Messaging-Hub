import { decryptToken, encryptToken } from './tokenCrypto';

jest.mock('../config', () => ({
  config: {
    jwt: { secret: 'test-secret-for-token-crypto' },
  },
}));

describe('tokenCrypto', () => {
  it('round-trips encrypted tokens', () => {
    const encrypted = encryptToken('graph-access-token');

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(decryptToken(encrypted)).toBe('graph-access-token');
  });

  it('supports existing plaintext tokens for migration', () => {
    expect(decryptToken('legacy-token')).toBe('legacy-token');
    expect(decryptToken(null)).toBeNull();
  });
});
