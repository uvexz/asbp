'use server';

import { db } from '@/lib/db';
import { posts } from '@/db/schema';
import { eq, and, or, ilike, desc } from 'drizzle-orm';

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  postType: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

/**
 * Search published posts by title and content
 * Uses PostgreSQL ILIKE for case-insensitive search
 */
export async function searchPosts(query: string, limit: number = 10): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const results = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      postType: posts.postType,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.published, true),
        or(
          ilike(posts.title, searchTerm),
          ilike(posts.content, searchTerm)
        )
      )
    )
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(limit);

  // Generate excerpts
  return results.map((post) => {
    let excerpt = '';
    const lowerQuery = query.toLowerCase();
    const lowerContent = post.content.toLowerCase();
    const matchIndex = lowerContent.indexOf(lowerQuery);

    if (matchIndex !== -1) {
      // Extract context around the match
      const start = Math.max(0, matchIndex - 50);
      const end = Math.min(post.content.length, matchIndex + query.length + 100);
      excerpt = (start > 0 ? '...' : '') + 
                post.content.slice(start, end).replace(/\n+/g, ' ').trim() + 
                (end < post.content.length ? '...' : '');
    } else {
      // No match in content, use beginning
      excerpt = post.content.slice(0, 150).replace(/\n+/g, ' ').trim() + 
                (post.content.length > 150 ? '...' : '');
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt,
      postType: post.postType,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
    };
  });
}
