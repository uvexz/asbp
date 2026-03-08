'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface TrafficData {
  pageviews: { x: string; y: number }[];
  sessions: { x: string; y: number }[];
}

interface TrafficStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

interface TrafficChartProps {
  data: TrafficData | null;
  stats: TrafficStats | null;
  activeVisitors: number;
  isConfigured: boolean;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SimpleBarChart({
  data,
  label,
  barClassName,
}: {
  data: { x: string; y: number }[];
  label: string;
  barClassName: string;
}) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.y), 1);
  const chartHeight = 120;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="flex h-[140px] items-end gap-2 rounded-lg border bg-muted/20 p-3">
        {data.map((item, index) => {
          const height = (item.y / maxValue) * chartHeight;
          const date = new Date(item.x);
          const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' });

          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`w-full rounded-sm transition-opacity hover:opacity-90 ${barClassName}`}
                style={{ height: `${Math.max(height, 2)}px` }}
                title={`${item.y} on ${date.toLocaleDateString()}`}
              />
              <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrafficChart({ data, stats, activeVisitors, isConfigured }: TrafficChartProps) {
  const t = useTranslations('admin');

  if (!isConfigured) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center">
            <p className="font-medium text-foreground">{t('umamiNotConfigured')}</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{t('umamiNotConfiguredDesc')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bounceRate = stats && stats.visits > 0
    ? Math.round((stats.bounces / stats.visits) * 100)
    : 0;

  const avgTime = stats && stats.visits > 0
    ? stats.totaltime / stats.visits / 1000
    : 0;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={t('activeVisitors')} value={activeVisitors} />
          <StatCard label={t('pageviews')} value={stats?.pageviews.toLocaleString() ?? '-'} />
          <StatCard label={t('visitors')} value={stats?.visitors.toLocaleString() ?? '-'} />
          <StatCard label={t('visits')} value={stats?.visits.toLocaleString() ?? '-'} />
          <StatCard label={t('bounceRate')} value={`${bounceRate}%`} />
          <StatCard label={t('avgTime')} value={formatTime(avgTime)} />
        </div>

        {data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SimpleBarChart data={data.pageviews} label={t('pageviews')} barClassName="bg-chart-1" />
            <SimpleBarChart data={data.sessions} label={t('visitors')} barClassName="bg-chart-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
