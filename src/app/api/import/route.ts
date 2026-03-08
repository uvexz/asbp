import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, comments, tags, postsTags, media, navItems, settings } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidateImportedContent } from '@/lib/import-revalidation';

// Helper to convert date strings to Date objects
function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

interface ImportCountResult {
  attempted: number;
  inserted: number;
  skipped: number;
}

interface SettingsImportResult {
  imported: boolean;
  action?: 'created' | 'updated';
}

interface ImportData {
  version: string;
  data: {
    posts?: Array<{
      id: string;
      title: string;
      slug: string;
      content: string;
      published?: boolean | null;
      postType?: string | null;
      authorId: string;
      publishedAt?: string | Date | null;
      createdAt?: string | Date;
      updatedAt?: string | Date;
    }>;
    comments?: Array<{
      id: string;
      content: string;
      postId: string;
      userId?: string | null;
      parentId?: string | null;
      guestName?: string | null;
      guestEmail?: string | null;
      guestWebsite?: string | null;
      status?: string | null;
      createdAt?: string | Date;
    }>;
    tags?: Array<{ id: string; name: string; slug: string }>;
    postsTags?: Array<{ postId: string; tagId: string }>;
    navItems?: Array<{
      id: string;
      label: string;
      url: string;
      openInNewTab?: boolean | null;
      sortOrder: number;
      createdAt?: string | Date;
    }>;
    media?: Array<{
      id: string;
      url: string;
      filename: string;
      mimeType?: string | null;
      size?: number | null;
      createdAt?: string | Date;
    }>;
    settings?: {
      siteTitle?: string | null;
      siteDescription?: string | null;
      allowRegistration?: boolean | null;
    };
  };
}

function createCountResult(): ImportCountResult {
  return {
    attempted: 0,
    inserted: 0,
    skipped: 0,
  };
}

function recordImportAttempt(result: ImportCountResult, inserted: boolean) {
  result.attempted += 1;
  if (inserted) {
    result.inserted += 1;
  } else {
    result.skipped += 1;
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const importData: ImportData = await request.json();

    if (!importData.data) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    const currentUserId = session.user.id;

    const results = {
      posts: createCountResult(),
      comments: createCountResult(),
      tags: createCountResult(),
      postsTags: createCountResult(),
      navItems: createCountResult(),
      media: createCountResult(),
      settings: { imported: false } as SettingsImportResult,
    };

    const insertedPosts: NonNullable<ImportData['data']['posts']> = [];
    const insertedComments: NonNullable<ImportData['data']['comments']> = [];
    const insertedTags: NonNullable<ImportData['data']['tags']> = [];

    // Import tags first (posts depend on them)
    if (importData.data.tags?.length) {
      for (const tag of importData.data.tags) {
        try {
          const insertedRows = await db.insert(tags).values({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
          }).onConflictDoNothing().returning({ id: tags.id });

          const inserted = insertedRows.length > 0;
          recordImportAttempt(results.tags, inserted);
          if (inserted) {
            insertedTags.push(tag);
          }
        } catch { /* skip duplicates */ }
      }
    }

    // Import posts - map authorId to current user
    if (importData.data.posts?.length) {
      for (const post of importData.data.posts) {
        try {
          const insertedRows = await db.insert(posts).values({
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            published: post.published ?? false,
            postType: post.postType as 'post' | 'page' | 'memo' | null,
            authorId: currentUserId,
            publishedAt: parseDate(post.publishedAt),
            createdAt: parseDate(post.createdAt) || new Date(),
            updatedAt: parseDate(post.updatedAt) || new Date(),
          }).onConflictDoNothing().returning({ id: posts.id });

          const inserted = insertedRows.length > 0;
          recordImportAttempt(results.posts, inserted);
          if (inserted) {
            insertedPosts.push(post);
          }
        } catch { /* skip duplicates */ }
      }
    }

    // Import posts-tags relations
    if (importData.data.postsTags?.length) {
      for (const pt of importData.data.postsTags) {
        try {
          const insertedRows = await db.insert(postsTags).values({
            postId: pt.postId,
            tagId: pt.tagId,
          }).onConflictDoNothing().returning({ postId: postsTags.postId });

          recordImportAttempt(results.postsTags, insertedRows.length > 0);
        } catch { /* skip duplicates */ }
      }
    }

    // Import comments - map userId to current user if it was the author
    if (importData.data.comments?.length) {
      for (const comment of importData.data.comments) {
        try {
          const insertedRows = await db.insert(comments).values({
            id: comment.id,
            content: comment.content,
            postId: comment.postId,
            userId: comment.userId ? currentUserId : null,
            parentId: comment.parentId,
            guestName: comment.guestName,
            guestEmail: comment.guestEmail,
            guestWebsite: comment.guestWebsite,
            status: comment.status,
            createdAt: parseDate(comment.createdAt) || new Date(),
          }).onConflictDoNothing().returning({ id: comments.id });

          const inserted = insertedRows.length > 0;
          recordImportAttempt(results.comments, inserted);
          if (inserted) {
            insertedComments.push(comment);
          }
        } catch { /* skip duplicates */ }
      }
    }

    // Import navigation items
    if (importData.data.navItems?.length) {
      for (const nav of importData.data.navItems) {
        try {
          const insertedRows = await db.insert(navItems).values({
            id: nav.id,
            label: nav.label,
            url: nav.url,
            openInNewTab: nav.openInNewTab ?? false,
            sortOrder: nav.sortOrder,
            createdAt: parseDate(nav.createdAt) || new Date(),
          }).onConflictDoNothing().returning({ id: navItems.id });

          recordImportAttempt(results.navItems, insertedRows.length > 0);
        } catch { /* skip duplicates */ }
      }
    }

    // Import media records
    if (importData.data.media?.length) {
      for (const m of importData.data.media) {
        try {
          const insertedRows = await db.insert(media).values({
            id: m.id,
            url: m.url,
            filename: m.filename,
            mimeType: m.mimeType,
            size: m.size,
            createdAt: parseDate(m.createdAt) || new Date(),
          }).onConflictDoNothing().returning({ id: media.id });

          recordImportAttempt(results.media, insertedRows.length > 0);
        } catch { /* skip duplicates */ }
      }
    }

    // Import settings with singleton upsert
    if (importData.data.settings) {
      const { siteTitle, siteDescription, allowRegistration } = importData.data.settings;
      const settingsUpdate = {
        ...(siteTitle !== undefined && { siteTitle: siteTitle ?? null }),
        ...(siteDescription !== undefined && { siteDescription: siteDescription ?? null }),
        ...(allowRegistration !== undefined && { allowRegistration: allowRegistration ?? null }),
      };

      if (Object.keys(settingsUpdate).length > 0) {
        const existingSettings = await db.query.settings.findFirst({
          columns: { id: true },
        });

        await db.insert(settings).values({
          id: 1,
          ...settingsUpdate,
        }).onConflictDoUpdate({
          target: settings.id,
          set: settingsUpdate,
        });

        results.settings = {
          imported: true,
          action: existingSettings ? 'updated' : 'created',
        };
      }
    }

    await revalidateImportedContent({
      posts: insertedPosts,
      comments: insertedComments,
      tags: insertedTags,
      navItemsImported: results.navItems.inserted > 0,
      settingsImported: results.settings.imported,
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
