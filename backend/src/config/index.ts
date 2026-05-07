import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoft-messaging-hub',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  msal: {
    tenantId: process.env.TENANT_ID,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    // Use 'common' authority so personal Microsoft accounts (MSA) work.
    // For OBO flow with personal accounts, we use the token's own tid.
    authority: `https://login.microsoftonline.com/common`,
  },
  webhook: {
    url: process.env.WEBHOOK_URL,
    clientState: process.env.WEBHOOK_CLIENT_STATE,
  },
  rsa: {
    privateKeyPath: process.env.RSA_PRIVATE_KEY_PATH || './certs/private.pem',
    publicKeyPath: process.env.RSA_PUBLIC_KEY_PATH || './certs/public.pem',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret',
  },
  teamsWebhookToken: process.env.TEAMS_OUTGOING_WEBHOOK_TOKEN || '',
};
