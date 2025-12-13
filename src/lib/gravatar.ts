import { createHash } from 'crypto';

/**
 * Generate Gravatar URL from email
 * Uses sevencdn.com as the base URL
 */
export function getGravatarUrl(email: string): string {
    const hash = createHash('md5')
        .update(email.trim().toLowerCase())
        .digest('hex');
    return `https://use.sevencdn.com/avatar/${hash}?d=mp`;
}
