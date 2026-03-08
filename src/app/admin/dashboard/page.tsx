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

    const [postCount] = await db.select({ count: count() }).from(posts);
    const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.status, 'pending'));
    const [visitorCount] = await db.select({ count: count() }).from(sessions);

    const umamiClient = createUmamiClient(settings);
    const isUmamiConfigured = !!(settings.umamiEnabled && umamiClient.isConfigured());

    const { trafficData, trafficStats, activeVisitors } = await getUmamiData(umamiClient, isUmamiConfigured);

    return (
        <div className="flex min-h-full flex-col">
            <header className="flex flex-col gap-2 px-4 py-6 sm:px-6">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('dashboard')}</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('dashboardDesc')}</p>
            </header>
            <main className="flex flex-1 flex-col gap-8 overflow-auto px-4 pb-6 sm:px-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalPosts')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight text-foreground">{postCount.count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pendingComments')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight text-foreground">{commentCount.count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalSessions')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight text-foreground">{visitorCount.count}</div>
                        </CardContent>
                    </Card>
                </div>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-foreground">
                            {t('websiteTraffic')} <span className="text-sm font-normal text-muted-foreground">({t('last7Days')})</span>
                        </h2>
                    </div>
                    <TrafficChart
                        data={trafficData}
                        stats={trafficStats}
                        activeVisitors={activeVisitors}
                        isConfigured={isUmamiConfigured}
                    />
                </section>
            </main>
        </div>
    );
}
