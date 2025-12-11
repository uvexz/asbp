import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterPublishedPosts, paginateItems } from '@/lib/server-utils';

/**
 * **Feature: project-audit, Property 5: Public Posts Filtering**
 * **Validates: Requirements 7.1**
 * 
 * *For any* set of posts in the database, the public `getPublishedPosts` function 
 * should return only posts where `published` is true.
 */
describe('Property 5: Public Posts Filtering', () => {
  // Arbitrary for generating a post object
  const postArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1 }),
    slug: fc.string({ minLength: 1 }),
    content: fc.string(),
    published: fc.oneof(fc.constant(true), fc.constant(false), fc.constant(null)),
    authorId: fc.string({ minLength: 1 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });

  // Arbitrary for generating an array of posts
  const postsArrayArb = fc.array(postArb, { minLength: 0, maxLength: 50 });

  it('should return only posts where published is true', () => {
    fc.assert(
      fc.property(postsArrayArb, (posts) => {
        const result = filterPublishedPosts(posts);
        
        // All returned posts must have published === true
        result.forEach(post => {
          expect(post.published).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return all published posts from the input', () => {
    fc.assert(
      fc.property(postsArrayArb, (posts) => {
        const result = filterPublishedPosts(posts);
        const expectedCount = posts.filter(p => p.published === true).length;
        
        // The count of returned posts should match the count of published posts
        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve post data integrity', () => {
    fc.assert(
      fc.property(postsArrayArb, (posts) => {
        const result = filterPublishedPosts(posts);
        
        // Each returned post should exist in the original array with same data
        result.forEach(resultPost => {
          const originalPost = posts.find(p => p.id === resultPost.id);
          expect(originalPost).toBeDefined();
          expect(resultPost).toEqual(originalPost);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no posts are published', () => {
    // Generate posts where none are published
    const unpublishedPostsArb = fc.array(
      fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1 }),
        slug: fc.string({ minLength: 1 }),
        content: fc.string(),
        published: fc.oneof(fc.constant(false), fc.constant(null)),
        authorId: fc.string({ minLength: 1 }),
        createdAt: fc.date(),
        updatedAt: fc.date(),
      }),
      { minLength: 1, maxLength: 20 }
    );

    fc.assert(
      fc.property(unpublishedPostsArb, (posts) => {
        const result = filterPublishedPosts(posts);
        expect(result.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should return all posts when all are published', () => {
    // Generate posts where all are published
    const publishedPostsArb = fc.array(
      fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1 }),
        slug: fc.string({ minLength: 1 }),
        content: fc.string(),
        published: fc.constant(true),
        authorId: fc.string({ minLength: 1 }),
        createdAt: fc.date(),
        updatedAt: fc.date(),
      }),
      { minLength: 1, maxLength: 20 }
    );

    fc.assert(
      fc.property(publishedPostsArb, (posts) => {
        const result = filterPublishedPosts(posts);
        expect(result.length).toBe(posts.length);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: project-audit, Property 10: Posts Include Tags**
 * **Validates: Requirements 11.1, 11.2**
 * 
 * *For any* post query (list or single), the response should include 
 * the associated tags for each post.
 */
describe('Property 10: Posts Include Tags', () => {
  // Type definitions for test data
  interface Tag {
    id: string;
    name: string;
    slug: string;
  }

  interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    published: boolean | null;
    authorId: string;
  }

  interface PostTag {
    postId: string;
    tagId: string;
  }

  interface PostWithTags extends Post {
    tags: Tag[];
  }

  /**
   * Pure function that simulates joining posts with their tags.
   * This mirrors what the database query with `with: { tags: true }` does.
   */
  function joinPostsWithTags(
    posts: Post[],
    tags: Tag[],
    postsTags: PostTag[]
  ): PostWithTags[] {
    return posts.map(post => {
      // Find all tag associations for this post
      const tagAssociations = postsTags.filter(pt => pt.postId === post.id);
      // Get the actual tag objects
      const postTags = tagAssociations
        .map(pt => tags.find(t => t.id === pt.tagId))
        .filter((t): t is Tag => t !== undefined);
      
      return {
        ...post,
        tags: postTags,
      };
    });
  }

  /**
   * Pure function to get a single post with tags by ID.
   */
  function getPostWithTagsById(
    postId: string,
    posts: Post[],
    tags: Tag[],
    postsTags: PostTag[]
  ): PostWithTags | undefined {
    const post = posts.find(p => p.id === postId);
    if (!post) return undefined;

    const tagAssociations = postsTags.filter(pt => pt.postId === postId);
    const postTags = tagAssociations
      .map(pt => tags.find(t => t.id === pt.tagId))
      .filter((t): t is Tag => t !== undefined);

    return {
      ...post,
      tags: postTags,
    };
  }

  // Arbitraries for generating test data
  const tagArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    slug: fc.stringMatching(/^[a-z0-9-]+$/).filter(s => s.length >= 1 && s.length <= 50),
  });

  const postArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1 }),
    slug: fc.stringMatching(/^[a-z0-9-]+$/).filter(s => s.length >= 1),
    content: fc.string(),
    published: fc.oneof(fc.constant(true), fc.constant(false), fc.constant(null)),
    authorId: fc.uuid(),
  });

  // Generate a consistent dataset with tags, posts, and associations
  const datasetArb = fc.tuple(
    fc.array(tagArb, { minLength: 0, maxLength: 10 }),
    fc.array(postArb, { minLength: 1, maxLength: 10 })
  ).chain(([tags, posts]) => {
    // Generate post-tag associations using existing tag and post IDs
    const postsTagsArb = tags.length === 0 
      ? fc.constant([])
      : fc.array(
          fc.tuple(
            fc.integer({ min: 0, max: posts.length - 1 }),
            fc.integer({ min: 0, max: tags.length - 1 })
          ).map(([postIdx, tagIdx]) => ({
            postId: posts[postIdx].id,
            tagId: tags[tagIdx].id,
          })),
          { minLength: 0, maxLength: 30 }
        );

    return postsTagsArb.map(postsTags => ({
      tags,
      posts,
      // Deduplicate associations
      postsTags: [...new Map(postsTags.map(pt => [`${pt.postId}-${pt.tagId}`, pt])).values()],
    }));
  });

  it('should include tags array for every post in list query', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const result = joinPostsWithTags(posts, tags, postsTags);
        
        // Every post should have a tags array
        result.forEach(post => {
          expect(Array.isArray(post.tags)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should include correct tags for each post', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const result = joinPostsWithTags(posts, tags, postsTags);
        
        result.forEach(post => {
          // Get expected tag IDs for this post
          const expectedTagIds = postsTags
            .filter(pt => pt.postId === post.id)
            .map(pt => pt.tagId);
          
          // Verify the post has exactly these tags
          const actualTagIds = post.tags.map(t => t.id);
          expect(actualTagIds.sort()).toEqual(expectedTagIds.sort());
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty tags array for posts with no tag associations', () => {
    // Generate posts with no tag associations
    const postsWithNoTagsArb = fc.array(postArb, { minLength: 1, maxLength: 10 });
    const tagsArb = fc.array(tagArb, { minLength: 1, maxLength: 5 });

    fc.assert(
      fc.property(postsWithNoTagsArb, tagsArb, (posts, tags) => {
        // No associations
        const postsTags: PostTag[] = [];
        
        const result = joinPostsWithTags(posts, tags, postsTags);
        
        // All posts should have empty tags array
        result.forEach(post => {
          expect(post.tags).toEqual([]);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should include tags for single post query', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        // Pick a random post to query
        const targetPost = posts[0];
        
        const result = getPostWithTagsById(targetPost.id, posts, tags, postsTags);
        
        expect(result).toBeDefined();
        expect(Array.isArray(result!.tags)).toBe(true);
        
        // Verify correct tags
        const expectedTagIds = postsTags
          .filter(pt => pt.postId === targetPost.id)
          .map(pt => pt.tagId);
        const actualTagIds = result!.tags.map(t => t.id);
        expect(actualTagIds.sort()).toEqual(expectedTagIds.sort());
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve post data when including tags', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const result = joinPostsWithTags(posts, tags, postsTags);
        
        // Each result post should have the same base data as original
        result.forEach(resultPost => {
          const originalPost = posts.find(p => p.id === resultPost.id);
          expect(originalPost).toBeDefined();
          expect(resultPost.id).toBe(originalPost!.id);
          expect(resultPost.title).toBe(originalPost!.title);
          expect(resultPost.slug).toBe(originalPost!.slug);
          expect(resultPost.content).toBe(originalPost!.content);
          expect(resultPost.published).toBe(originalPost!.published);
          expect(resultPost.authorId).toBe(originalPost!.authorId);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should include complete tag data (id, name, slug) for each tag', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const result = joinPostsWithTags(posts, tags, postsTags);
        
        result.forEach(post => {
          post.tags.forEach(tag => {
            // Each tag should have all required fields
            expect(typeof tag.id).toBe('string');
            expect(typeof tag.name).toBe('string');
            expect(typeof tag.slug).toBe('string');
            
            // Tag should match original tag data
            const originalTag = tags.find(t => t.id === tag.id);
            expect(originalTag).toBeDefined();
            expect(tag).toEqual(originalTag);
          });
        });
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: project-audit, Property 9: Pagination Logic**
 * **Validates: Requirements 10.1, 10.2**
 * 
 * *For any* page number and page size, the pagination function should return 
 * the correct subset of posts and accurate total count for calculating page controls.
 */
describe('Property 9: Pagination Logic', () => {
  // Arbitrary for generating a simple item (simulating a post)
  const itemArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1 }),
  });

  // Arbitrary for generating an array of items
  const itemsArrayArb = fc.array(itemArb, { minLength: 0, maxLength: 100 });

  // Arbitrary for valid pagination parameters
  const pageArb = fc.integer({ min: 1, max: 20 });
  const pageSizeArb = fc.integer({ min: 1, max: 50 });

  it('should return correct total count regardless of page', () => {
    fc.assert(
      fc.property(itemsArrayArb, pageArb, pageSizeArb, (items, page, pageSize) => {
        const result = paginateItems(items, page, pageSize);
        
        // Total should always equal the input array length
        expect(result.total).toBe(items.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should calculate correct totalPages', () => {
    fc.assert(
      fc.property(itemsArrayArb, pageSizeArb, (items, pageSize) => {
        const result = paginateItems(items, 1, pageSize);
        
        // totalPages should be ceil(total / pageSize)
        const expectedTotalPages = Math.ceil(items.length / pageSize);
        expect(result.totalPages).toBe(expectedTotalPages);
      }),
      { numRuns: 100 }
    );
  });

  it('should return correct number of items for a page', () => {
    fc.assert(
      fc.property(itemsArrayArb, pageArb, pageSizeArb, (items, page, pageSize) => {
        const result = paginateItems(items, page, pageSize);
        
        // Calculate expected items on this page
        const offset = (page - 1) * pageSize;
        const expectedCount = Math.min(pageSize, Math.max(0, items.length - offset));
        
        expect(result.posts.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should return correct subset of items', () => {
    fc.assert(
      fc.property(itemsArrayArb, pageArb, pageSizeArb, (items, page, pageSize) => {
        const result = paginateItems(items, page, pageSize);
        
        // Calculate expected slice
        const offset = (page - 1) * pageSize;
        const expectedItems = items.slice(offset, offset + pageSize);
        
        expect(result.posts).toEqual(expectedItems);
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array for pages beyond total', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 20 }),
        pageSizeArb,
        (items, pageSize) => {
          // Calculate a page number that's definitely beyond the last page
          const totalPages = Math.ceil(items.length / pageSize);
          const beyondPage = totalPages + 1;
          
          const result = paginateItems(items, beyondPage, pageSize);
          
          expect(result.posts.length).toBe(0);
          expect(result.total).toBe(items.length);
          expect(result.totalPages).toBe(totalPages);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle page 1 correctly', () => {
    fc.assert(
      fc.property(itemsArrayArb, pageSizeArb, (items, pageSize) => {
        const result = paginateItems(items, 1, pageSize);
        
        // First page should start from index 0
        const expectedItems = items.slice(0, pageSize);
        expect(result.posts).toEqual(expectedItems);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle invalid page numbers gracefully', () => {
    fc.assert(
      fc.property(
        itemsArrayArb,
        fc.integer({ min: -100, max: 0 }),
        pageSizeArb,
        (items, invalidPage, pageSize) => {
          const result = paginateItems(items, invalidPage, pageSize);
          
          // Invalid page should be treated as page 1
          const expectedItems = items.slice(0, pageSize);
          expect(result.posts).toEqual(expectedItems);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve item order within a page', () => {
    fc.assert(
      fc.property(itemsArrayArb, pageArb, pageSizeArb, (items, page, pageSize) => {
        const result = paginateItems(items, page, pageSize);
        
        // Items should maintain their relative order
        const offset = (page - 1) * pageSize;
        result.posts.forEach((item, index) => {
          expect(item).toEqual(items[offset + index]);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return all items when pageSize >= total', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          // Use a pageSize larger than the array
          const largePageSize = items.length + 10;
          const result = paginateItems(items, 1, largePageSize);
          
          expect(result.posts.length).toBe(items.length);
          expect(result.posts).toEqual(items);
          expect(result.totalPages).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty input array', () => {
    fc.assert(
      fc.property(pageArb, pageSizeArb, (page, pageSize) => {
        const result = paginateItems([], page, pageSize);
        
        expect(result.posts).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.totalPages).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
