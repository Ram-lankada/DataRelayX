import * as crypto from 'crypto';

// Generate a random secret key (replace with secure key management for production)
const SECRET_KEY = crypto.randomBytes(32);
console.log(`Secret key (hex): ${SECRET_KEY.toString('hex')}`);

async function decrypt(ciphertext: string) {
  try {
    const nonce = crypto.randomBytes(12);
    const decipher = crypto.createDecipheriv('chacha20-poly1305', Buffer.from(SECRET_KEY), nonce);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Decryption failed:', error.message);
    } else {
      console.error('Decryption failed:', 'Unknown error');
    }
    return '';
  }
}

// Example usage
const parsedMetaData = 'MIDONE';
const decryptedData = await decrypt(parsedMetaData);
console.log(`Decrypted data: ${decryptedData}`);
