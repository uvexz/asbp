import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, comments, tags, postsTags, media, navItems, settings } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

// Helper to convert date strings to Date objects
function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
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
      posts: 0,
      comments: 0,
      tags: 0,
      postsTags: 0,
      navItems: 0,
      media: 0,
      settings: false,
    };

    // Import tags first (posts depend on them)
    if (importData.data.tags?.length) {
      for (const tag of importData.data.tags) {
        try {
          await db.insert(tags).values({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
          }).onConflictDoNothing();
          results.tags++;
        } catch { /* skip duplicates */ }
      }
    }

    // Import posts - map authorId to current user
    if (importData.data.posts?.length) {
      for (const post of importData.data.posts) {
        try {
          await db.insert(posts).values({
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            published: post.published ?? false,
            postType: post.postType as 'post' | 'page' | 'memo' | null,
            authorId: currentUserId, // Use current user ID
            publishedAt: parseDate(post.publishedAt),
            createdAt: parseDate(post.createdAt) || new Date(),
            updatedAt: parseDate(post.updatedAt) || new Date(),
          }).onConflictDoNothing();
          results.posts++;
        } catch { /* skip duplicates */ }
      }
    }

    // Import posts-tags relations
    if (importData.data.postsTags?.length) {
      for (const pt of importData.data.postsTags) {
        try {
          await db.insert(postsTags).values({
            postId: pt.postId,
            tagId: pt.tagId,
          }).onConflictDoNothing();
          results.postsTags++;
        } catch { /* skip duplicates */ }
      }
    }

    // Import comments - map userId to current user if it was the author
    if (importData.data.comments?.length) {
      for (const comment of importData.data.comments) {
        try {
          await db.insert(comments).values({
            id: comment.id,
            content: comment.content,
            postId: comment.postId,
            userId: comment.userId ? currentUserId : null, // Map to current user
            parentId: comment.parentId,
            guestName: comment.guestName,
            guestEmail: comment.guestEmail,
            guestWebsite: comment.guestWebsite,
            status: comment.status,
            createdAt: parseDate(comment.createdAt) || new Date(),
          }).onConflictDoNothing();
          results.comments++;
        } catch { /* skip duplicates */ }
      }
    }

    // Import navigation items
    if (importData.data.navItems?.length) {
      for (const nav of importData.data.navItems) {
        try {
          await db.insert(navItems).values({
            id: nav.id,
            label: nav.label,
            url: nav.url,
            openInNewTab: nav.openInNewTab ?? false,
            sortOrder: nav.sortOrder,
            createdAt: parseDate(nav.createdAt) || new Date(),
          }).onConflictDoNothing();
          results.navItems++;
        } catch { /* skip duplicates */ }
      }
    }

    // Import media records
    if (importData.data.media?.length) {
      for (const m of importData.data.media) {
        try {
          await db.insert(media).values({
            id: m.id,
            url: m.url,
            filename: m.filename,
            mimeType: m.mimeType,
            size: m.size,
            createdAt: parseDate(m.createdAt) || new Date(),
          }).onConflictDoNothing();
          results.media++;
        } catch { /* skip duplicates */ }
      }
    }

    // Import settings (update existing)
    if (importData.data.settings) {
      const { siteTitle, siteDescription, allowRegistration } = importData.data.settings;
      await db.update(settings).set({
        ...(siteTitle && { siteTitle }),
        ...(siteDescription && { siteDescription }),
        ...(allowRegistration !== undefined && { allowRegistration }),
      }).where(eq(settings.id, 1));
      results.settings = true;
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
