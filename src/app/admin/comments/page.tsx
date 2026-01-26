import { getComments } from "@/app/actions/comments";
import { getTranslations } from 'next-intl/server';
import { CommentsTable } from '@/components/layout/comments-table';
import { Pagination } from '@/components/ui/pagination';

export default async function AdminCommentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page } = await searchParams;
    const currentPage = parseInt(page || '1', 10);
    const { comments, totalPages } = await getComments(currentPage, 20);
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('commentManagement')}</h1>
                <p className="text-gray-500 text-base font-normal leading-normal mt-2">{t('commentManagementDesc')}</p>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
                <CommentsTable 
                    comments={comments}
                    labels={{
                        status: tCommon('status'),
                        author: t('author'),
                        comment: t('comment'),
                        posts: t('posts'),
                        date: tCommon('date'),
                        actions: tCommon('actions'),
                        guest: t('guest'),
                        deletedPost: t('deletedPost'),
                        noCommentsFound: t('noCommentsFound'),
                        addToWhitelist: t('addToWhitelist'),
                    }}
                />
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            baseUrl="/admin/comments"
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
