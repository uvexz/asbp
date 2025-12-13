import Link from 'next/link';
import { FileText, File, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostsTable } from '@/components/layout/posts-table';
import { Pagination } from '@/components/ui/pagination';
import { getPosts } from '@/app/actions/posts';
import { getTranslations } from 'next-intl/server';

type PostType = 'post' | 'page' | 'memo';

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string; q?: string }> }) {
    const { type, page, q: searchQuery } = await searchParams;
    const currentPage = parseInt(page || '1', 10);
    const { posts: allPosts, totalPages } = await getPosts(currentPage, 10, searchQuery);
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');
    
    // Default to 'post' type if not specified
    const currentType = (type || 'post') as PostType;
    
    // Filter by type
    const posts = allPosts.filter(p => (p.postType || 'post') === currentType);

    return (
        <div className="flex flex-col min-h-full">
            <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('contentManagement')}</h1>
                    <p className="text-gray-500 text-base font-normal leading-normal">{t('contentManagementDesc')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/posts/edit?type=memo">
                        <Button variant="outline" size="sm">
                            <MessageSquare className="mr-2 h-4 w-4" /> {t('newMemo')}
                        </Button>
                    </Link>
                    <Link href="/admin/posts/edit?type=page">
                        <Button variant="outline" size="sm">
                            <File className="mr-2 h-4 w-4" /> {t('newPage')}
                        </Button>
                    </Link>
                    <Link href="/admin/posts/edit?type=post">
                        <Button className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold" size="sm">
                            <FileText className="mr-2 h-4 w-4" /> {t('newPost')}
                        </Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6">
                <div className="mb-6">
                    <div className="flex gap-2">
                        <Link href="/admin/posts?type=post">
                            <Badge variant={currentType === 'post' ? "default" : "outline"} className="cursor-pointer">
                                {t('post')}
                            </Badge>
                        </Link>
                        <Link href="/admin/posts?type=page">
                            <Badge variant={currentType === 'page' ? "default" : "outline"} className="cursor-pointer">
                                {t('page')}
                            </Badge>
                        </Link>
                        <Link href="/admin/posts?type=memo">
                            <Badge variant={currentType === 'memo' ? "default" : "outline"} className="cursor-pointer">
                                {t('memo')}
                            </Badge>
                        </Link>
                    </div>
                </div>
                <PostsTable 
                    posts={posts}
                    currentType={currentType}
                    searchQuery={searchQuery}
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
                    }}
                />
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            baseUrl={`/admin/posts?type=${currentType}`}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
