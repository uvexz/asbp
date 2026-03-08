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
        <div className="flex min-h-full flex-col">
            <header className="flex flex-col gap-2 px-4 py-6 sm:px-6">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">
                    {t('passkeys')}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {t('passkeysDesc')}
                </p>
            </header>
            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <PasskeyManager initialPasskeys={userPasskeys} />
            </main>
        </div>
    );
}
