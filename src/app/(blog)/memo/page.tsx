import { getPublishedMemos } from '@/app/actions/posts';
import { Pagination } from '@/components/ui/pagination';
import { MemoContent } from '@/components/ui/memo-content';
import { getTranslations } from 'next-intl/server';

interface MemoPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function MemoPage({ searchParams }: MemoPageProps) {
    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const pageSize = 20;
    const t = await getTranslations('blog');
    
    const { memos, totalPages } = await getPublishedMemos(currentPage, pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between gap-3">
                <h1 className="text-black text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">{t('memos')}</h1>
            </div>
            <div className="space-y-6">
                {memos.map((memo) => (
                    <article key={memo.id} className="border-b border-neutral-200 pb-6">
                        <div className="prose prose-neutral max-w-none prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                            <MemoContent content={memo.content} />
                        </div>
                        <p className="text-neutral-400 text-sm mt-4">
                            {new Date(memo.createdAt).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </article>
                ))}
                {memos.length === 0 && <p className="text-neutral-500">{t('noMemos')}</p>}
            </div>
            
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                baseUrl="/memo"
            />
        </div>
    );
}
