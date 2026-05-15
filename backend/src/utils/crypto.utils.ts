import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from './logger';

const resolveKeyPath = (keyPath: string) => path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(process.cwd(), keyPath);

/**
 * Decrypts Microsoft Graph encrypted notifications using RSA OAEP.
 * Graph uses symmetric key encryption (AES-256-CBC) but encrypts the symmetric key with our RSA public key.
 */
export class CryptoUtils {
    private static privateKey: string;

    private static getPrivateKey(): string {
        if (!this.privateKey) {
            try {
                this.privateKey = fs.readFileSync(resolveKeyPath(config.rsa.privateKeyPath), 'utf8');
            } catch (err) {
                logger.error('Failed to read private key for decryption', err);
                throw new Error('Private key not found');
            }
        }
        return this.privateKey;
    }

    /**
     * Decrypts the symmetric key sent by Graph.
     */
    static decryptSymmetricKey(encryptedKey: string): Buffer {
        return crypto.privateDecrypt(
            {
                key: this.getPrivateKey(),
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha1', // Microsoft Graph currently uses SHA1 for OAEP
            },
            Buffer.from(encryptedKey, 'base64')
        );
    }

    /**
     * Decrypts the actual data using the decrypted symmetric key.
     * Microsoft Graph's dataKey (after RSA decryption) contains both the IV and the AES Key.
     */
    static decryptPayload(encryptedData: string, symmetricKey: Buffer): any {
        try {
            // Microsoft Graph uses AES-256-CBC.
            // The symmetricKey is 48 bytes: 
            // - First 16 bytes = Initialisation Vector (IV)
            // - Next 32 bytes = AES Key
            if (symmetricKey.length < 48) {
                logger.error('Invalid symmetric key length from Graph', { length: symmetricKey.length });
                return null;
            }

            const iv = symmetricKey.slice(0, 16);
            const key = symmetricKey.slice(16);

            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (err) {
            logger.error('Failed to decrypt payload', err);
            return null;
        }
    }

    /**
     * Helper to get certificate for subscription registration.
     * Microsoft Graph expects the full certificate (base64-encoded, no headers)
     */
    static getPublicKeyBase64(): string {
        const certPath = resolveKeyPath(process.env.RSA_CERT_PATH || './certs/cert.pem');
        const fallbackPath = resolveKeyPath(config.rsa.publicKeyPath);
        const pem = fs.existsSync(certPath) ? fs.readFileSync(certPath, 'utf8') : fs.readFileSync(fallbackPath, 'utf8');
        return pem.replace(/-----BEGIN (PUBLIC KEY|CERTIFICATE)-----|-----END (PUBLIC KEY|CERTIFICATE)-----|\n|\r/g, '');
    }
}
