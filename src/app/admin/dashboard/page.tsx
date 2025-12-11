import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { posts, comments, sessions } from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

export default async function AdminDashboardPage() {
    const t = await getTranslations('admin');
    
    // Fetch counts in parallel
    const [postCount] = await db.select({ count: count() }).from(posts);
    const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.status, 'pending'));
    // Visitors is approximated by sessions or unique IPs in sessions over 30 days
    const [visitorCount] = await db.select({ count: count() }).from(sessions);

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('dashboard')}</h1>
                <p className="text-gray-500 text-base font-normal leading-normal mt-2">{t('dashboardDesc')}</p>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalPosts')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{postCount.count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pendingComments')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{commentCount.count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalSessions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{visitorCount.count}</div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-gray-900 dark:text-gray-50 text-[22px] font-bold leading-tight tracking-[-0.015em]">{t('websiteTraffic')}</h2>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-md border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">{t('trafficChartPending')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            </main>
        </div>
    );
}
