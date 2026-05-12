import dotenv from 'dotenv';
dotenv.config();

const cleanRedisUrl = (url?: string) => {
  if (!url) return undefined;
  // Automatically strip extra CLI params like '--tls -u ' if accidentally pasted
  const match = url.match(/(rediss?:\/\/[^\s]+)/);
  return match ? match[1].trim() : url.trim();
};

export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoft-messaging-hub',
  },
  redis: {
    url: cleanRedisUrl(process.env.REDIS_URL),
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  msal: {
    tenantId: process.env.TENANT_ID,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID || 'common'}`,
  },
  webhook: {
    url: process.env.WEBHOOK_URL || '',
    clientState: process.env.WEBHOOK_CLIENT_STATE || '',
  },
  rsa: {
    privateKeyPath: process.env.RSA_PRIVATE_KEY_PATH || './certs/private.pem',
    publicKeyPath: process.env.RSA_PUBLIC_KEY_PATH || './certs/public.pem',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret',
    expiresIn: '24h',
  },
  teamsWebhookToken: process.env.TEAMS_OUTGOING_WEBHOOK_TOKEN || '',
};
