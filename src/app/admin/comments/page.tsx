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
        <div className="flex min-h-full flex-col">
            <header className="flex flex-col gap-2 px-4 py-6 sm:px-6">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('commentManagement')}</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('commentManagementDesc')}</p>
            </header>
            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
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
                        commentApproved: t('commentApproved'),
                        commentApprovedWhitelisted: t('commentApprovedWhitelisted'),
                        deleteCommentTitle: t('deleteCommentTitle'),
                        deleteCommentDescription: t('deleteCommentDescription'),
                        approveTitle: t('approve'),
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
