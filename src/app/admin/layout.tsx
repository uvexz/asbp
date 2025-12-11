import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminMobileHeader } from '@/components/layout/admin-mobile-header';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/app/actions/settings";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const settings = await getSettings();

    // Extract user info from session for the sidebar
    const user = {
        name: session.user.name || session.user.email || 'User',
        email: session.user.email || '',
        image: session.user.image,
        role: session.user.role || 'user',
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#f6f8f6] dark:bg-[#152111] font-sans overflow-hidden">
            <AdminMobileHeader settings={settings} user={user} />
            <AdminSidebar settings={settings} user={user} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
