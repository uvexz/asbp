import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, comments, tags, postsTags, media, navItems, settings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Helper to convert date strings to Date objects
function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

interface ImportUser {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  website?: string | null;
  role?: string | null;
  createdAt?: string | Date;
}

interface ImportPost {
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
}

interface ImportComment {
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
}

interface ImportData {
  version: string;
  data: {
    posts?: ImportPost[];
    comments?: ImportComment[];
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
    users?: ImportUser[];
    settings?: {
      siteTitle?: string | null;
      siteDescription?: string | null;
      allowRegistration?: boolean | null;
    };
  };
}

// Parse import file and return available users
export async function POST(request: Request) {
  // Only allow when no users exist (fresh install)
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    return NextResponse.json({ error: 'Instance already initialized' }, { status: 403 });
  }

  try {
    const { action, data, selectedUserId, password } = await request.json();

    if (action === 'parse') {
      // Parse and return available users from import data
      const importData: ImportData = data;
      if (!importData.data?.users?.length) {
        return NextResponse.json({ error: 'No users found in import data' }, { status: 400 });
      }

      return NextResponse.json({
        users: importData.data.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
        })),
        hasSettings: !!importData.data.settings,
        hasPosts: (importData.data.posts?.length || 0) > 0,
        hasComments: (importData.data.comments?.length || 0) > 0,
      });
    }

    if (action === 'initialize') {
      const importData: ImportData = data;
      
      if (!selectedUserId || !password) {
        return NextResponse.json({ error: 'User and password required' }, { status: 400 });
      }

      const selectedUser = importData.data.users?.find(u => u.id === selectedUserId);
      if (!selectedUser) {
        return NextResponse.json({ error: 'Selected user not found' }, { status: 400 });
      }

      // Hash password using better-auth's internal method
      const ctx = await auth.api.signUpEmail({
        body: {
          email: selectedUser.email,
          password: password,
          name: selectedUser.name,
        },
        asResponse: false,
      });

      if (!ctx?.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      // Update user to admin and restore additional fields
      await db.update(users).set({
        role: 'admin',
        bio: selectedUser.bio,
        website: selectedUser.website,
      }).where(eq(users.email, selectedUser.email));

      // Import tags first
      if (importData.data.tags?.length) {
        for (const tag of importData.data.tags) {
          try {
            await db.insert(tags).values({
              id: tag.id,
              name: tag.name,
              slug: tag.slug,
            }).onConflictDoNothing();
          } catch { /* skip */ }
        }
      }

      // Import posts (update authorId to new user)
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
              authorId: ctx.user.id, // Use new user ID
              publishedAt: parseDate(post.publishedAt),
              createdAt: parseDate(post.createdAt) || new Date(),
              updatedAt: parseDate(post.updatedAt) || new Date(),
            }).onConflictDoNothing();
          } catch (e) { 
            console.error('Failed to import post:', post.slug, e);
          }
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
          } catch { /* skip */ }
        }
      }

      // Import comments
      if (importData.data.comments?.length) {
        for (const comment of importData.data.comments) {
          try {
            await db.insert(comments).values({
              id: comment.id,
              content: comment.content,
              postId: comment.postId,
              userId: comment.userId === selectedUserId ? ctx.user.id : null,
              parentId: comment.parentId,
              guestName: comment.guestName,
              guestEmail: comment.guestEmail,
              guestWebsite: comment.guestWebsite,
              status: comment.status,
              createdAt: parseDate(comment.createdAt) || new Date(),
            }).onConflictDoNothing();
          } catch { /* skip */ }
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
          } catch { /* skip */ }
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
          } catch { /* skip */ }
        }
      }

      // Import/update settings
      const settingsData = importData.data.settings || {};
      await db.insert(settings).values({
        id: 1,
        siteTitle: settingsData.siteTitle || 'My Awesome Blog',
        siteDescription: settingsData.siteDescription || '',
        allowRegistration: false,
      }).onConflictDoUpdate({
        target: settings.id,
        set: {
          siteTitle: settingsData.siteTitle || 'My Awesome Blog',
          siteDescription: settingsData.siteDescription || '',
          allowRegistration: false,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Init import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
