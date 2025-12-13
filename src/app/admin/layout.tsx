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

    // 验证管理员角色
    if (session.user.role !== 'admin') {
        redirect("/");
    }

    const settings = await getSettings();

    // Extract user info from session for the sidebar
    const user = {
        id: session.user.id,
        name: session.user.name || session.user.email || 'User',
        email: session.user.email || '',
        image: session.user.image,
        role: session.user.role || 'user',
    };

    return (
        <div className="fixed inset-0 flex flex-col lg:flex-row bg-[#f6f8f6] dark:bg-[#152111] font-sans">
            <AdminMobileHeader settings={settings} user={user} />
            <AdminSidebar settings={settings} user={user} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
