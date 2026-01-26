'use server';

import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isAdminAuthorized } from '@/lib/server-utils';

async function requireAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!isAdminAuthorized(session)) {
        throw new Error('Unauthorized');
    }
    
    return session;
}

export async function getUsers() {
    await requireAdmin();
    
    const data = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        bio: users.bio,
        website: users.website,
        role: users.role,
        createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
    
    return data;
}

export async function getUserById(id: string) {
    await requireAdmin();
    
    const [user] = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        bio: users.bio,
        website: users.website,
        role: users.role,
    })
    .from(users)
    .where(eq(users.id, id));
    
    return user || null;
}

export type UpdateUserData = {
    name?: string;
    image?: string;
    bio?: string;
    website?: string;
    role?: string;
};

export async function updateUser(id: string, data: UpdateUserData) {
    await requireAdmin();
    
    await db.update(users)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id));
    
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
}

export async function deleteUser(id: string) {
    const session = await requireAdmin();
    
    // Prevent deleting yourself
    if (session?.user?.id === id) {
        throw new Error('Cannot delete your own account');
    }
    
    await db.delete(users).where(eq(users.id, id));
    revalidatePath('/admin/users');
}
