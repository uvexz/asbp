import { getPublishedMemos } from '@/app/actions/posts';
import { Pagination } from '@/components/ui/pagination';
import { MemoContent } from '@/components/ui/memo-content';
import { MemoQuickPost } from '@/components/layout/memo-quick-post';
import { MemoActions } from '@/components/layout/memo-actions';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { hasS3Config, getSettings } from '@/app/actions/settings';
import { headers } from 'next/headers';
import { Calendar } from 'lucide-react';
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
    const t = await getTranslations('blog');
    
    const { memos, totalPages } = await getPublishedMemos(currentPage, pageSize);
    
    // Check if user is admin for quick post button
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const isAdmin = session?.user?.role === 'admin';
    const hasS3 = isAdmin ? await hasS3Config() : false;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-black text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">{t('memos')}</h1>
                {isAdmin && <MemoQuickPost hasS3={hasS3} />}
            </div>
            <div className="space-y-6">
                {memos.map((memo) => (
                    <article key={memo.id} className="border-b border-neutral-200 pb-6 group">
                        <div className="prose prose-neutral max-w-none prose-a:text-blue-600 prose-a:no-underline">
                            <MemoContent content={memo.content} />
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-neutral-400 text-sm flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(memo.createdAt).toLocaleDateString('zh-CN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            {isAdmin && (
                                <MemoActions 
                                    memoId={memo.id} 
                                    content={memo.content} 
                                    hasS3={hasS3} 
                                />
                            )}
                        </div>
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
