import Link from 'next/link';
import { File, FileText, MessageSquare } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getPosts } from '@/app/actions/posts';
import { PostsTable } from '@/components/layout/posts-table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

type PostType = 'post' | 'page' | 'memo';

const postTypeConfig: Record<PostType, { key: PostType; icon: typeof FileText }> = {
    post: { key: 'post', icon: FileText },
    page: { key: 'page', icon: File },
    memo: { key: 'memo', icon: MessageSquare },
};

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string; q?: string }> }) {
    const { type, page, q: searchQuery } = await searchParams;
    const currentPage = parseInt(page || '1', 10);
    const currentType = (type || 'post') as PostType;
    const { posts, total, totalPages } = await getPosts(currentPage, 10, searchQuery, currentType);
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');

    const typeOptions: { key: PostType; label: string }[] = [
        { key: 'post', label: t('post') },
        { key: 'page', label: t('page') },
        { key: 'memo', label: t('memo') },
    ];

    const createActions: { key: PostType; href: string; label: string; variant: 'outline' | 'default' }[] = [
        { key: 'memo', href: '/admin/posts/edit?type=memo', label: t('newMemo'), variant: 'outline' },
        { key: 'page', href: '/admin/posts/edit?type=page', label: t('newPage'), variant: 'outline' },
        { key: 'post', href: '/admin/posts/edit?type=post', label: t('newPost'), variant: 'default' },
    ];

    return (
        <div className="flex min-h-full flex-col">
            <header className="flex flex-col gap-4 px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-2">
                        <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('contentManagement')}</h1>
                        <p className="text-sm leading-6 text-muted-foreground sm:text-base">{t('contentManagementDesc')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {createActions.map(({ key, href, label, variant }) => {
                            const Icon = postTypeConfig[key].icon;

                            return (
                                <Button key={key} asChild variant={variant} size="sm" className="min-w-[7.5rem] justify-center">
                                    <Link href={href}>
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </Link>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <div className="flex flex-col gap-5">
                    <nav
                        aria-label={tCommon('type')}
                        className="inline-flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-2xl border bg-card p-1 sm:w-auto"
                    >
                        {typeOptions.map(({ key, label }) => {
                            const isActive = currentType === key;

                            return (
                                <Link
                                    key={key}
                                    href={`/admin/posts?type=${key}`}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    <PostsTable
                        posts={posts}
                        currentType={currentType}
                        searchQuery={searchQuery}
                        totalResults={total}
                        labels={{
                            titleOrContent: t('titleOrContent'),
                            type: tCommon('type'),
                            status: tCommon('status'),
                            date: tCommon('date'),
                            actions: tCommon('actions'),
                            published: t('published'),
                            draft: t('draft'),
                            noContent: t('noContent'),
                            post: t('post'),
                            page: t('page'),
                            memo: t('memo'),
                            search: tCommon('search'),
                            searchPlaceholder: t('searchPlaceholder'),
                            searchResults: t('searchResults', { query: '{query}', count: '{count}' }),
                            deleteContentTitle: t('deleteContentTitle'),
                            deleteContentDescription: (title: string) => t('deleteContentDescription', { title }),
                            edit: tCommon('edit'),
                            clearSearch: tCommon('clearSearch'),
                        }}
                    />

                    {totalPages > 1 ? (
                        <div className="flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                baseUrl={`/admin/posts?type=${currentType}`}
                            />
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
