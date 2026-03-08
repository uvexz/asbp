import { getPublishedMemos } from '@/app/actions/posts';
import { Pagination } from '@/components/ui/pagination';
import { MemoContent } from '@/components/ui/memo-content';
import { MemoActionsAdminGate, MemoQuickPostAdminGate } from '@/components/layout/memo-admin-controls';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSettings } from '@/app/actions/settings';
import { formatLocalizedDateTime } from '@/lib/date-utils';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteTitle = settings.siteTitle || 'My Blog';
  const t = await getTranslations('blog');

  return {
    title: `${t('memos')} - ${siteTitle}`,
  };
}

interface MemoPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MemoPage({ searchParams }: MemoPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const pageSize = 20;
  const [t, locale] = await Promise.all([
    getTranslations('blog'),
    getLocale(),
  ]);

  const { memos, totalPages } = await getPublishedMemos(currentPage, pageSize);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('memos')}</h1>
        <MemoQuickPostAdminGate />
      </div>

      <div className="space-y-8">
        {memos.map((memo) => (
          <article key={memo.id} className="space-y-3 border-b border-border/60 pb-8 last:border-b-0 last:pb-0">
            <p className="text-sm text-muted-foreground">
              {formatLocalizedDateTime(memo.createdAt, locale)}
            </p>
            <MemoContent content={memo.content} />
            <div className="flex justify-end">
              <MemoActionsAdminGate memoId={memo.id} content={memo.content} />
            </div>
          </article>
        ))}
        {memos.length === 0 && <p className="text-muted-foreground">{t('noMemos')}</p>}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/memo"
      />
    </div>
  );
}
