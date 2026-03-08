'use server';

import { db } from '@/lib/db';
import { posts } from '@/db/schema';
import { desc, eq, count, and, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { formatValidationIssues, postSchema } from '@/lib/validations';
import { getTranslations } from 'next-intl/server';
import {
  getCachedPostBySlug,
  getCachedPublishedPosts,
  getCachedPublishedMemos,
  invalidatePostCache,
  invalidatePostsListCache,
  isPubliclyVisiblePost,
} from '@/lib/cache-layer';
import {
  getPostTagSlugs,
  getTagSlugsByIds,
  revalidatePublicPostMutation,
} from '@/lib/public-revalidation';

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function getPosts(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    postType?: 'post' | 'page' | 'memo'
) {
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const trimmedSearch = search?.trim();

    const searchCondition = trimmedSearch
        ? or(
            ilike(posts.title, `%${trimmedSearch}%`),
            ilike(posts.content, `%${trimmedSearch}%`)
        )
        : undefined;

    const typeCondition = postType
        ? eq(posts.postType, postType)
        : undefined;

    const whereCondition = searchCondition && typeCondition
        ? and(searchCondition, typeCondition)
        : searchCondition || typeCondition;

    const [totalResult] = await db
        .select({ count: count() })
        .from(posts)
        .where(whereCondition);

    const total = totalResult?.count ?? 0;
    const totalPages = Math.ceil(total / validPageSize);

    const data = await db.query.posts.findMany({
        where: whereCondition,
        orderBy: [desc(posts.createdAt)],
        limit: validPageSize,
        offset: offset,
        with: {
            author: true,
            tags: {
                with: {
                    tag: true,
                },
            },
        }
    });

    return {
        posts: data,
        total,
        totalPages,
        currentPage: validPage,
    };
}

/**
 * Get only published posts for public pages with pagination support
 * Filters posts where published === true and postType === 'post'
 * @param page - Page number (1-indexed), defaults to 1
 * @param pageSize - Number of posts per page, defaults to 10
 */
export async function getPublishedPosts(
    page: number = 1,
    pageSize: number = 10
) {
    return getCachedPublishedPosts(page, pageSize);
}

/**
 * Get published memos for the /memo page with pagination
 */
export async function getPublishedMemos(
    page: number = 1,
    pageSize: number = 20
) {
    return getCachedPublishedMemos(page, pageSize);
}

/**
 * Type definition for a post object
 */
export type Post = {
    id: string;
    title: string;
    slug: string;
    content: string;
    published: boolean | null;
    postType: 'post' | 'page' | 'memo' | null;
    authorId: string;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Get post by slug with caching
 */
export async function getPostBySlug(slug: string) {
    return getCachedPostBySlug(slug);
}

/**
 * Get post by slug without cache (for admin editing)
 */
export async function getPostBySlugUncached(slug: string) {
    const post = await db.query.posts.findFirst({
        where: eq(posts.slug, slug),
        with: {
            author: true,
            tags: {
                with: {
                    tag: true,
                },
            },
        }
    });
    return post;
}

export async function createPost(formData: FormData): Promise<ActionResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        const tErrors = await getTranslations('errors');
        throw new Error(tErrors('adminRequired'));
    }

    let title = formData.get('title') as string;
    let slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const published = formData.get('published') === 'on';
    const postType = (formData.get('postType') as 'post' | 'page' | 'memo') || 'post';
    const tagIds = formData.getAll('tagIds') as string[];
    const publishedAtStr = formData.get('publishedAt') as string;
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : (published ? new Date() : null);

    if (postType === 'memo' && (!title || !slug)) {
        const timestamp = Date.now();
        title = title || `memo-${timestamp}`;
        slug = slug || `memo-${timestamp}`;
    }

    const validationResult = postSchema.safeParse({ title, slug, content, published, publishedAt });

    if (!validationResult.success) {
        const tErrors = await getTranslations('errors');
        return { success: false, error: formatValidationIssues(validationResult.error.issues, tErrors) };
    }

    const authorId = session.user.id;

    const [newPost] = await db.insert(posts).values({
        title: validationResult.data.title,
        slug: validationResult.data.slug,
        content: validationResult.data.content,
        authorId,
        published: validationResult.data.published,
        postType,
        publishedAt: validationResult.data.publishedAt,
    }).returning({ id: posts.id });

    if (tagIds.length > 0 && newPost && postType !== 'memo') {
        const { postsTags } = await import('@/db/schema');
        await db.insert(postsTags).values(
            tagIds.map(tagId => ({
                postId: newPost.id,
                tagId,
            }))
        );
    }

    invalidatePostsListCache();
    if (isPubliclyVisiblePost({ published: validationResult.data.published, postType })) {
        invalidatePostCache(validationResult.data.slug);
    }

    const publicTagSlugs = postType === 'memo' ? [] : await getTagSlugsByIds(tagIds);
    revalidatePublicPostMutation({
        slug: validationResult.data.slug,
        postType,
        published: validationResult.data.published,
        tagSlugs: publicTagSlugs,
    });

    revalidatePath('/admin/posts');
    redirect('/admin/posts');
}


export async function getPostById(id: string) {
    const post = await db.query.posts.findFirst({
        where: eq(posts.id, id),
    });
    return post;
}

