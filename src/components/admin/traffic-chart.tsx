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
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function SimpleBarChart({ data, label }: { data: { x: string; y: number }[]; label: string }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.y), 1);
  const chartHeight = 120;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="flex items-end gap-1 h-[120px]">
        {data.map((item, index) => {
          const height = (item.y / maxValue) * chartHeight;
          const date = new Date(item.x);
          const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' });
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-blue-500 dark:bg-blue-400 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-300"
                style={{ height: `${Math.max(height, 2)}px` }}
                title={`${item.y} on ${date.toLocaleDateString()}`}
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
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
          <div className="w-full h-80 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-md border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('umamiNotConfigured')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('umamiNotConfiguredDesc')}</p>
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
      <CardContent className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label={t('activeVisitors')} value={activeVisitors} />
          <StatCard label={t('pageviews')} value={stats?.pageviews.toLocaleString() ?? '-'} />
          <StatCard label={t('visitors')} value={stats?.visitors.toLocaleString() ?? '-'} />
          <StatCard label={t('visits')} value={stats?.visits.toLocaleString() ?? '-'} />
          <StatCard label={t('bounceRate')} value={`${bounceRate}%`} />
          <StatCard label={t('avgTime')} value={formatTime(avgTime)} />
        </div>

        {/* Charts */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleBarChart data={data.pageviews} label={t('pageviews')} />
            <SimpleBarChart data={data.sessions} label={t('visitors')} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
