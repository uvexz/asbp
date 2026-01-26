import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrafficChart } from '@/components/admin/traffic-chart';
import { db } from '@/lib/db';
import { posts, comments, sessions } from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { getSettings } from '@/app/actions/settings';
import { createUmamiClient, UmamiClient } from '@/lib/umami';

async function getUmamiData(client: UmamiClient, isConfigured: boolean) {
    if (!isConfigured) {
        return { trafficData: null, trafficStats: null, activeVisitors: 0 };
    }
    
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const [pageviews, stats, active] = await Promise.all([
        client.getPageviews(sevenDaysAgo, now, 'day'),
        client.getStats(sevenDaysAgo, now),
        client.getActiveVisitors(),
    ]);
    
    return {
        trafficData: pageviews,
        trafficStats: stats,
        activeVisitors: active,
    };
}

export default async function AdminDashboardPage() {
    const t = await getTranslations('admin');
    const settings = await getSettings();
    
    // Fetch counts in parallel
    const [postCount] = await db.select({ count: count() }).from(posts);
    const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.status, 'pending'));
    const [visitorCount] = await db.select({ count: count() }).from(sessions);

    // Fetch Umami stats if configured
    const umamiClient = createUmamiClient(settings);
    const isUmamiConfigured = !!(settings.umamiEnabled && umamiClient.isConfigured());
    
    const { trafficData, trafficStats, activeVisitors } = await getUmamiData(umamiClient, isUmamiConfigured);

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
                    <h2 className="text-gray-900 dark:text-gray-50 text-[22px] font-bold leading-tight tracking-[-0.015em]">
                        {t('websiteTraffic')} <span className="text-sm font-normal text-gray-500">({t('last7Days')})</span>
                    </h2>
                </div>
                <TrafficChart 
                    data={trafficData}
                    stats={trafficStats}
                    activeVisitors={activeVisitors}
                    isConfigured={isUmamiConfigured}
                />
            </div>
            </main>
        </div>
    );
}
