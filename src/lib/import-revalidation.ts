import { revalidatePath } from 'next/cache';
import { inArray } from 'drizzle-orm';
import { posts } from '@/db/schema';
import { db } from '@/lib/db';
import {
  invalidateCommentsCache,
  invalidateNavigationCache,
  invalidatePostCache,
  invalidatePostsListCache,
  invalidateSettingsCache,
  invalidateTagsCache,
} from '@/lib/cache-layer';

interface ImportedPostLike {
  id: string;
  slug: string;
}

interface ImportedCommentLike {
  postId: string;
}

interface ImportedTagLike {
  slug: string;
}

interface RevalidateImportedContentOptions {
  posts?: ImportedPostLike[];
  comments?: ImportedCommentLike[];
  tags?: ImportedTagLike[];
  navItemsImported?: boolean;
  settingsImported?: boolean;
}

export async function revalidateImportedContent({
  posts: importedPosts = [],
  comments = [],
  tags = [],
  navItemsImported = false,
  settingsImported = false,
}: RevalidateImportedContentOptions) {
  if (settingsImported) {
    invalidateSettingsCache();
    revalidatePath('/admin/settings');
  }

  if (navItemsImported) {
    invalidateNavigationCache();
    revalidatePath('/admin/navigation');
  }

  if (settingsImported || navItemsImported) {
    revalidatePath('/', 'layout');
  }

  if (importedPosts.length > 0 || tags.length > 0) {
    invalidatePostsListCache();
    invalidateTagsCache();
    revalidatePath('/');
    revalidatePath('/memo');
    revalidatePath('/admin/posts');
  }

  for (const post of importedPosts) {
    invalidatePostCache(post.slug);
    revalidatePath(`/${post.slug}`);
  }

  for (const tag of tags) {
    revalidatePath(`/tag/${tag.slug}`);
  }

  const commentPostIds = [...new Set(comments.map((comment) => comment.postId))];
  for (const postId of commentPostIds) {
    invalidateCommentsCache(postId);
  }

  if (commentPostIds.length > 0) {
    const importedPostSlugs = new Map(importedPosts.map((post) => [post.id, post.slug]));
    const missingPostIds = commentPostIds.filter((postId) => !importedPostSlugs.has(postId));

    if (missingPostIds.length > 0) {
      const existingPosts = await db.query.posts.findMany({
        where: inArray(posts.id, missingPostIds),
        columns: { id: true, slug: true },
      });

      for (const post of existingPosts) {
        importedPostSlugs.set(post.id, post.slug);
      }
    }

    for (const postId of commentPostIds) {
      const slug = importedPostSlugs.get(postId);
      if (slug) {
        revalidatePath(`/${slug}`);
      }
    }
  }

  if (comments.length > 0) {
    revalidatePath('/admin/comments');
  }
}
