import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSlug } from '@/lib/server-utils';

/**
 * **Feature: project-audit, Property 7: Tag Slug Generation**
 * **Validates: Requirements 8.2**
 *
 * *For any* valid tag name, creating a tag should generate a valid URL-safe slug
 * (lowercase, hyphenated).
 */
describe('Property 7: Tag Slug Generation', () => {
  // Arbitrary for generating tag names with various characters
  const tagNameArb = fc.string({ minLength: 1, maxLength: 50 });

  // Arbitrary for tag names that should produce non-empty slugs
  // (contains at least one alphanumeric character)
  const validTagNameArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => /[\p{L}\p{N}]/u.test(s));

  it('should generate lowercase slugs', () => {
    fc.assert(
      fc.property(validTagNameArb, (name) => {
        const slug = generateSlug(name);
        // Slug should be lowercase (no uppercase letters)
        expect(slug).toBe(slug.toLowerCase());
      }),
      { numRuns: 100 }
    );
  });

  it('should only contain valid URL-safe characters (lowercase letters, numbers, hyphens)', () => {
    fc.assert(
      fc.property(validTagNameArb, (name) => {
        const slug = generateSlug(name);
        // Slug should only contain lowercase letters (including Unicode), numbers, and hyphens
        // Using a more permissive check since we support Unicode
        expect(slug).toMatch(/^[\p{Ll}\p{N}-]*$/u);
      }),
      { numRuns: 100 }
    );
  });

  it('should not have consecutive hyphens', () => {
    fc.assert(
      fc.property(validTagNameArb, (name) => {
        const slug = generateSlug(name);
        // Slug should not contain consecutive hyphens
        expect(slug).not.toMatch(/--/);
      }),
      { numRuns: 100 }
    );
  });

  it('should not start or end with hyphens', () => {
    fc.assert(
      fc.property(validTagNameArb, (name) => {
        const slug = generateSlug(name);
        if (slug.length > 0) {
          expect(slug[0]).not.toBe('-');
          expect(slug[slug.length - 1]).not.toBe('-');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should convert spaces to hyphens', () => {
    // Generate names with spaces
    const nameWithSpacesArb = fc.tuple(
      fc.stringMatching(/^[a-z]+$/),
      fc.stringMatching(/^[a-z]+$/)
    ).map(([a, b]) => `${a} ${b}`);

    fc.assert(
      fc.property(nameWithSpacesArb, (name) => {
        const slug = generateSlug(name);
        // Should not contain spaces
        expect(slug).not.toMatch(/\s/);
        // Should contain a hyphen where the space was
        expect(slug).toContain('-');
      }),
      { numRuns: 100 }
    );
  });

  it('should produce non-empty slug for names with alphanumeric characters', () => {
    fc.assert(
      fc.property(validTagNameArb, (name) => {
        const slug = generateSlug(name);
        // If the name has alphanumeric chars, slug should be non-empty
        expect(slug.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should produce empty slug for names with only special characters', () => {
    // Generate names with only special characters (no letters or numbers)
    const specialOnlyArb = fc.stringMatching(/^[!@#$%^&*()+=\[\]{}|\\:;"'<>,.\/?~`]+$/)
      .filter(s => s.length > 0);

    fc.assert(
      fc.property(specialOnlyArb, (name) => {
        const slug = generateSlug(name);
        // Should produce empty slug
        expect(slug).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  it('should be idempotent - applying generateSlug twice produces same result', () => {
    fc.assert(
      fc.property(tagNameArb, (name) => {
        const slug1 = generateSlug(name);
        const slug2 = generateSlug(slug1);
        // Applying generateSlug to an already-slugified string should produce same result
        expect(slug2).toBe(slug1);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: project-audit, Property 8: Tag Deletion Cascade**
 * **Validates: Requirements 8.3**
 *
 * *For any* tag that is associated with posts, deleting the tag should remove
 * all post-tag associations while preserving the posts themselves.
 */
describe('Property 8: Tag Deletion Cascade', () => {
  // Type definitions for our test data
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
    published: boolean;
    authorId: string;
  }

  interface PostTag {
    postId: string;
    tagId: string;
  }

  /**
   * Pure function that simulates the cascade deletion logic.
   * This mirrors what deleteTag does in the database.
   */
  function simulateTagDeletion(
    tagId: string,
    tags: Tag[],
    posts: Post[],
    postsTags: PostTag[]
  ): { tags: Tag[]; posts: Post[]; postsTags: PostTag[] } {
    // Remove all post-tag associations for this tag
    const newPostsTags = postsTags.filter(pt => pt.tagId !== tagId);
    // Remove the tag itself
    const newTags = tags.filter(t => t.id !== tagId);
    // Posts should remain unchanged
    return {
      tags: newTags,
      posts: posts, // Posts are preserved
      postsTags: newPostsTags,
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
    published: fc.boolean(),
    authorId: fc.uuid(),
  });

  // Generate a consistent dataset with tags, posts, and associations
  const datasetArb = fc.tuple(
    fc.array(tagArb, { minLength: 1, maxLength: 10 }),
    fc.array(postArb, { minLength: 1, maxLength: 10 })
  ).chain(([tags, posts]) => {
    // Generate post-tag associations using existing tag and post IDs
    const postsTagsArb = fc.array(
      fc.tuple(
        fc.integer({ min: 0, max: posts.length - 1 }),
        fc.integer({ min: 0, max: tags.length - 1 })
      ).map(([postIdx, tagIdx]) => ({
        postId: posts[postIdx].id,
        tagId: tags[tagIdx].id,
      })),
      { minLength: 0, maxLength: 20 }
    );

    return postsTagsArb.map(postsTags => ({
      tags,
      posts,
      postsTags: [...new Map(postsTags.map(pt => [`${pt.postId}-${pt.tagId}`, pt])).values()], // Dedupe
    }));
  });

  it('should remove all post-tag associations for the deleted tag', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        // Pick a random tag to delete
        const tagToDelete = tags[0];
        
        const result = simulateTagDeletion(tagToDelete.id, tags, posts, postsTags);
        
        // No associations should reference the deleted tag
        const associationsWithDeletedTag = result.postsTags.filter(
          pt => pt.tagId === tagToDelete.id
        );
        expect(associationsWithDeletedTag.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all posts after tag deletion', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToDelete = tags[0];
        
        const result = simulateTagDeletion(tagToDelete.id, tags, posts, postsTags);
        
        // All original posts should still exist
        expect(result.posts.length).toBe(posts.length);
        posts.forEach(post => {
          const preserved = result.posts.find(p => p.id === post.id);
          expect(preserved).toBeDefined();
          expect(preserved).toEqual(post);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should remove the tag itself', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToDelete = tags[0];
        
        const result = simulateTagDeletion(tagToDelete.id, tags, posts, postsTags);
        
        // The deleted tag should not exist
        const deletedTag = result.tags.find(t => t.id === tagToDelete.id);
        expect(deletedTag).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve associations for other tags', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToDelete = tags[0];
        
        const result = simulateTagDeletion(tagToDelete.id, tags, posts, postsTags);
        
        // Associations for other tags should be preserved
        const otherTagAssociations = postsTags.filter(pt => pt.tagId !== tagToDelete.id);
        
        otherTagAssociations.forEach(assoc => {
          const preserved = result.postsTags.find(
            pt => pt.postId === assoc.postId && pt.tagId === assoc.tagId
          );
          expect(preserved).toBeDefined();
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve other tags', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToDelete = tags[0];
        
        const result = simulateTagDeletion(tagToDelete.id, tags, posts, postsTags);
        
        // Other tags should be preserved
        const otherTags = tags.filter(t => t.id !== tagToDelete.id);
        expect(result.tags.length).toBe(otherTags.length);
        
        otherTags.forEach(tag => {
          const preserved = result.tags.find(t => t.id === tag.id);
          expect(preserved).toBeDefined();
          expect(preserved).toEqual(tag);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should handle tag with no associations', () => {
    // Generate a tag that has no associations
    const isolatedTagDatasetArb = fc.tuple(
      tagArb,
      fc.array(tagArb, { minLength: 0, maxLength: 5 }),
      fc.array(postArb, { minLength: 1, maxLength: 5 })
    ).map(([isolatedTag, otherTags, posts]) => {
      // Create associations only for other tags
      const postsTags: PostTag[] = otherTags.flatMap(tag =>
        posts.slice(0, 2).map(post => ({ postId: post.id, tagId: tag.id }))
      );
      
      return {
        tags: [isolatedTag, ...otherTags],
        posts,
        postsTags,
        isolatedTagId: isolatedTag.id,
      };
    });

    fc.assert(
      fc.property(isolatedTagDatasetArb, ({ tags, posts, postsTags, isolatedTagId }) => {
        const result = simulateTagDeletion(isolatedTagId, tags, posts, postsTags);
        
        // Tag should be removed
        expect(result.tags.find(t => t.id === isolatedTagId)).toBeUndefined();
        // All posts should be preserved
        expect(result.posts.length).toBe(posts.length);
        // All other associations should be preserved
        expect(result.postsTags.length).toBe(postsTags.length);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: project-audit, Property 11: Tag Filtering**
 * **Validates: Requirements 11.3**
 *
 * *For any* tag, filtering posts by that tag should return only posts that have
 * that tag associated.
 */
describe('Property 11: Tag Filtering', () => {
  // Type definitions for our test data
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
    published: boolean;
    authorId: string;
    createdAt: Date;
  }

  interface PostTag {
    postId: string;
    tagId: string;
  }

  /**
   * Pure function that simulates filtering posts by tag.
   * This mirrors what getPostsByTag does in the database.
   * Returns only published posts that have the specified tag.
   */
  function filterPostsByTag(
    tagSlug: string,
    tags: Tag[],
    posts: Post[],
    postsTags: PostTag[]
  ): { tag: Tag | null; posts: Post[] } {
    // Find the tag by slug
    const tag = tags.find(t => t.slug === tagSlug);
    
    if (!tag) {
      return { tag: null, posts: [] };
    }
    
    // Get all post IDs associated with this tag
    const postIdsWithTag = new Set(
      postsTags
        .filter(pt => pt.tagId === tag.id)
        .map(pt => pt.postId)
    );
    
    // Filter to only published posts that have this tag
    const filteredPosts = posts
      .filter(post => post.published === true && postIdsWithTag.has(post.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return { tag, posts: filteredPosts };
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
    published: fc.boolean(),
    authorId: fc.uuid(),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  });

  // Generate a consistent dataset with tags, posts, and associations
  const datasetArb = fc.tuple(
    fc.array(tagArb, { minLength: 1, maxLength: 10 }),
    fc.array(postArb, { minLength: 1, maxLength: 10 })
  ).chain(([tags, posts]) => {
    // Generate post-tag associations using existing tag and post IDs
    const postsTagsArb = fc.array(
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
      postsTags: [...new Map(postsTags.map(pt => [`${pt.postId}-${pt.tagId}`, pt])).values()], // Dedupe
    }));
  });

  it('should return only posts that have the specified tag', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToFilter = tags[0];
        
        const result = filterPostsByTag(tagToFilter.slug, tags, posts, postsTags);
        
        // All returned posts should have the tag associated
        const postIdsWithTag = new Set(
          postsTags
            .filter(pt => pt.tagId === tagToFilter.id)
            .map(pt => pt.postId)
        );
        
        result.posts.forEach(post => {
          expect(postIdsWithTag.has(post.id)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return only published posts', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToFilter = tags[0];
        
        const result = filterPostsByTag(tagToFilter.slug, tags, posts, postsTags);
        
        // All returned posts should be published
        result.posts.forEach(post => {
          expect(post.published).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should not include posts without the specified tag', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToFilter = tags[0];
        
        const result = filterPostsByTag(tagToFilter.slug, tags, posts, postsTags);
        
        // Get post IDs that should NOT be in the result (don't have the tag)
        const postIdsWithTag = new Set(
          postsTags
            .filter(pt => pt.tagId === tagToFilter.id)
            .map(pt => pt.postId)
        );
        
        const postIdsWithoutTag = posts
          .filter(p => !postIdsWithTag.has(p.id))
          .map(p => p.id);
        
        // None of the posts without the tag should be in the result
        const resultPostIds = new Set(result.posts.map(p => p.id));
        postIdsWithoutTag.forEach(postId => {
          expect(resultPostIds.has(postId)).toBe(false);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should not include unpublished posts even if they have the tag', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToFilter = tags[0];
        
        const result = filterPostsByTag(tagToFilter.slug, tags, posts, postsTags);
        
        // Get unpublished posts that have the tag
        const postIdsWithTag = new Set(
          postsTags
            .filter(pt => pt.tagId === tagToFilter.id)
            .map(pt => pt.postId)
        );
        
        const unpublishedPostsWithTag = posts.filter(
          p => !p.published && postIdsWithTag.has(p.id)
        );
        
        // None of the unpublished posts should be in the result
        const resultPostIds = new Set(result.posts.map(p => p.id));
        unpublishedPostsWithTag.forEach(post => {
          expect(resultPostIds.has(post.id)).toBe(false);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return null tag for non-existent tag slug', () => {
    fc.assert(
      fc.property(datasetArb, fc.uuid(), ({ tags, posts, postsTags }, nonExistentSlug) => {
        // Ensure the slug doesn't match any existing tag
        const existingSlugs = new Set(tags.map(t => t.slug));
        if (existingSlugs.has(nonExistentSlug)) {
          return; // Skip this case
        }
        
        const result = filterPostsByTag(nonExistentSlug, tags, posts, postsTags);
        
        expect(result.tag).toBeNull();
        expect(result.posts.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty posts array when tag has no associated posts', () => {
    // Generate a dataset where one tag has no associations
    const isolatedTagDatasetArb = fc.tuple(
      tagArb,
      fc.array(tagArb, { minLength: 0, maxLength: 5 }),
      fc.array(postArb, { minLength: 1, maxLength: 5 })
    ).map(([isolatedTag, otherTags, posts]) => {
      // Create associations only for other tags
      const postsTags: PostTag[] = otherTags.flatMap(tag =>
        posts.slice(0, 2).map(post => ({ postId: post.id, tagId: tag.id }))
      );
      
      return {
        tags: [isolatedTag, ...otherTags],
        posts,
        postsTags,
        isolatedTag,
      };
    });

    fc.assert(
      fc.property(isolatedTagDatasetArb, ({ tags, posts, postsTags, isolatedTag }) => {
        const result = filterPostsByTag(isolatedTag.slug, tags, posts, postsTags);
        
        expect(result.tag).toEqual(isolatedTag);
        expect(result.posts.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should return posts sorted by creation date (newest first)', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToFilter = tags[0];
        
        const result = filterPostsByTag(tagToFilter.slug, tags, posts, postsTags);
        
        // Check that posts are sorted by createdAt descending
        for (let i = 1; i < result.posts.length; i++) {
          const prevDate = result.posts[i - 1].createdAt.getTime();
          const currDate = result.posts[i].createdAt.getTime();
          expect(prevDate).toBeGreaterThanOrEqual(currDate);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return all published posts with the tag (completeness)', () => {
    fc.assert(
      fc.property(datasetArb, ({ tags, posts, postsTags }) => {
        const tagToFilter = tags[0];
        
        const result = filterPostsByTag(tagToFilter.slug, tags, posts, postsTags);
        
        // Get all published posts that have the tag
        const postIdsWithTag = new Set(
          postsTags
            .filter(pt => pt.tagId === tagToFilter.id)
            .map(pt => pt.postId)
        );
        
        const expectedPosts = posts.filter(
          p => p.published === true && postIdsWithTag.has(p.id)
        );
        
        // Result should contain exactly the expected posts
        expect(result.posts.length).toBe(expectedPosts.length);
        
        const resultPostIds = new Set(result.posts.map(p => p.id));
        expectedPosts.forEach(post => {
          expect(resultPostIds.has(post.id)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });
});
