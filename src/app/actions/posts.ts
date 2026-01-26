'use server';

import { db } from '@/lib/db';
import { posts } from '@/db/schema';
import { desc, eq, count, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { postSchema } from '@/lib/validations';
import { 
  getCachedPostBySlug, 
  getCachedPublishedPosts,
  invalidatePostCache, 
  invalidatePostsListCache,
  invalidateAllPostCaches 
} from '@/lib/cache-layer';

export type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string };

export async function getPosts(page: number = 1, pageSize: number = 20, search?: string) {
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    // Build where condition for search
    const { ilike, or } = await import('drizzle-orm');
    const searchCondition = search?.trim() 
        ? or(
            ilike(posts.title, `%${search.trim()}%`),
            ilike(posts.content, `%${search.trim()}%`)
          )
        : undefined;

    const [totalResult] = await db
        .select({ count: count() })
        .from(posts)
        .where(searchCondition);
    
    const total = totalResult?.count ?? 0;
    const totalPages = Math.ceil(total / validPageSize);

    const data = await db.query.posts.findMany({
        where: searchCondition,
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
    // Ensure valid pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    // Get total count of published posts (only 'post' type)
    const [totalResult] = await db
        .select({ count: count() })
        .from(posts)
        .where(and(eq(posts.published, true), eq(posts.postType, 'post')));
    
    const total = totalResult?.count ?? 0;
    const totalPages = Math.ceil(total / validPageSize);

    // Get paginated posts (only 'post' type), ordered by publishedAt (fallback to createdAt)
    const data = await db.query.posts.findMany({
        where: and(eq(posts.published, true), eq(posts.postType, 'post')),
        orderBy: [desc(posts.publishedAt), desc(posts.createdAt)],
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
    };
}

/**
 * Get published memos for the /memo page with pagination
 */
export async function getPublishedMemos(
    page: number = 1,
    pageSize: number = 20
) {
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const [totalResult] = await db
        .select({ count: count() })
        .from(posts)
        .where(and(eq(posts.published, true), eq(posts.postType, 'memo')));
    
    const total = totalResult?.count ?? 0;
    const totalPages = Math.ceil(total / validPageSize);

    const data = await db.query.posts.findMany({
        where: and(eq(posts.published, true), eq(posts.postType, 'memo')),
        orderBy: [desc(posts.createdAt)],
        limit: validPageSize,
        offset: offset,
        with: {
            author: true,
        }
    });

    return {
        memos: data,
        total,
        totalPages,
    };
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
        throw new Error('Unauthorized');
    }

    let title = formData.get('title') as string;
    let slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const published = formData.get('published') === 'on';
    const postType = (formData.get('postType') as 'post' | 'page' | 'memo') || 'post';
    const tagIds = formData.getAll('tagIds') as string[];
    const publishedAtStr = formData.get('publishedAt') as string;
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : (published ? new Date() : null);

    // Auto-generate title/slug for memos if empty
    if (postType === 'memo' && (!title || !slug)) {
        const timestamp = Date.now();
        title = title || `memo-${timestamp}`;
        slug = slug || `memo-${timestamp}`;
    }

    // Validate input using postSchema
    const validationResult = postSchema.safeParse({ title, slug, content, published, publishedAt });
    
    if (!validationResult.success) {
        const errorMessages = validationResult.error.issues
            .map(issue => issue.message)
            .join(', ');
        return { success: false, error: errorMessages };
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

    // Add tags if any were selected (only for posts, not memos)
    if (tagIds.length > 0 && newPost && postType !== 'memo') {
        const { postsTags } = await import('@/db/schema');
        await db.insert(postsTags).values(
            tagIds.map(tagId => ({
                postId: newPost.id,
                tagId,
            }))
        );
    }

    // Invalidate caches
    invalidatePostsListCache();
    invalidatePostCache(validationResult.data.slug);
    
    revalidatePath('/');
    revalidatePath('/memo');
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
        throw new Error('Unauthorized');
    }

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const published = formData.get('published') === 'on';
    const postType = (formData.get('postType') as 'post' | 'page' | 'memo') || 'post';
    const publishedAtStr = formData.get('publishedAt') as string;
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : null;

    // Validate input using postSchema
    const validationResult = postSchema.safeParse({ title, slug, content, published, publishedAt });
    
    if (!validationResult.success) {
        const errorMessages = validationResult.error.issues
            .map(issue => issue.message)
            .join(', ');
        return { success: false, error: errorMessages };
    }

    // Get old slug before update for cache invalidation
    const oldPost = await db.query.posts.findFirst({
        where: eq(posts.id, id),
        columns: { slug: true }
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

    // Invalidate caches (both old and new slug if changed)
    invalidatePostsListCache();
    invalidatePostCache(validationResult.data.slug);
    if (oldPost && oldPost.slug !== validationResult.data.slug) {
        invalidatePostCache(oldPost.slug);
    }

    revalidatePath('/admin/posts');
    revalidatePath('/memo');
    revalidatePath(`/admin/posts/edit?id=${id}`);
    redirect('/admin/posts');
}

export async function deletePost(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    // Get slug before deletion for cache invalidation
    const post = await db.query.posts.findFirst({
        where: eq(posts.id, id),
        columns: { slug: true }
    });

    // 级联删除关联数据
    const { postsTags, comments } = await import('@/db/schema');
    await db.delete(postsTags).where(eq(postsTags.postId, id));
    await db.delete(comments).where(eq(comments.postId, id));
    
    // 删除文章
    await db.delete(posts).where(eq(posts.id, id));
    
    // Invalidate caches
    invalidatePostsListCache();
    if (post) {
        invalidatePostCache(post.slug);
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

    if (!session || session.user.role !== 'admin') {
        return { success: false, error: '需要管理员权限' };
    }

    if (!content.trim()) {
        return { success: false, error: '内容不能为空' };
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
    revalidatePath('/memo');
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

    if (!session || session.user.role !== 'admin') {
        return { success: false, error: '需要管理员权限' };
    }

    if (!content.trim()) {
        return { success: false, error: '内容不能为空' };
    }

    // Verify the memo exists and is a memo type
    const memo = await db.query.posts.findFirst({
        where: and(eq(posts.id, id), eq(posts.postType, 'memo')),
    });

    if (!memo) {
        return { success: false, error: '随笔不存在' };
    }

    await db.update(posts)
        .set({ 
            content: content.trim(),
            updatedAt: new Date() 
        })
        .where(eq(posts.id, id));

    invalidatePostsListCache();
    revalidatePath('/memo');
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

    if (!session || session.user.role !== 'admin') {
        return { success: false, error: '需要管理员权限' };
    }

    // Verify the memo exists and is a memo type
    const memo = await db.query.posts.findFirst({
        where: and(eq(posts.id, id), eq(posts.postType, 'memo')),
    });

    if (!memo) {
        return { success: false, error: '随笔不存在' };
    }

    await db.delete(posts).where(eq(posts.id, id));

    invalidatePostsListCache();
    revalidatePath('/memo');
    revalidatePath('/admin/posts');
    return { success: true };
}
