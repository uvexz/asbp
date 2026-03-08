'use server';

import { db } from '@/lib/db';
import { tags, posts, postsTags } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { formatValidationIssues, tagSchema } from '@/lib/validations';
import { getTranslations } from 'next-intl/server';
import { generateSlug } from '@/lib/server-utils';
import { getCachedTags, getCachedPostsByTag, invalidatePostCache, invalidatePostsListCache, invalidateTagsCache, isPubliclyVisiblePost } from '@/lib/cache-layer';
import { getPublicPostRoutesByTagId, revalidatePublicPostList, revalidatePublicPostRoute, revalidateTagRoutes } from '@/lib/public-revalidation';

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
    const tErrors = await getTranslations('errors');
    throw new Error(tErrors('adminRequired'));
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

  const validationResult = tagSchema.safeParse({ name });

  if (!validationResult.success) {
    const tErrors = await getTranslations('errors');
    return { success: false, error: formatValidationIssues(validationResult.error.issues, tErrors) };
  }

  const slug = generateSlug(validationResult.data.name);

  if (!slug) {
    const tErrors = await getTranslations('errors');
    return { success: false, error: tErrors('invalidTagSlug') };
  }

  try {
    await db.insert(tags).values({
      name: validationResult.data.name,
      slug,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      const tErrors = await getTranslations('errors');
      return { success: false, error: tErrors('tagExists') };
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

  const validationResult = tagSchema.safeParse({ name });

  if (!validationResult.success) {
    const tErrors = await getTranslations('errors');
    return { success: false, error: formatValidationIssues(validationResult.error.issues, tErrors) };
  }

  const slug = generateSlug(validationResult.data.name);

  if (!slug) {
    const tErrors = await getTranslations('errors');
    return { success: false, error: tErrors('invalidTagSlug') };
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
    if (error instanceof Error && error.message.includes('unique')) {
      const tErrors = await getTranslations('errors');
      return { success: false, error: tErrors('tagExists') };
    }
    throw error;
  }
}

/**
 * Update an existing tag
 */
export async function updateTag(id: string, name: string): Promise<TagActionResult> {
  await requireAdmin();

  const validationResult = tagSchema.safeParse({ name });

  if (!validationResult.success) {
    const tErrors = await getTranslations('errors');
    return { success: false, error: formatValidationIssues(validationResult.error.issues, tErrors) };
  }

  const [existingTag, affectedPosts] = await Promise.all([
    db.query.tags.findFirst({
      where: eq(tags.id, id),
      columns: { slug: true },
    }),
    getPublicPostRoutesByTagId(id),
  ]);

  const slug = generateSlug(validationResult.data.name);

  if (!slug) {
    const tErrors = await getTranslations('errors');
    return { success: false, error: tErrors('invalidTagSlug') };
  }

  try {
    await db.update(tags)
      .set({ name: validationResult.data.name, slug })
      .where(eq(tags.id, id));
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      const tErrors = await getTranslations('errors');
      return { success: false, error: tErrors('tagExists') };
    }
    throw error;
  }

  invalidateTagsCache();
  invalidatePostsListCache();

  for (const post of affectedPosts) {
    if (isPubliclyVisiblePost(post)) {
      invalidatePostCache(post.slug);
    }
  }

  revalidatePath('/admin/tags');
  revalidatePublicPostList();
  revalidateTagRoutes([existingTag?.slug, slug]);

  for (const post of affectedPosts) {
    if (isPubliclyVisiblePost(post)) {
      revalidatePath(`/${post.slug}`);
    }
  }

  return { success: true };
}

/**
 * Delete a tag and cascade delete all post-tag associations
 * Requirements: 8.3
 */
export async function deleteTag(id: string): Promise<TagActionResult> {
  await requireAdmin();

  const [existingTag, affectedPosts] = await Promise.all([
    db.query.tags.findFirst({
      where: eq(tags.id, id),
      columns: { slug: true },
    }),
    getPublicPostRoutesByTagId(id),
  ]);

  await db.delete(postsTags).where(eq(postsTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));

  invalidateTagsCache();
  invalidatePostsListCache();

  for (const post of affectedPosts) {
    if (isPubliclyVisiblePost(post)) {
      invalidatePostCache(post.slug);
    }
  }

  revalidatePath('/admin/tags');
  revalidatePublicPostList();
  revalidateTagRoutes([existingTag?.slug]);

  for (const post of affectedPosts) {
    if (isPubliclyVisiblePost(post)) {
      revalidatePath(`/${post.slug}`);
    }
  }

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

  const [existingAssociations, postRecord] = await Promise.all([
    db.query.postsTags.findMany({
      where: eq(postsTags.postId, postId),
      columns: { tagId: true },
      with: {
        tag: {
          columns: { slug: true },
        },
      },
    }),
    db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { slug: true, postType: true, published: true },
    }),
  ]);

  await db.delete(postsTags).where(eq(postsTags.postId, postId));

  if (tagIds.length > 0) {
    await db.insert(postsTags).values(
      tagIds.map(tagId => ({
        postId,
        tagId,
      }))
    );
  }

  const newTags = tagIds.length > 0
    ? await db.query.tags.findMany({
        where: inArray(tags.id, tagIds),
        columns: { slug: true },
      })
    : [];

  invalidatePostsListCache();
  invalidateTagsCache();

  if (postRecord?.slug && isPubliclyVisiblePost(postRecord)) {
    invalidatePostCache(postRecord.slug);
    revalidatePublicPostRoute(postRecord.slug, postRecord.postType, postRecord.published);
  }

  const affectedTagSlugs = new Set([
    ...existingAssociations.map((association) => association.tag.slug),
    ...newTags.map((tag) => tag.slug),
  ]);

  revalidateTagRoutes(affectedTagSlugs);

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
  return getCachedPostsByTag(tagSlug);
}
