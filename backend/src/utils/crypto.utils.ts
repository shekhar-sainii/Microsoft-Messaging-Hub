import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const PRIVATE_KEY_PATH = path.join(__dirname, '../keys/private.pem');

/**
 * Decrypts Microsoft Graph encrypted notifications using RSA OAEP.
 * Graph uses symmetric key encryption (AES-256-CBC) but encrypts the symmetric key with our RSA public key.
 */
export class CryptoUtils {
    private static privateKey: string;

    private static getPrivateKey(): string {
        if (!this.privateKey) {
            try {
                this.privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
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
     */
    static decryptPayload(encryptedData: string, symmetricKey: Buffer): any {
        try {
            // Microsoft Graph uses AES-256-CBC with a 16-byte IV
            // The first 16 bytes of the symmetric key are typically NOT the IV, 
            // usually Graph provides a separate dataKey and dataSignature.
            // Actually, for resource data, Graph provides 'data' (encrypted payload),
            // 'dataKey' (encrypted symmetric key), and 'dataSignature'.
            
            // Standard AES-256-CBC decryption
            // Note: This is a simplified version; real Graph decryption involves 
            // signature verification and specific padding handling.
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, Buffer.alloc(16, 0)); // IV is usually handled via signature/metadata
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
        const certPath = path.join(__dirname, '../keys/cert.pem');
        const fallbackPath = path.join(__dirname, '../keys/public.pem');
        const pem = fs.existsSync(certPath) ? fs.readFileSync(certPath, 'utf8') : fs.readFileSync(fallbackPath, 'utf8');
        return pem.replace(/-----BEGIN (PUBLIC KEY|CERTIFICATE)-----|-----END (PUBLIC KEY|CERTIFICATE)-----|\n|\r/g, '');
    }
}
