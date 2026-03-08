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
import { formatValidationIssues, settingsSchema, type SettingsInput } from '@/lib/validations';
import { getTranslations } from 'next-intl/server';
import { revalidatePublicShell } from '@/lib/public-revalidation';

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

function getTrimmedString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

function getOptionalString(formData: FormData, key: string): string | null {
    const value = getTrimmedString(formData, key);
    return value.length > 0 ? value : null;
}

function getBoolean(formData: FormData, key: string): boolean {
    return formData.get(key) === 'on';
}

function getSettingsFormValues(formData: FormData): SettingsInput {
    return {
        siteTitle: getTrimmedString(formData, 'siteTitle'),
        siteDescription: getTrimmedString(formData, 'siteDescription'),
        allowRegistration: getBoolean(formData, 'allowRegistration'),
        faviconUrl: getOptionalString(formData, 'faviconUrl'),
        s3Bucket: getOptionalString(formData, 's3Bucket'),
        s3Region: getOptionalString(formData, 's3Region'),
        s3AccessKey: getOptionalString(formData, 's3AccessKey'),
        s3SecretKey: getOptionalString(formData, 's3SecretKey'),
        s3Endpoint: getOptionalString(formData, 's3Endpoint'),
        s3CdnUrl: getOptionalString(formData, 's3CdnUrl'),
        resendApiKey: getOptionalString(formData, 'resendApiKey'),
        resendFromEmail: getOptionalString(formData, 'resendFromEmail'),
        aiBaseUrl: getOptionalString(formData, 'aiBaseUrl'),
        aiApiKey: getOptionalString(formData, 'aiApiKey'),
        aiModel: getOptionalString(formData, 'aiModel'),
        umamiEnabled: getBoolean(formData, 'umamiEnabled'),
        umamiCloud: getBoolean(formData, 'umamiCloud'),
        umamiHostUrl: getOptionalString(formData, 'umamiHostUrl'),
        umamiWebsiteId: getOptionalString(formData, 'umamiWebsiteId'),
        umamiApiKey: getOptionalString(formData, 'umamiApiKey'),
        umamiApiUserId: getOptionalString(formData, 'umamiApiUserId'),
        umamiApiSecret: getOptionalString(formData, 'umamiApiSecret'),
    };
}

export async function updateSettings(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        const tErrors = await getTranslations('errors');
        throw new Error(tErrors('adminRequired'));
    }

    const [currentSettings] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const validationResult = settingsSchema.safeParse(getSettingsFormValues(formData));

    if (!validationResult.success) {
        const tErrors = await getTranslations('errors');
        const errorMessages = formatValidationIssues(validationResult.error.issues, tErrors);
        redirect(`/admin/settings?error=${encodeURIComponent(errorMessages)}`);
    }

    const validatedSettings = validationResult.data;

    const s3AccessKey = resolveSecretFieldValue({
        currentValue: currentSettings?.s3AccessKey,
        submittedValue: validatedSettings.s3AccessKey,
        clearRequested: formData.get('clearS3AccessKey') === 'on',
    });
    const s3SecretKey = resolveSecretFieldValue({
        currentValue: currentSettings?.s3SecretKey,
        submittedValue: validatedSettings.s3SecretKey,
        clearRequested: formData.get('clearS3SecretKey') === 'on',
    });
    const resendApiKey = resolveSecretFieldValue({
        currentValue: currentSettings?.resendApiKey,
        submittedValue: validatedSettings.resendApiKey,
        clearRequested: formData.get('clearResendApiKey') === 'on',
    });
    const aiApiKey = resolveSecretFieldValue({
        currentValue: currentSettings?.aiApiKey,
        submittedValue: validatedSettings.aiApiKey,
        clearRequested: formData.get('clearAiApiKey') === 'on',
    });
    const umamiApiKey = resolveSecretFieldValue({
        currentValue: currentSettings?.umamiApiKey,
        submittedValue: validatedSettings.umamiApiKey,
        clearRequested: formData.get('clearUmamiApiKey') === 'on',
    });
    const umamiApiSecret = resolveSecretFieldValue({
        currentValue: currentSettings?.umamiApiSecret,
        submittedValue: validatedSettings.umamiApiSecret,
        clearRequested: formData.get('clearUmamiApiSecret') === 'on',
    });

    const nextSettings = {
        ...validatedSettings,
        s3AccessKey,
        s3SecretKey,
        resendApiKey,
        aiApiKey,
        umamiApiKey,
        umamiApiSecret,
    };

    try {
        await db.insert(settings).values({
            id: 1,
            ...nextSettings,
        }).onConflictDoUpdate({
            target: settings.id,
            set: nextSettings,
        });
    } catch (error) {
        console.error('Failed to update settings:', error);
        const tErrors = await getTranslations('errors');
        throw new Error(tErrors('saveSettingsFailed'));
    }

    invalidateSettingsCache();
    revalidatePublicShell();

    revalidatePath('/');
    revalidatePath('/admin/settings');
    redirect('/admin/settings?saved=true');
}
