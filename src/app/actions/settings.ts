'use server';

import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { encrypt } from '@/lib/crypto';
import { getCachedSettings, invalidateSettingsCache } from '@/lib/cache-layer';

/**
 * Get settings with caching
 * Use this for public/read-only access
 */
export async function getSettings() {
    return getCachedSettings();
}

/**
 * Get settings without cache (for admin forms that need fresh data)
 */
export async function getSettingsUncached() {
    const { decrypt } = await import('@/lib/crypto');
    const data = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    
    if (data.length === 0) {
        return {
            siteTitle: 'My Awesome Blog',
            siteDescription: 'A blog about tech...',
            allowRegistration: false,
            s3Bucket: '',
            s3Region: '',
            s3AccessKey: '',
            s3SecretKey: '',
            s3Endpoint: '',
            s3CdnUrl: '',
            resendApiKey: '',
            resendFromEmail: '',
            aiBaseUrl: '',
            aiApiKey: '',
            aiModel: '',
        };
    }
    
    const row = data[0];
    
    // Decrypt sensitive fields for display
    return {
        ...row,
        s3SecretKey: row.s3SecretKey ? decrypt(row.s3SecretKey) : '',
        s3AccessKey: row.s3AccessKey ? decrypt(row.s3AccessKey) : '',
        resendApiKey: row.resendApiKey ? decrypt(row.resendApiKey) : '',
        aiApiKey: row.aiApiKey ? decrypt(row.aiApiKey) : '',
    };
}

/**
 * Check if S3 is configured
 */
export async function hasS3Config(): Promise<boolean> {
    const data = await getSettings();
    return !!(data.s3Endpoint && data.s3Region && data.s3AccessKey && data.s3SecretKey && data.s3Bucket);
}

export async function updateSettings(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const siteTitle = (formData.get('siteTitle') as string) || '';
    const siteDescription = (formData.get('siteDescription') as string) || '';
    const allowRegistration = formData.get('allowRegistration') === 'on';
    const s3Bucket = (formData.get('s3Bucket') as string) || null;
    const s3Region = (formData.get('s3Region') as string) || null;
    const s3Endpoint = (formData.get('s3Endpoint') as string) || null;
    const s3CdnUrl = (formData.get('s3CdnUrl') as string) || null;
    const resendFromEmail = (formData.get('resendFromEmail') as string) || null;
    const aiBaseUrl = (formData.get('aiBaseUrl') as string) || null;
    const aiModel = (formData.get('aiModel') as string) || null;
    
    // Get raw values for sensitive fields
    const s3AccessKeyRaw = (formData.get('s3AccessKey') as string) || null;
    const s3SecretKeyRaw = (formData.get('s3SecretKey') as string) || null;
    const resendApiKeyRaw = (formData.get('resendApiKey') as string) || null;
    const aiApiKeyRaw = (formData.get('aiApiKey') as string) || null;
    
    // Encrypt sensitive fields before storing
    const s3AccessKey = s3AccessKeyRaw ? encrypt(s3AccessKeyRaw) : null;
    const s3SecretKey = s3SecretKeyRaw ? encrypt(s3SecretKeyRaw) : null;
    const resendApiKey = resendApiKeyRaw ? encrypt(resendApiKeyRaw) : null;
    const aiApiKey = aiApiKeyRaw ? encrypt(aiApiKeyRaw) : null;

    try {
        await db.insert(settings).values({
            id: 1,
            siteTitle,
            siteDescription,
            allowRegistration,
            s3Bucket,
            s3Region,
            s3AccessKey,
            s3SecretKey,
            s3Endpoint,
            s3CdnUrl,
            resendApiKey,
            resendFromEmail,
            aiBaseUrl,
            aiApiKey,
            aiModel,
        }).onConflictDoUpdate({
            target: settings.id,
            set: {
                siteTitle,
                siteDescription,
                allowRegistration,
                s3Bucket,
                s3Region,
                s3AccessKey,
                s3SecretKey,
                s3Endpoint,
                s3CdnUrl,
                resendApiKey,
                resendFromEmail,
                aiBaseUrl,
                aiApiKey,
                aiModel,
            }
        });
    } catch (error) {
        console.error('Failed to update settings:', error);
        throw new Error('Failed to save settings');
    }

    // Invalidate settings cache
    invalidateSettingsCache();
    
    revalidatePath('/');
    revalidatePath('/admin/settings');
    redirect('/admin/settings?saved=true');
}
