import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Generates a 2048-bit RSA key pair for Microsoft Graph encrypted notifications.
 * The public key is used when creating a subscription.
 * The private key is used to decrypt the notification payload.
 */
const generateRSAKeys = () => {
    const keysDir = path.join(process.cwd(), 'keys');

    // Create keys directory if it doesn't exist
    if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
    }

    const privateKeyPath = path.join(keysDir, 'private.pem');
    const publicKeyPath = path.join(keysDir, 'public.pem');

    // Check if keys already exist
    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        logger.info('RSA keys already exist in /keys directory. Skipping generation.');
        return;
    }

    logger.info('Generating 2048-bit RSA key pair...');

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);

    logger.info('✅ RSA keys generated successfully!');
    logger.info(`Private Key: ${privateKeyPath}`);
    logger.info(`Public Key: ${publicKeyPath}`);
    logger.info('--- IMPORTANT ---');
    logger.info('Upload the contents of public.pem to Azure when setting up encrypted webhooks.');
};

generateRSAKeys();
