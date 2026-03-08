'use server';

import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCachedSettings, invalidateSettingsCache } from '@/lib/cache-layer';
import { resolveSecretFieldValue } from '@/lib/settings-secrets';

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
    const data = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);

    if (data.length === 0) {
        return {
            siteTitle: 'My Awesome Blog',
            siteDescription: 'A blog about tech...',
            allowRegistration: false,
            faviconUrl: '',
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
            umamiEnabled: false,
            umamiCloud: false,
            umamiHostUrl: '',
            umamiWebsiteId: '',
            umamiApiKey: '',
            umamiApiUserId: '',
            umamiApiSecret: '',
            hasS3AccessKey: false,
            hasS3SecretKey: false,
            hasResendApiKey: false,
            hasAiApiKey: false,
            hasUmamiApiKey: false,
            hasUmamiApiSecret: false,
        };
    }

    const row = data[0];

    // Keep secret values server-side; the admin UI only needs to know whether one is already stored.
    return {
        ...row,
        faviconUrl: row.faviconUrl || '',
        s3SecretKey: '',
        s3AccessKey: '',
        resendApiKey: '',
        aiApiKey: '',
        umamiApiKey: '',
        umamiApiSecret: '',
        hasS3AccessKey: !!row.s3AccessKey,
        hasS3SecretKey: !!row.s3SecretKey,
        hasResendApiKey: !!row.resendApiKey,
        hasAiApiKey: !!row.aiApiKey,
        hasUmamiApiKey: !!row.umamiApiKey,
        hasUmamiApiSecret: !!row.umamiApiSecret,
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

    const [currentSettings] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);

    const siteTitle = (formData.get('siteTitle') as string) || '';
    const siteDescription = (formData.get('siteDescription') as string) || '';
    const allowRegistration = formData.get('allowRegistration') === 'on';
    const faviconUrl = (formData.get('faviconUrl') as string) || null;
    const s3Bucket = (formData.get('s3Bucket') as string) || null;
    const s3Region = (formData.get('s3Region') as string) || null;
    const s3Endpoint = (formData.get('s3Endpoint') as string) || null;
    const s3CdnUrl = (formData.get('s3CdnUrl') as string) || null;
    const resendFromEmail = (formData.get('resendFromEmail') as string) || null;
    const aiBaseUrl = (formData.get('aiBaseUrl') as string) || null;
    const aiModel = (formData.get('aiModel') as string) || null;

    // Umami settings
    const umamiEnabled = formData.get('umamiEnabled') === 'on';
    const umamiCloud = formData.get('umamiCloud') === 'on';
    const umamiHostUrl = (formData.get('umamiHostUrl') as string) || null;
    const umamiWebsiteId = (formData.get('umamiWebsiteId') as string) || null;
    const umamiApiUserId = (formData.get('umamiApiUserId') as string) || null;

    const s3AccessKey = resolveSecretFieldValue({
        currentValue: currentSettings?.s3AccessKey,
        submittedValue: formData.get('s3AccessKey'),
        clearRequested: formData.get('clearS3AccessKey') === 'on',
    });
    const s3SecretKey = resolveSecretFieldValue({
        currentValue: currentSettings?.s3SecretKey,
        submittedValue: formData.get('s3SecretKey'),
        clearRequested: formData.get('clearS3SecretKey') === 'on',
    });
    const resendApiKey = resolveSecretFieldValue({
        currentValue: currentSettings?.resendApiKey,
        submittedValue: formData.get('resendApiKey'),
        clearRequested: formData.get('clearResendApiKey') === 'on',
    });
    const aiApiKey = resolveSecretFieldValue({
        currentValue: currentSettings?.aiApiKey,
        submittedValue: formData.get('aiApiKey'),
        clearRequested: formData.get('clearAiApiKey') === 'on',
    });
    const umamiApiKey = resolveSecretFieldValue({
        currentValue: currentSettings?.umamiApiKey,
        submittedValue: formData.get('umamiApiKey'),
        clearRequested: formData.get('clearUmamiApiKey') === 'on',
    });
    const umamiApiSecret = resolveSecretFieldValue({
        currentValue: currentSettings?.umamiApiSecret,
        submittedValue: formData.get('umamiApiSecret'),
        clearRequested: formData.get('clearUmamiApiSecret') === 'on',
    });

    try {
        await db.insert(settings).values({
            id: 1,
            siteTitle,
            siteDescription,
            allowRegistration,
            faviconUrl,
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
            umamiEnabled,
            umamiCloud,
            umamiHostUrl,
            umamiWebsiteId,
            umamiApiKey,
            umamiApiUserId,
            umamiApiSecret,
        }).onConflictDoUpdate({
            target: settings.id,
            set: {
                siteTitle,
                siteDescription,
                allowRegistration,
                faviconUrl,
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
                umamiEnabled,
                umamiCloud,
                umamiHostUrl,
                umamiWebsiteId,
                umamiApiKey,
                umamiApiUserId,
                umamiApiSecret,
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
