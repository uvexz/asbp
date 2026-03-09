import type { Metadata } from 'next';
import { getPublishedMemos } from '@/app/actions/posts';
import { MemoActionsAdminGate, MemoQuickPostAdminGate } from '@/components/layout/memo-admin-controls';
import { Pagination } from '@/components/ui/pagination';
import { MemoContent } from '@/components/ui/memo-content';
import { formatLocalizedDateTime } from '@/lib/date-utils';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSettings } from '@/app/actions/settings';

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
    <div className="space-y-8">
      <header className="flex items-center gap-2">
        <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          {t('memos')}
        </h1>
        <div className="opacity-70 transition-opacity hover:opacity-100">
          <MemoQuickPostAdminGate />
        </div>
      </header>

      {memos.length > 0 ? (
        <div className="divide-y divide-border/40">
          {memos.map((memo) => (
            <article key={memo.id} className="group py-7 first:pt-0 last:pb-0">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {formatLocalizedDateTime(memo.createdAt, locale)}
                </p>
                <MemoContent content={memo.content} />
              </div>
              <div className="mt-3 flex justify-end">
                <MemoActionsAdminGate memoId={memo.id} content={memo.content} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t('noMemos')}</p>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/memo"
      />
    </div>
  );
}
