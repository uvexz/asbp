'use server';

import { db, pool } from '@/lib/db';
import * as schema from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

const REGISTRATION_BOOTSTRAP_LOCK_ID = 841921;

export async function withRegistrationBootstrapLock<T>(callback: () => Promise<T>) {
    const client = await pool.connect();

    try {
        await client.query('SELECT pg_advisory_lock($1)', [REGISTRATION_BOOTSTRAP_LOCK_ID]);
        return await callback();
    } finally {
        try {
            await client.query('SELECT pg_advisory_unlock($1)', [REGISTRATION_BOOTSTRAP_LOCK_ID]);
        } finally {
            client.release();
        }
    }
}

export async function checkRegistrationStatus() {
    const existingUser = await db.query.users.findFirst({
        columns: { id: true },
    });

    if (!existingUser) {
        return { allowed: true, isFirstUser: true };
    }

    const currentSettings = await db.query.settings.findFirst({
        columns: { allowRegistration: true },
    });

    if (currentSettings?.allowRegistration === false) {
        return { allowed: false, isFirstUser: false };
    }

    return { allowed: true, isFirstUser: false };
}

export async function postRegistrationCleanup(
    email: string,
    options: { bootstrapFirstUser?: boolean } = {},
) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!options.bootstrapFirstUser) {
        return { promotedToAdmin: false };
    }

    const bootstrapUser = await db.query.users.findFirst({
        columns: { id: true, email: true, role: true },
        orderBy: [asc(schema.users.createdAt), asc(schema.users.id)],
    });

    if (!bootstrapUser) {
        return { promotedToAdmin: false };
    }

    if (bootstrapUser.role !== 'admin') {
        await db.update(schema.users)
            .set({ role: 'admin' })
            .where(eq(schema.users.id, bootstrapUser.id));
    }

    await db.insert(schema.settings).values({
        id: 1,
        allowRegistration: false,
    }).onConflictDoUpdate({
        target: schema.settings.id,
        set: { allowRegistration: false },
    });

    return {
        promotedToAdmin: bootstrapUser.email.trim().toLowerCase() === normalizedEmail,
    };
}
