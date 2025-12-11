import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isAdminAuthorized } from '@/lib/server-utils';

/**
 * **Feature: project-audit, Property 4: Admin Authorization for Comment Actions**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 * 
 * *For any* user without admin role, attempting to approve or delete a comment 
 * should result in an authorization error being thrown.
 */
describe('Property 4: Admin Authorization for Comment Actions', () => {
  // Arbitrary for generating non-admin roles
  const nonAdminRoleArb = fc.oneof(
    fc.constant('user'),
    fc.constant('guest'),
    fc.constant('moderator'),
    fc.constant('editor'),
    fc.string().filter(s => s !== 'admin')
  );

  // Arbitrary for generating user objects with non-admin roles
  const nonAdminUserArb = fc.record({
    role: nonAdminRoleArb,
    id: fc.string(),
    name: fc.string(),
    email: fc.emailAddress(),
  });

  // Arbitrary for generating sessions with non-admin users
  const nonAdminSessionArb = fc.record({
    user: nonAdminUserArb,
  });

  it('should deny authorization for any user without admin role', () => {
    fc.assert(
      fc.property(nonAdminSessionArb, (session) => {
        const result = isAdminAuthorized(session);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should deny authorization for null session', () => {
    const result = isAdminAuthorized(null);
    expect(result).toBe(false);
  });

  it('should deny authorization for session with undefined role', () => {
    fc.assert(
      fc.property(
        fc.record({
          user: fc.record({
            id: fc.string(),
            name: fc.string(),
            email: fc.emailAddress(),
          }),
        }),
        (session) => {
          const result = isAdminAuthorized(session as { user: { role?: string } });
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should grant authorization only for admin role', () => {
    const adminSession = {
      user: {
        role: 'admin',
        id: 'test-id',
        name: 'Admin User',
        email: 'admin@example.com',
      },
    };
    const result = isAdminAuthorized(adminSession);
    expect(result).toBe(true);
  });

  it('should be case-sensitive for admin role check', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('Admin'),
          fc.constant('ADMIN'),
          fc.constant('aDmIn'),
          fc.constant(' admin'),
          fc.constant('admin ')
        ),
        (role) => {
          const session = { user: { role } };
          const result = isAdminAuthorized(session);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
