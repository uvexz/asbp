import { BlogHeader } from '@/components/layout/blog-header';
import { BlogFooter } from '@/components/layout/blog-footer';
import { getSettings, hasS3Config } from '@/app/actions/settings';
import { getNavItems } from '@/app/actions/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getSettings();
    const navItems = await getNavItems();
    const siteTitle = settings.siteTitle || 'My Blog';
    
    // Check if user is admin and S3 config
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const isAdmin = session?.user?.role === 'admin';
    const hasS3 = isAdmin ? await hasS3Config() : false;

    return (
        <div className="bg-white font-sans">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    <div className="px-4 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col max-w-[768px] flex-1">
                            <BlogHeader siteTitle={siteTitle} navItems={navItems} isAdmin={isAdmin} hasS3={hasS3} />
                            <main className="flex-1 px-4 sm:px-10 py-10 space-y-12">
                                {children}
                            </main>
                            <BlogFooter siteTitle={siteTitle} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
