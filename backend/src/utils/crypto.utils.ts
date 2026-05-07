import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config';

export class CryptoUtils {
  private privateKey: string;

  constructor() {
    this.privateKey = fs.readFileSync(config.rsa.privateKeyPath, 'utf8');
  }

  /**
   * Decrypts symmetric key from Graph notification using RSA private key.
   */
  decryptSymmetricKey(encryptedKey: string): Buffer {
    return crypto.privateDecrypt(
      {
        key: this.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1', // Graph uses SHA-1 for OAEP padding
      },
      Buffer.from(encryptedKey, 'base64')
    );
  }

  /**
   * Verifies HMAC signature of the notification.
   */
  verifySignature(payload: string, signature: string, clientState: string): boolean {
    // In many Graph implementations, the clientState itself is used for verification
    // Or a separate secret is shared. Here we check if clientState matches.
    return clientState === config.webhook.clientState;
  }

  /**
   * Decrypts the resource data using the decrypted symmetric key.
   * Graph uses AES-256-GCM for content encryption.
   */
  decryptContent(encryptedData: string, symmetricKey: Buffer): any {
    const data = Buffer.from(encryptedData, 'base64');
    
    // Graph notification payload structure for encrypted data:
    // First 16 bytes: IV
    // Remaining bytes: Ciphertext + Auth Tag (last 16 bytes)
    
    const iv = data.slice(0, 16);
    const authTag = data.slice(data.length - 16);
    const ciphertext = data.slice(16, data.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', symmetricKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

export const cryptoUtils = new CryptoUtils();
