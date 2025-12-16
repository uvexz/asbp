'use server';

import { db } from '@/lib/db';
import { navItems } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getCachedNavItems, invalidateNavigationCache } from '@/lib/cache-layer';

export type NavItem = {
    id: string;
    label: string;
    url: string;
    openInNewTab: boolean | null;
    sortOrder: number;
};

/**
 * Get navigation items with caching
 */
export async function getNavItems(): Promise<NavItem[]> {
    return getCachedNavItems();
}

/**
 * Get navigation items without cache (for admin)
 */
export async function getNavItemsUncached(): Promise<NavItem[]> {
    const items = await db.select().from(navItems).orderBy(asc(navItems.sortOrder));
    return items;
}

export async function createNavItem(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const label = formData.get('label') as string;
    const url = formData.get('url') as string;
    const openInNewTab = formData.get('openInNewTab') === 'on';
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!label || !url) {
        throw new Error('Label and URL are required');
    }

    await db.insert(navItems).values({
        label,
        url,
        openInNewTab,
        sortOrder,
    });

    invalidateNavigationCache();
    revalidatePath('/');
    revalidatePath('/admin/navigation');
}

export async function updateNavItem(id: string, formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const label = formData.get('label') as string;
    const url = formData.get('url') as string;
    const openInNewTab = formData.get('openInNewTab') === 'on';
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!label || !url) {
        throw new Error('Label and URL are required');
    }

    await db.update(navItems)
        .set({ label, url, openInNewTab, sortOrder })
        .where(eq(navItems.id, id));

    invalidateNavigationCache();
    revalidatePath('/');
    revalidatePath('/admin/navigation');
}

export async function deleteNavItem(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    await db.delete(navItems).where(eq(navItems.id, id));
    
    invalidateNavigationCache();
    revalidatePath('/');
    revalidatePath('/admin/navigation');
}

export async function reorderNavItems(orderedIds: string[]) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    // Update sort order for each item
    for (let i = 0; i < orderedIds.length; i++) {
        await db.update(navItems)
            .set({ sortOrder: i })
            .where(eq(navItems.id, orderedIds[i]));
    }

    invalidateNavigationCache();
    revalidatePath('/');
    revalidatePath('/admin/navigation');
}
