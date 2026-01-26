
'use server';

import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function checkRegistrationStatus() {
    // Check if any users exist
    const users = await db.select().from(schema.users);
    if (users.length === 0) {
        return { allowed: true, isFirstUser: true };
    }

    // Check settings
    const settings = await db.select().from(schema.settings).limit(1);
    if (settings.length > 0 && settings[0].allowRegistration === false) {
        return { allowed: false, isFirstUser: false };
    }

    return { allowed: true, isFirstUser: false };
}

export async function postRegistrationCleanup(email: string) {
    const users = await db.select().from(schema.users);

    // If only 1 user exists (the one just created), make them admin
    if (users.length === 1) {
        await db.update(schema.users)
            .set({ role: 'admin' })
            .where(eq(schema.users.email, email));

        // Close registration
        await db.insert(schema.settings).values({
            id: 1,
            allowRegistration: false,
            siteTitle: "My Awesome Blog"
        }).onConflictDoUpdate({
            target: schema.settings.id,
            set: { allowRegistration: false }
        });
    }
}
