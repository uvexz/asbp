
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { db } from "./db";
import * as schema from "../db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            ...schema,
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verification,
            passkey: schema.passkeys,
            rateLimit: schema.rateLimit,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'user'
            }
        }
    },
    rateLimit: {
        enabled: true,
        window: 60, // 60 seconds
        max: 100, // 100 requests per window
        storage: "database",
        customRules: {
            "/sign-in/email": {
                window: 60,
                max: 5, // Stricter limit for login attempts
            },
            "/sign-up/email": {
                window: 60,
                max: 3, // Stricter limit for registration
            },
        },
    },
    plugins: [
        passkey(),
    ],
});
