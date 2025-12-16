/**
 * AES-256-GCM encryption for sensitive configuration data
 * Uses environment variable ENCRYPTION_KEY (32 bytes hex) or generates from DATABASE_URL
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Get or derive encryption key
 * Priority: ENCRYPTION_KEY env var > derived from BETTER_AUTH_SECRET
 */
function getEncryptionKey(): Buffer {
  if (process.env.ENCRYPTION_KEY) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
    return key;
  }
  
  // Derive key from BETTER_AUTH_SECRET as fallback (already required for auth)
  if (process.env.BETTER_AUTH_SECRET) {
    return createHash('sha256')
      .update(process.env.BETTER_AUTH_SECRET + '_settings_encryption')
      .digest();
  }
  
  throw new Error('No encryption key available. Set ENCRYPTION_KEY or BETTER_AUTH_SECRET');
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string value
 * Expects base64 encoded string: iv:authTag:ciphertext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  
  // Check if it's encrypted (contains colons for our format)
  if (!ciphertext.includes(':')) {
    // Return as-is if not encrypted (for backward compatibility)
    return ciphertext;
  }
  
  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');
    
    if (parts.length !== 3) {
      // Not our format, return as-is
      return ciphertext;
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      // Invalid format, return as-is
      return ciphertext;
    }
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    // Decryption failed, might be plaintext or corrupted
    // Return as-is for backward compatibility
    return ciphertext;
  }
}

/**
 * Check if a value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value || !value.includes(':')) return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  
  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}