export async function updatePost(id: string, formData: FormData): Promise<ActionResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        const tErrors = await getTranslations('errors');
        throw new Error(tErrors('adminRequired'));
    }

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const published = formData.get('published') === 'on';
    const postType = (formData.get('postType') as 'post' | 'page' | 'memo') || 'post';
    const publishedAtStr = formData.get('publishedAt') as string;
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : null;

    const validationResult = postSchema.safeParse({ title, slug, content, published, publishedAt });

    if (!validationResult.success) {
        const tErrors = await getTranslations('errors');
        return { success: false, error: formatValidationIssues(validationResult.error.issues, tErrors) };
    }

    const existingPost = await db.query.posts.findFirst({
        where: eq(posts.id, id),
        columns: { slug: true, postType: true, published: true }
    });

    await db.update(posts)
        .set({
            title: validationResult.data.title,
            slug: validationResult.data.slug,
            content: validationResult.data.content,
            published: validationResult.data.published,
            postType,
            publishedAt: validationResult.data.publishedAt,
            updatedAt: new Date()
        })
        .where(eq(posts.id, id));

    invalidatePostsListCache();
    if (isPubliclyVisiblePost({ published: validationResult.data.published, postType })) {
        invalidatePostCache(validationResult.data.slug);
    }
    if (
        existingPost &&
        existingPost.slug !== validationResult.data.slug &&
        isPubliclyVisiblePost(existingPost)
    ) {
        invalidatePostCache(existingPost.slug);
    }

    const affectedTagSlugs = postType === 'memo' && existingPost?.postType === 'memo'
        ? []
        : await getPostTagSlugs(id);

    revalidatePublicPostMutation({
        slug: validationResult.data.slug,
        previousSlug: existingPost?.slug,
        postType,
        previousPostType: existingPost?.postType,
        published: validationResult.data.published,
        previousPublished: existingPost?.published,
        tagSlugs: affectedTagSlugs,
    });

    revalidatePath('/admin/posts');
    revalidatePath(`/admin/posts/edit?id=${id}`);
    redirect('/admin/posts');
}

export async function deletePost(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        const tErrors = await getTranslations('errors');
        throw new Error(tErrors('adminRequired'));
    }

    const post = await db.query.posts.findFirst({
        where: eq(posts.id, id),
        columns: { slug: true, postType: true, published: true }
    });
    const tagSlugs = post && post.postType !== 'memo' ? await getPostTagSlugs(id) : [];

    const { postsTags, comments } = await import('@/db/schema');
    await db.delete(postsTags).where(eq(postsTags.postId, id));
    await db.delete(comments).where(eq(comments.postId, id));

    await db.delete(posts).where(eq(posts.id, id));

    invalidatePostsListCache();
    if (post) {
        if (isPubliclyVisiblePost(post)) {
            invalidatePostCache(post.slug);
        }
        revalidatePublicPostMutation({
            previousSlug: post.slug,
            previousPostType: post.postType,
            previousPublished: post.published,
            tagSlugs,
        });
    }

    revalidatePath('/admin/posts');
    revalidatePath('/admin/comments');
}

/**
 * Quick create a memo from the frontend
 * Requires admin role
 */
export async function createQuickMemo(content: string): Promise<ActionResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const tErrors = await getTranslations('errors');

    if (!session || session.user.role !== 'admin') {
        return { success: false, error: tErrors('adminRequired') };
    }

    if (!content.trim()) {
        return { success: false, error: tErrors('contentRequired') };
    }

    const timestamp = Date.now();
    const title = `memo-${timestamp}`;
    const slug = `memo-${timestamp}`;

    await db.insert(posts).values({
        title,
        slug,
        content: content.trim(),
        authorId: session.user.id,
        published: true,
        postType: 'memo',
        publishedAt: new Date(),
    });

    invalidatePostsListCache();
    revalidatePublicPostMutation({
        slug,
        postType: 'memo',
        published: true,
    });
    revalidatePath('/admin/posts');
    return { success: true };
}

/**
 * Update a memo from the frontend
 * Requires admin role
 */
export async function updateMemo(id: string, content: string): Promise<ActionResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const tErrors = await getTranslations('errors');

    if (!session || session.user.role !== 'admin') {
        return { success: false, error: tErrors('adminRequired') };
    }

    if (!content.trim()) {
        return { success: false, error: tErrors('contentRequired') };
    }

    const memo = await db.query.posts.findFirst({
        where: and(eq(posts.id, id), eq(posts.postType, 'memo')),
        columns: { slug: true, postType: true },
    });

    if (!memo) {
        return { success: false, error: tErrors('memoNotFound') };
    }

    await db.update(posts)
        .set({
            content: content.trim(),
            updatedAt: new Date()
        })
        .where(eq(posts.id, id));

    invalidatePostsListCache();
    revalidatePublicPostMutation({
        slug: memo.slug,
        postType: memo.postType,
        published: true,
    });
    revalidatePath('/admin/posts');
    return { success: true };
}

/**
 * Delete a memo from the frontend
 * Requires admin role
 */
export async function deleteMemo(id: string): Promise<ActionResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const tErrors = await getTranslations('errors');

    if (!session || session.user.role !== 'admin') {
        return { success: false, error: tErrors('adminRequired') };
    }

    const memo = await db.query.posts.findFirst({
        where: and(eq(posts.id, id), eq(posts.postType, 'memo')),
        columns: { slug: true, postType: true },
    });

    if (!memo) {
        return { success: false, error: tErrors('memoNotFound') };
    }

    await db.delete(posts).where(eq(posts.id, id));

    invalidatePostsListCache();
    revalidatePublicPostMutation({
        previousSlug: memo.slug,
        previousPostType: memo.postType,
        previousPublished: true,
    });
    revalidatePath('/admin/posts');
    return { success: true };
}
