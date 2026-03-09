import { getTranslations } from 'next-intl/server';
import { getComments } from '@/app/actions/comments';
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
            <header className="flex flex-col gap-4 px-4 py-6 sm:px-6">
                <div className="max-w-2xl space-y-2">
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('commentManagement')}</h1>
                    <p className="text-sm leading-6 text-muted-foreground sm:text-base">{t('commentManagementDesc')}</p>
                </div>
            </header>
            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <div className="flex flex-col gap-5">
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
                            statusLabels: {
                                approved: t('commentStatusApproved'),
                                pending: t('commentStatusPending'),
                                unknown: t('commentStatusUnknown'),
                            },
                        }}
                    />
                    {totalPages > 1 ? (
                        <div className="flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                baseUrl="/admin/comments"
                            />
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
