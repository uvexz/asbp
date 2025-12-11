import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getInitials, formatRole } from './admin-sidebar';

/**
 * **Feature: project-audit, Property 1: Sidebar User Info Rendering**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * *For any* valid user object with name, email, image, and role, the AdminSidebar 
 * component should render all user information correctly - displaying the user's 
 * actual name, appropriate avatar (image or initials), and role.
 */
describe('Property 1: Sidebar User Info Rendering', () => {
  // Arbitrary for generating non-empty names
  const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
  
  // Arbitrary for generating names with multiple parts (first and last name)
  const fullNameArb = fc.tuple(
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z]+$/.test(s)),
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z]+$/.test(s))
  ).map(([first, last]) => `${first} ${last}`);

  // Arbitrary for generating role strings
  const roleArb = fc.oneof(
    fc.constant('admin'),
    fc.constant('user'),
    fc.constant('moderator'),
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0)
  );

  describe('getInitials', () => {
    it('should return uppercase initials for any valid name', () => {
      fc.assert(
        fc.property(nameArb, (name) => {
          const initials = getInitials(name);
          // Initials should be uppercase
          expect(initials).toBe(initials.toUpperCase());
        }),
        { numRuns: 100 }
      );
    });

    it('should return 1-2 characters for any valid name', () => {
      fc.assert(
        fc.property(nameArb, (name) => {
          const initials = getInitials(name);
          // Initials should be 1-2 characters (or ? for edge cases)
          expect(initials.length).toBeGreaterThanOrEqual(1);
          expect(initials.length).toBeLessThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it('should return two initials for full names (first and last)', () => {
      fc.assert(
        fc.property(fullNameArb, (name) => {
          const initials = getInitials(name);
          // Full names should produce 2-character initials
          expect(initials.length).toBe(2);
          // First initial should match first character of first name
          const parts = name.trim().split(/\s+/);
          expect(initials[0]).toBe(parts[0].charAt(0).toUpperCase());
          // Second initial should match first character of last name
          expect(initials[1]).toBe(parts[parts.length - 1].charAt(0).toUpperCase());
        }),
        { numRuns: 100 }
      );
    });

    it('should return single initial for single-word names', () => {
      const singleWordNameArb = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0 && !s.trim().includes(' '));
      
      fc.assert(
        fc.property(singleWordNameArb, (name) => {
          const initials = getInitials(name);
          expect(initials.length).toBe(1);
          expect(initials).toBe(name.trim().charAt(0).toUpperCase());
        }),
        { numRuns: 100 }
      );
    });

    it('should return ? for empty or whitespace-only names', () => {
      const emptyNameArb = fc.oneof(
        fc.constant(''),
        fc.constant('   '),
        fc.constant('  '),
        fc.constant(' ')
      );
      
      fc.assert(
        fc.property(emptyNameArb, (name) => {
          const initials = getInitials(name);
          expect(initials).toBe('?');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('formatRole', () => {
    it('should capitalize the first letter of any role', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const formatted = formatRole(role);
          // First character should be uppercase
          expect(formatted.charAt(0)).toBe(formatted.charAt(0).toUpperCase());
        }),
        { numRuns: 100 }
      );
    });

    it('should lowercase the rest of the role string', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const formatted = formatRole(role);
          if (formatted.length > 1) {
            const rest = formatted.slice(1);
            expect(rest).toBe(rest.toLowerCase());
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return "User" for empty role', () => {
      expect(formatRole('')).toBe('User');
    });

    it('should handle various case inputs consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          (role) => {
            const formatted = formatRole(role);
            // Result should be properly capitalized
            const expected = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
            expect(formatted).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('User info rendering properties', () => {
    // Arbitrary for generating complete user objects
    const userArb = fc.record({
      name: nameArb,
      email: fc.emailAddress(),
      image: fc.oneof(fc.constant(null), fc.webUrl()),
      role: roleArb,
    });

    it('should produce valid initials for any user name', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const initials = getInitials(user.name);
          // Initials should never be empty
          expect(initials.length).toBeGreaterThanOrEqual(1);
          // Initials should be uppercase
          expect(initials).toBe(initials.toUpperCase());
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid formatted role for any user role', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const formatted = formatRole(user.role);
          // Formatted role should never be empty
          expect(formatted.length).toBeGreaterThanOrEqual(1);
          // First character should be uppercase
          expect(formatted.charAt(0)).toBe(formatted.charAt(0).toUpperCase());
        }),
        { numRuns: 100 }
      );
    });
  });
});
