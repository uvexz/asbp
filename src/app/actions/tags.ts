'use server';

import { db } from '@/lib/db';
import { tags, postsTags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { tagSchema } from '@/lib/validations';
import { generateSlug } from '@/lib/server-utils';
import { getCachedTags, invalidateTagsCache } from '@/lib/cache-layer';

export type TagActionResult = 
  | { success: true }
  | { success: false; error: string };

export type CreateTagResult = 
  | { success: true; tag: { id: string; name: string; slug: string } }
  | { success: false; error: string };

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  return session;
}

/**
 * Get all tags with caching
 * Requirements: 8.1
 */
export async function getTags() {
  return getCachedTags();
}

/**
 * Get all tags without cache (for admin)
 */
export async function getTagsUncached() {
  const data = await db.query.tags.findMany({
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });
  return data;
}


/**
 * Create a new tag with auto-generated slug
 * Requirements: 8.2
 */
export async function createTag(formData: FormData): Promise<TagActionResult> {
  await requireAdmin();

  const name = formData.get('name') as string;

  // Validate input using tagSchema
  const validationResult = tagSchema.safeParse({ name });
  
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues
      .map(issue => issue.message)
      .join(', ');
    return { success: false, error: errorMessages };
  }

  const slug = generateSlug(validationResult.data.name);

  if (!slug) {
    return { success: false, error: '无法生成有效的slug，请使用包含字母或数字的标签名' };
  }

  try {
    await db.insert(tags).values({
      name: validationResult.data.name,
      slug,
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: '标签名或slug已存在' };
    }
    throw error;
  }

  invalidateTagsCache();
  revalidatePath('/admin/tags');
  return { success: true };
}

/**
 * Create a new tag and return the created tag data
 * Used by TagSelector component for inline tag creation
 */
export async function createTagInline(name: string): Promise<CreateTagResult> {
  await requireAdmin();

  // Validate input using tagSchema
  const validationResult = tagSchema.safeParse({ name });
  
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues
      .map(issue => issue.message)
      .join(', ');
    return { success: false, error: errorMessages };
  }

  const slug = generateSlug(validationResult.data.name);

  if (!slug) {
    return { success: false, error: '无法生成有效的slug，请使用包含字母或数字的标签名' };
  }

  try {
    const [newTag] = await db.insert(tags).values({
      name: validationResult.data.name,
      slug,
    }).returning();

    invalidateTagsCache();
    revalidatePath('/admin/tags');
    return { success: true, tag: newTag };
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: '标签名或slug已存在' };
    }
    throw error;
  }
}

/**
 * Update an existing tag
 */
export async function updateTag(id: string, name: string): Promise<TagActionResult> {
  await requireAdmin();

  // Validate input using tagSchema
  const validationResult = tagSchema.safeParse({ name });
  
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues
      .map(issue => issue.message)
      .join(', ');
    return { success: false, error: errorMessages };
  }

  const slug = generateSlug(validationResult.data.name);

  if (!slug) {
    return { success: false, error: '无法生成有效的slug，请使用包含字母或数字的标签名' };
  }

  try {
    await db.update(tags)
      .set({ name: validationResult.data.name, slug })
      .where(eq(tags.id, id));
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: '标签名或slug已存在' };
    }
    throw error;
  }

  invalidateTagsCache();
  revalidatePath('/admin/tags');
  revalidatePath('/');
  return { success: true };
}

/**
 * Delete a tag and cascade delete all post-tag associations
 * Requirements: 8.3
 */
export async function deleteTag(id: string): Promise<TagActionResult> {
  await requireAdmin();

  // First, delete all post-tag associations (cascade)
  await db.delete(postsTags).where(eq(postsTags.tagId, id));
  
  // Then delete the tag itself
  await db.delete(tags).where(eq(tags.id, id));

  invalidateTagsCache();
  revalidatePath('/admin/tags');
  return { success: true };
}

/**
 * Get tags for a specific post
 * Requirements: 8.4
 */
export async function getPostTags(postId: string) {
  const data = await db.query.postsTags.findMany({
    where: eq(postsTags.postId, postId),
    with: {
      tag: true,
    },
  });
  return data.map(pt => pt.tag);
}

/**
 * Update tags for a post (replace all existing associations)
 * Requirements: 8.4
 */
export async function updatePostTags(postId: string, tagIds: string[]): Promise<TagActionResult> {
  await requireAdmin();

  // Delete existing associations
  await db.delete(postsTags).where(eq(postsTags.postId, postId));

  // Insert new associations
  if (tagIds.length > 0) {
    await db.insert(postsTags).values(
      tagIds.map(tagId => ({
        postId,
        tagId,
      }))
    );
  }

  revalidatePath('/admin/posts');
  return { success: true };
}

/**
 * Get a tag by its slug
 * Requirements: 11.3
 */
export async function getTagBySlug(slug: string) {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  });
  return tag;
}

/**
 * Get published posts filtered by tag slug
 * Requirements: 11.3
 */
export async function getPostsByTag(tagSlug: string) {
  // First get the tag
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, tagSlug),
  });
  
  if (!tag) {
    return { tag: null, posts: [] };
  }
  
  // Get all post-tag associations for this tag
  const postTagAssociations = await db.query.postsTags.findMany({
    where: eq(postsTags.tagId, tag.id),
    with: {
      post: {
        with: {
          author: true,
          tags: {
            with: {
              tag: true,
            },
          },
        },
      },
    },
  });
  
  // Filter to only published posts and sort by date
  const publishedPosts = postTagAssociations
    .map(pt => pt.post)
    .filter(post => post.published === true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return { tag, posts: publishedPosts };
}
