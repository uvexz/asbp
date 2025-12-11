'use server';

import { db } from '@/lib/db';
import { media } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getS3Client } from '@/lib/s3';
import { getSettings } from './settings';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string };

export interface Media {
  id: string;
  url: string;
  filename: string;
  mimeType: string | null;
  size: number | null;
  createdAt: Date;
}

/**
 * Get all media files from the database
 * Requires admin authentication
 */
export async function getMedia(): Promise<Media[]> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const data = await db.select().from(media).orderBy(desc(media.createdAt));
  return data;
}

/**
 * Upload a media file to S3 and save the record to the database
 * Requires admin authentication and S3 configuration
 */
export async function uploadMedia(formData: FormData): Promise<ActionResult<{ url: string; id: string }>> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File | null;

  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  // Validate file
  if (file.size === 0) {
    return { success: false, error: 'File is empty' };
  }

  // Get S3 client and settings
  const s3Client = await getS3Client();
  const settings = await getSettings();

  if (!s3Client || !settings.s3Bucket) {
    return { success: false, error: 'S3 storage is not configured' };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${timestamp}-${sanitizedFilename}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: settings.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    }));

    // Construct the URL
    const url = `${settings.s3Endpoint}/${settings.s3Bucket}/${key}`;

    // Save to database
    const [newMedia] = await db.insert(media).values({
      url,
      filename: file.name,
      mimeType: file.type || null,
      size: file.size,
    }).returning();

    revalidatePath('/admin/media');

    return { 
      success: true, 
      data: { 
        url: newMedia.url, 
        id: newMedia.id 
      } 
    };
  } catch (error) {
    console.error('Failed to upload media:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    };
  }
}

/**
 * Delete a media file from S3 and remove the record from the database
 * Requires admin authentication
 */
export async function deleteMedia(id: string): Promise<ActionResult> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Get the media record first
  const [mediaRecord] = await db.select().from(media).where(eq(media.id, id)).limit(1);

  if (!mediaRecord) {
    return { success: false, error: 'Media not found' };
  }

  // Get S3 client and settings
  const s3Client = await getS3Client();
  const settings = await getSettings();

  if (s3Client && settings.s3Bucket) {
    try {
      // Extract the key from the URL
      const urlParts = mediaRecord.url.split(`/${settings.s3Bucket}/`);
      const key = urlParts.length > 1 ? urlParts[1] : null;

      if (key) {
        // Delete from S3
        await s3Client.send(new DeleteObjectCommand({
          Bucket: settings.s3Bucket,
          Key: key,
        }));
      }
    } catch (error) {
      console.error('Failed to delete from S3:', error);
      // Continue to delete from database even if S3 deletion fails
    }
  }

  // Delete from database
  await db.delete(media).where(eq(media.id, id));

  revalidatePath('/admin/media');

  return { success: true };
}
