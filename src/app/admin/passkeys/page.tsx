import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { passkeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from 'next-intl/server';
import { PasskeyManager } from "@/components/layout/passkey-manager";

export default async function PasskeysPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        redirect("/sign-in");
    }

    const t = await getTranslations('auth');

    const userPasskeys = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.userId, session.user.id))
        .orderBy(passkeys.createdAt);

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    {t('passkeys')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {t('passkeysDesc')}
                </p>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
                <PasskeyManager initialPasskeys={userPasskeys} />
            </main>
        </div>
    );
}
