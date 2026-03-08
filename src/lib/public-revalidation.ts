import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { posts, postsTags, tags } from '@/db/schema';

type PublicPostType = 'post' | 'page' | 'memo' | null | undefined;
type PublicPublishedState = boolean | null | undefined;

function hasPublicSlugRoute(
  postType: PublicPostType,
  published: PublicPublishedState,
) {
  return published === true && (postType === 'post' || postType === 'page');
}

function showsOnPublicPostList(
  postType: PublicPostType,
  published: PublicPublishedState,
) {
  return published === true && postType === 'post';
}

function showsOnPublicMemoList(
  postType: PublicPostType,
  published: PublicPublishedState,
) {
  return published === true && postType === 'memo';
}

function showsOnPublicTagPages(
  postType: PublicPostType,
  published: PublicPublishedState,
) {
  return published === true && postType === 'post';
}

export function revalidatePublicPostList() {
  revalidatePath('/');
}

export function revalidatePublicMemoList() {
  revalidatePath('/memo');
}

export function revalidatePublicShell() {
  revalidatePath('/', 'layout');
}

export function revalidatePublicPostRoute(
  slug: string | null | undefined,
  postType: PublicPostType,
  published: PublicPublishedState,
) {
  if (slug && hasPublicSlugRoute(postType, published)) {
    revalidatePath(`/${slug}`);
  }
}

export function revalidateTagRoutes(tagSlugs: Iterable<string | null | undefined>) {
  for (const tagSlug of new Set([...tagSlugs].filter((slug): slug is string => !!slug))) {
    revalidatePath(`/tag/${tagSlug}`);
  }
}

interface RevalidatePublicPostMutationOptions {
  slug?: string | null;
  previousSlug?: string | null;
  postType?: PublicPostType;
  previousPostType?: PublicPostType;
  published?: PublicPublishedState;
  previousPublished?: PublicPublishedState;
  tagSlugs?: Iterable<string | null | undefined>;
}

export function revalidatePublicPostMutation({
  slug,
  previousSlug,
  postType,
  previousPostType,
  published,
  previousPublished,
  tagSlugs = [],
}: RevalidatePublicPostMutationOptions) {
  if (
    showsOnPublicPostList(postType, published) ||
    showsOnPublicPostList(previousPostType, previousPublished)
  ) {
    revalidatePublicPostList();
  }

  if (
    showsOnPublicMemoList(postType, published) ||
    showsOnPublicMemoList(previousPostType, previousPublished)
  ) {
    revalidatePublicMemoList();
  }

  revalidatePublicPostRoute(slug, postType, published);

  if (previousSlug && previousSlug !== slug) {
    revalidatePublicPostRoute(previousSlug, previousPostType, previousPublished);
  }

  if (
    showsOnPublicTagPages(postType, published) ||
    showsOnPublicTagPages(previousPostType, previousPublished)
  ) {
    revalidateTagRoutes(tagSlugs);
  }
}

export async function getPostTagSlugs(postId: string) {
  const postTags = await db.query.postsTags.findMany({
    where: eq(postsTags.postId, postId),
    columns: {},
    with: {
      tag: {
        columns: { slug: true },
      },
    },
  });

  return postTags.map((postTag) => postTag.tag.slug);
}

export async function getPublicPostRouteById(postId: string) {
  return db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: {
      slug: true,
      postType: true,
      published: true,
    },
  });
}

export async function revalidatePublicPostRouteById(postId: string) {
  const post = await getPublicPostRouteById(postId);

  if (post) {
    revalidatePublicPostRoute(post.slug, post.postType, post.published);
  }
}

export async function getTagSlugsByIds(tagIds: string[]) {
  if (tagIds.length === 0) {
    return [];
  }

  const tagRows = await db.query.tags.findMany({
    where: inArray(tags.id, tagIds),
    columns: { slug: true },
  });

  return tagRows.map((tag) => tag.slug);
}

export async function getPublicPostRoutesByTagId(tagId: string) {
  const postRoutes = await db.query.postsTags.findMany({
    where: eq(postsTags.tagId, tagId),
    columns: {},
    with: {
      post: {
        columns: {
          slug: true,
          postType: true,
          published: true,
        },
      },
    },
  });

  return postRoutes.map((postRoute) => postRoute.post);
}
