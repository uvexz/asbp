/**
 * Generate initials from a user's name
 * Takes the first letter of the first and last name (if available)
 */
export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format role for display (capitalize first letter)
 */
export function formatRole(role: string): string {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}
