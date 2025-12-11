import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { postSchema, commentSchema, tagSchema, settingsSchema } from './validations';

/**
 * **Feature: project-audit, Property 12: Input Validation**
 * **Validates: Requirements 13.1, 13.2, 13.3**
 *
 * *For any* invalid input (empty required fields, invalid email format, invalid slug format),
 * validation should fail and return specific error messages.
 */
describe('Property 12: Input Validation', () => {
  describe('Post Schema Validation (Requirements 13.1)', () => {
    // Valid post arbitrary
    const validPostArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }),
      slug: fc.stringMatching(/^[a-z0-9-]+$/).filter(s => s.length >= 1 && s.length <= 200),
      content: fc.string({ minLength: 1 }),
      published: fc.boolean(),
    });

    it('should accept valid post data', () => {
      fc.assert(
        fc.property(validPostArb, (post) => {
          const result = postSchema.safeParse(post);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject posts with empty title', () => {
      const postWithEmptyTitleArb = fc.record({
        title: fc.constant(''),
        slug: fc.stringMatching(/^[a-z0-9-]+$/).filter(s => s.length >= 1 && s.length <= 200),
        content: fc.string({ minLength: 1 }),
        published: fc.boolean(),
      });

      fc.assert(
        fc.property(postWithEmptyTitleArb, (post) => {
          const result = postSchema.safeParse(post);
          expect(result.success).toBe(false);
          if (!result.success) {
            const titleError = result.error.issues.find(i => i.path.includes('title'));
            expect(titleError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject posts with empty slug', () => {
      const postWithEmptySlugArb = fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        slug: fc.constant(''),
        content: fc.string({ minLength: 1 }),
        published: fc.boolean(),
      });

      fc.assert(
        fc.property(postWithEmptySlugArb, (post) => {
          const result = postSchema.safeParse(post);
          expect(result.success).toBe(false);
          if (!result.success) {
            const slugError = result.error.issues.find(i => i.path.includes('slug'));
            expect(slugError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject posts with invalid slug format', () => {
      // Generate slugs with invalid characters (uppercase, spaces, special chars)
      const invalidSlugArb = fc.oneof(
        fc.string({ minLength: 1 }).filter(s => /[A-Z]/.test(s)), // Contains uppercase
        fc.string({ minLength: 1 }).filter(s => /\s/.test(s)),    // Contains whitespace
        fc.string({ minLength: 1 }).filter(s => /[^a-z0-9-]/.test(s)) // Contains invalid chars
      );

      const postWithInvalidSlugArb = fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        slug: invalidSlugArb,
        content: fc.string({ minLength: 1 }),
        published: fc.boolean(),
      });

      fc.assert(
        fc.property(postWithInvalidSlugArb, (post) => {
          const result = postSchema.safeParse(post);
          expect(result.success).toBe(false);
          if (!result.success) {
            const slugError = result.error.issues.find(i => i.path.includes('slug'));
            expect(slugError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject posts with empty content', () => {
      const postWithEmptyContentArb = fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        slug: fc.stringMatching(/^[a-z0-9-]+$/).filter(s => s.length >= 1 && s.length <= 200),
        content: fc.constant(''),
        published: fc.boolean(),
      });

      fc.assert(
        fc.property(postWithEmptyContentArb, (post) => {
          const result = postSchema.safeParse(post);
          expect(result.success).toBe(false);
          if (!result.success) {
            const contentError = result.error.issues.find(i => i.path.includes('content'));
            expect(contentError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Comment Schema Validation (Requirements 13.2)', () => {
    // Valid email arbitrary - generate emails that Zod will accept
    // Zod's email validation is stricter than fc.emailAddress()
    const validEmailArb = fc
      .tuple(
        fc.stringMatching(/^[a-z][a-z0-9]*$/), // local part starts with letter
        fc.stringMatching(/^[a-z][a-z0-9]*$/), // domain name
        fc.constantFrom('com', 'org', 'net', 'io', 'co') // TLD
      )
      .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    // Valid comment arbitrary - ensure non-whitespace content
    const validCommentArb = fc.record({
      content: fc.string({ minLength: 1, maxLength: 2000 }).filter(s => s.trim().length > 0),
      guestName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      guestEmail: validEmailArb,
    });

    it('should accept valid comment data', () => {
      fc.assert(
        fc.property(validCommentArb, (comment) => {
          const result = commentSchema.safeParse(comment);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject comments with empty content', () => {
      const commentWithEmptyContentArb = fc.record({
        content: fc.constant(''),
        guestName: fc.string({ minLength: 1, maxLength: 100 }),
        guestEmail: validEmailArb,
      });

      fc.assert(
        fc.property(commentWithEmptyContentArb, (comment) => {
          const result = commentSchema.safeParse(comment);
          expect(result.success).toBe(false);
          if (!result.success) {
            const contentError = result.error.issues.find(i => i.path.includes('content'));
            expect(contentError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject comments with empty name', () => {
      const commentWithEmptyNameArb = fc.record({
        content: fc.string({ minLength: 1, maxLength: 2000 }),
        guestName: fc.constant(''),
        guestEmail: validEmailArb,
      });

      fc.assert(
        fc.property(commentWithEmptyNameArb, (comment) => {
          const result = commentSchema.safeParse(comment);
          expect(result.success).toBe(false);
          if (!result.success) {
            const nameError = result.error.issues.find(i => i.path.includes('guestName'));
            expect(nameError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject comments with invalid email format', () => {
      // Generate strings that are not valid emails
      const invalidEmailArb = fc.oneof(
        fc.string({ minLength: 1 }).filter(s => !s.includes('@')), // No @ symbol
        fc.string({ minLength: 1 }).filter(s => s.includes('@') && !s.includes('.')), // No domain
        fc.constant('invalid'),
        fc.constant('test@'),
        fc.constant('@test.com'),
        fc.constant('test@.com'),
      );

      const commentWithInvalidEmailArb = fc.record({
        content: fc.string({ minLength: 1, maxLength: 2000 }),
        guestName: fc.string({ minLength: 1, maxLength: 100 }),
        guestEmail: invalidEmailArb,
      });

      fc.assert(
        fc.property(commentWithInvalidEmailArb, (comment) => {
          const result = commentSchema.safeParse(comment);
          expect(result.success).toBe(false);
          if (!result.success) {
            const emailError = result.error.issues.find(i => i.path.includes('guestEmail'));
            expect(emailError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Tag Schema Validation', () => {
    it('should accept valid tag names', () => {
      const validTagArb = fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
      });

      fc.assert(
        fc.property(validTagArb, (tag) => {
          const result = tagSchema.safeParse(tag);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject tags with empty name', () => {
      const emptyTagArb = fc.record({
        name: fc.constant(''),
      });

      fc.assert(
        fc.property(emptyTagArb, (tag) => {
          const result = tagSchema.safeParse(tag);
          expect(result.success).toBe(false);
          if (!result.success) {
            const nameError = result.error.issues.find(i => i.path.includes('name'));
            expect(nameError).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Messages (Requirements 13.3)', () => {
    it('should return specific error messages for post validation failures', () => {
      const invalidPost = {
        title: '',
        slug: 'INVALID SLUG!',
        content: '',
        published: false,
      };

      const result = postSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple specific error messages
        expect(result.error.issues.length).toBeGreaterThan(0);
        // Each issue should have a message
        result.error.issues.forEach(issue => {
          expect(issue.message).toBeDefined();
          expect(issue.message.length).toBeGreaterThan(0);
        });
      }
    });

    it('should return specific error messages for comment validation failures', () => {
      const invalidComment = {
        content: '',
        guestName: '',
        guestEmail: 'not-an-email',
      };

      const result = commentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple specific error messages
        expect(result.error.issues.length).toBeGreaterThan(0);
        // Each issue should have a message
        result.error.issues.forEach(issue => {
          expect(issue.message).toBeDefined();
          expect(issue.message.length).toBeGreaterThan(0);
        });
      }
    });
  });
});
