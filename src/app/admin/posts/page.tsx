import Link from 'next/link';
import { Edit, Trash2, FileText, File, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getPosts, deletePost } from '@/app/actions/posts';
import { formatDate } from '@/lib/date-utils';
import { getTranslations } from 'next-intl/server';

type PostType = 'post' | 'page' | 'memo';

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const { type } = await searchParams;
    const allPosts = await getPosts();
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');
    
    const postTypeLabels: Record<PostType, string> = {
        post: t('post'),
        page: t('page'),
        memo: t('memo'),
    };

    const postTypeColors: Record<PostType, string> = {
        post: 'bg-blue-100 text-blue-800',
        page: 'bg-purple-100 text-purple-800',
        memo: 'bg-orange-100 text-orange-800',
    };
    
    // Filter by type if specified
    const posts = type 
        ? allPosts.filter(p => (p.postType || 'post') === type)
        : allPosts;

    const currentType = type as PostType | undefined;

    return (
        <div className="flex flex-col h-full">
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
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
                <div className="mb-6">
                    <div className="flex gap-2">
                        <Link href="/admin/posts">
                            <Badge variant={!currentType ? "default" : "outline"} className="cursor-pointer">
                                {tCommon('all')}
                            </Badge>
                        </Link>
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
                <div className="rounded-md border bg-white dark:bg-black">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('titleOrContent')}</TableHead>
                                <TableHead>{tCommon('type')}</TableHead>
                                <TableHead>{tCommon('status')}</TableHead>
                                <TableHead>{tCommon('date')}</TableHead>
                                <TableHead className="text-right">{tCommon('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.map((post) => {
                                const postType = (post.postType || 'post') as PostType;
                                const isMemo = postType === 'memo';
                                return (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium max-w-xs truncate">
                                            {isMemo ? post.content.slice(0, 50) + (post.content.length > 50 ? '...' : '') : post.title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${postTypeColors[postType]} shadow-none`}>
                                                {postTypeLabels[postType]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-[#4cdf20]/20 text-gray-900 hover:bg-[#4cdf20]/30 shadow-none">
                                                {post.published ? t('published') : t('draft')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(post.publishedAt || post.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/posts/edit?id=${post.id}`}>
                                                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                </Link>
                                                <form action={deletePost.bind(null, post.id)}>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /></Button>
                                                </form>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {posts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-gray-500">{t('noContent')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
}
