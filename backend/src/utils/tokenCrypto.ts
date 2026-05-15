import crypto from 'crypto';
import { config } from '../config';

const PREFIX = 'enc:v1:';

const getKey = () => crypto.createHash('sha256').update(config.jwt.secret).digest();

export const encryptToken = (token: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${[
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.')}`;
};

export const decryptToken = (storedToken?: string | null) => {
  if (!storedToken) return null;
  if (!storedToken.startsWith(PREFIX)) return storedToken;

  const [iv, tag, encrypted] = storedToken.slice(PREFIX.length).split('.');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(iv, 'base64url')
  );

  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};
