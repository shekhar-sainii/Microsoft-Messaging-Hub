import dotenv from 'dotenv';
import { env } from './env.validation';
dotenv.config();

const cleanRedisUrl = (url?: string) => {
  if (!url) return undefined;
  // Automatically strip extra CLI params like '--tls -u ' if accidentally pasted
  const match = url.match(/(rediss?:\/\/[^\s]+)/);
  let clean = match ? match[1].trim() : url.trim();
  
  // node-redis v4 strict validation check: if URL targets a secure provider (Upstash/Render)
  // but starts with plain redis://, automatically rewrite protocol to rediss://
  if (clean.startsWith('redis://') && (clean.includes('upstash') || clean.includes('render'))) {
      clean = clean.replace('redis://', 'rediss://');
  }
  return clean;
};

export const config = {
  port: env.PORT,
  env: env.NODE_ENV,
  mongodb: {
    uri: env.MONGODB_URI,
  },
  redis: {
    url: cleanRedisUrl(process.env.REDIS_URL),
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD,
  },
  msal: {
    tenantId: env.TENANT_ID,
    clientId: env.CLIENT_ID,
    clientSecret: env.CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${env.TENANT_ID || 'common'}`,
  },
  webhook: {
    url: env.WEBHOOK_URL || '',
    clientState: env.WEBHOOK_CLIENT_STATE,
  },
  rsa: {
    privateKeyPath: env.RSA_PRIVATE_KEY_PATH,
    publicKeyPath: env.RSA_PUBLIC_KEY_PATH,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: '24h',
  },
  teamsWebhookToken: env.TEAMS_OUTGOING_WEBHOOK_TOKEN || '',
};
