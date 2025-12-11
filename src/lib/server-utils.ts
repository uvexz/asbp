/**
 * Pure utility functions for server-side logic
 * These are extracted from server actions to avoid the "Server Actions must be async" error
 */

/**
 * Checks if a user has admin authorization.
 * Returns true if the user has admin role, false otherwise.
 * This is the core authorization logic extracted for testability.
 */
export function isAdminAuthorized(session: { user: { role?: string } } | null): boolean {
    return session !== null && session.user.role === 'admin';
}

/**
 * Pure function to filter published posts from a list
 * Used for testing the filtering logic without database access
 */
export function filterPublishedPosts<T extends { published: boolean | null }>(posts: T[]): T[] {
    return posts.filter(post => post.published === true);
}

/**
 * Pagination result type
 */
export interface PaginatedResult<T> {
    posts: T[];
    total: number;
    totalPages: number;
}

/**
 * Pure function to paginate a list of items
 * Used for testing pagination logic without database access
 * @param items - Array of items to paginate
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated result with items, total count, and total pages
 */
export function paginateItems<T>(
    items: T[],
    page: number,
    pageSize: number
): PaginatedResult<T> {
    // Ensure valid pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const total = items.length;
    const totalPages = Math.ceil(total / validPageSize);
    const paginatedItems = items.slice(offset, offset + validPageSize);

    return {
        posts: paginatedItems,
        total,
        totalPages,
    };
}

/**
 * Generates a URL-safe slug from a tag name.
 * Converts to lowercase, replaces spaces and special characters with hyphens,
 * removes consecutive hyphens, and trims hyphens from start/end.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')           // Replace spaces and underscores with hyphens
    .replace(/[^\p{L}\p{N}-]/gu, '')   // Remove non-alphanumeric chars except hyphens (Unicode-aware)
    .replace(/-+/g, '-')               // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');            // Remove leading/trailing hyphens
}
