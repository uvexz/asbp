'use client';

import Link from 'next/link';
import { Edit, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DeleteButton } from '@/components/ui/delete-button';
import { deletePost } from '@/app/actions/posts';
import { formatDate } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type PostType = 'post' | 'page' | 'memo';

interface Post {
    id: string;
    title: string;
    content: string;
    postType: PostType | null;
    published: boolean | null;
    publishedAt: Date | null;
    createdAt: Date;
}

interface PostsTableProps {
    posts: Post[];
    currentType: PostType;
    searchQuery?: string;
    labels: {
        titleOrContent: string;
        type: string;
        status: string;
        date: string;
        actions: string;
        published: string;
        draft: string;
        noContent: string;
        post: string;
        page: string;
        memo: string;
        search?: string;
        searchPlaceholder?: string;
    };
}

export function PostsTable({ posts, currentType, searchQuery = '', labels }: PostsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(searchQuery);

    const postTypeLabels: Record<PostType, string> = {
        post: labels.post,
        page: labels.page,
        memo: labels.memo,
    };

    const postTypeColors: Record<PostType, string> = {
        post: 'bg-blue-100 text-blue-800',
        page: 'bg-purple-100 text-purple-800',
        memo: 'bg-orange-100 text-orange-800',
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            const params = new URLSearchParams();
            params.set('type', currentType);
            if (search.trim()) {
                params.set('q', search.trim());
            }
            router.push(`/admin/posts?${params.toString()}`);
        });
    };

    const clearSearch = () => {
        setSearch('');
        startTransition(() => {
            router.push(`/admin/posts?type=${currentType}`);
        });
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={labels.searchPlaceholder || '搜索标题或内容...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                        disabled={isPending}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button type="submit" variant="secondary" disabled={isPending}>
                    {labels.search || '搜索'}
                </Button>
            </form>

            {/* Results info */}
            {searchQuery && (
                <p className="text-sm text-muted-foreground">
                    搜索 &quot;{searchQuery}&quot; 找到 {posts.length} 条结果
                </p>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {posts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">{labels.noContent}</div>
                ) : (
                    posts.map((post) => {
                        const postType = (post.postType || 'post') as PostType;
                        const isMemo = postType === 'memo';
                        return (
                            <div key={post.id} className="rounded-lg border bg-white dark:bg-black p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-medium text-sm line-clamp-2 flex-1">
                                        {isMemo ? post.content.slice(0, 80) + (post.content.length > 80 ? '...' : '') : post.title}
                                    </h3>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Link href={`/admin/posts/edit?id=${post.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                        </Link>
                                        <DeleteButton
                                            onDelete={async () => {
                                                await deletePost(post.id);
                                            }}
                                            title="删除内容"
                                            description={`确定要删除「${isMemo ? post.content.slice(0, 20) : post.title}」吗？此操作无法撤销。`}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`${postTypeColors[postType]} shadow-none text-xs`}>
                                        {postTypeLabels[postType]}
                                    </Badge>
                                    <Badge className="bg-[#4cdf20]/20 text-gray-900 shadow-none text-xs">
                                        {post.published ? labels.published : labels.draft}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(post.publishedAt || post.createdAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border bg-white dark:bg-black">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{labels.titleOrContent}</TableHead>
                            <TableHead>{labels.type}</TableHead>
                            <TableHead>{labels.status}</TableHead>
                            <TableHead>{labels.date}</TableHead>
                            <TableHead className="text-right">{labels.actions}</TableHead>
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
                                            {post.published ? labels.published : labels.draft}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(post.publishedAt || post.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/posts/edit?id=${post.id}`}>
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                            </Link>
                                            <DeleteButton
                                                onDelete={async () => {
                                                    await deletePost(post.id);
                                                }}
                                                title="删除内容"
                                                description={`确定要删除「${isMemo ? post.content.slice(0, 20) : post.title}」吗？此操作无法撤销。`}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {posts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">{labels.noContent}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
