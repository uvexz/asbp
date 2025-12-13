'use server';

import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getSettings() {
    const data = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    if (data.length === 0) {
        // Return defaults if not found (though postRegistrationCleanup should create it)
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
        };
    }
    return data[0];
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
    const s3AccessKey = (formData.get('s3AccessKey') as string) || null;
    const s3SecretKey = (formData.get('s3SecretKey') as string) || null;
    const s3Endpoint = (formData.get('s3Endpoint') as string) || null;
    const s3CdnUrl = (formData.get('s3CdnUrl') as string) || null;
    const resendApiKey = (formData.get('resendApiKey') as string) || null;
    const resendFromEmail = (formData.get('resendFromEmail') as string) || null;

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
            }
        });
    } catch (error) {
        console.error('Failed to update settings:', error);
        throw new Error('Failed to save settings');
    }

    revalidatePath('/');
    revalidatePath('/admin/settings');
    redirect('/admin/settings?saved=true');
}
