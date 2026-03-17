'use client';

import Link from 'next/link';
import { Edit, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deletePost } from '@/app/actions/posts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

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
    totalResults?: number;
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
        search: string;
        searchPlaceholder: string;
        searchResults: string;
        deleteContentTitle: string;
        deleteContentDescription: string;
        edit: string;
        clearSearch: string;
    };
}

function getTypeBadgeVariant(postType: PostType): 'default' | 'secondary' | 'outline' {
    if (postType === 'post') return 'default';
    if (postType === 'page') return 'secondary';
    return 'outline';
}

function normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
}

function getDisplayText(post: Post, postType: PostType) {
    const source = postType === 'memo' ? post.content : post.title;
    return normalizeText(source);
}

function truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength)}...`;
}

export function PostsTable({ posts, currentType, searchQuery = '', totalResults, labels }: PostsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(searchQuery);

    const postTypeLabels: Record<PostType, string> = {
        post: labels.post,
        page: labels.page,
        memo: labels.memo,
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
        <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-4 sm:px-5">
                <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            aria-label={labels.search}
                            placeholder={labels.searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 rounded-lg border-border/80 bg-background pl-9 pr-10 shadow-none"
                            disabled={isPending}
                        />
                        {search ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={clearSearch}
                                className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
                                disabled={isPending}
                                aria-label={labels.clearSearch}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                    <Button type="submit" variant="secondary" disabled={isPending} className="w-full sm:w-auto">
                        {labels.search}
                    </Button>
                </form>
                {searchQuery ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                        {labels.searchResults.replace('{query}', searchQuery).replace('{count}', String(totalResults ?? posts.length))}
                    </p>
                ) : null}
            </div>

            {posts.length === 0 ? (
                <div className="px-4 py-14 sm:px-5">
                    <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                        {labels.noContent}
                    </div>
                </div>
            ) : (
                <>
                    <div className="divide-y md:hidden">
                        {posts.map((post) => {
                            const postType = (post.postType || 'post') as PostType;
                            const isMemo = postType === 'memo';
                            const displayText = getDisplayText(post, postType) || postTypeLabels[postType];

                            return (
                                <article key={post.id} className="space-y-4 px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant={getTypeBadgeVariant(postType)} className="shadow-none text-[11px]">
                                                    {postTypeLabels[postType]}
                                                </Badge>
                                                <Badge variant={post.published ? 'default' : 'outline'} className="shadow-none text-[11px]">
                                                    {post.published ? labels.published : labels.draft}
                                                </Badge>
                                            </div>
                                            <h3
                                                className={cn(
                                                    'min-w-0 break-words text-sm font-medium leading-6 text-foreground',
                                                    isMemo ? 'line-clamp-4' : 'line-clamp-2'
                                                )}
                                            >
                                                {displayText}
                                            </h3>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl text-muted-foreground hover:text-foreground"
                                            >
                                                <Link href={`/admin/posts/edit?id=${post.id}`} aria-label={labels.edit}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <DeleteButton
                                                onDelete={async () => {
                                                    await deletePost(post.id);
                                                }}
                                                title={labels.deleteContentTitle}
                                                description={labels.deleteContentDescription.replace('{title}', truncateText(displayText, 20))}
                                                ariaLabel={labels.deleteContentTitle}
                                                className="h-11 w-11 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div className="hidden md:block">
                        <Table className="table-fixed">
                            <TableHeader className="bg-muted/20">
                                <TableRow>
                                    <TableHead className="w-[46%]">{labels.titleOrContent}</TableHead>
                                    <TableHead className="w-[110px]">{labels.type}</TableHead>
                                    <TableHead className="w-[120px]">{labels.status}</TableHead>
                                    <TableHead className="w-[150px]">{labels.date}</TableHead>
                                    <TableHead className="w-[120px] text-right">{labels.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post) => {
                                    const postType = (post.postType || 'post') as PostType;
                                    const isMemo = postType === 'memo';
                                    const displayText = getDisplayText(post, postType) || postTypeLabels[postType];

                                    return (
                                        <TableRow key={post.id}>
                                            <TableCell className="py-4 align-top whitespace-normal">
                                                <div className="min-w-0 max-w-xl">
                                                    <p
                                                        className={cn(
                                                            'break-words font-medium leading-6 text-foreground',
                                                            isMemo ? 'line-clamp-3 text-sm' : 'line-clamp-2'
                                                        )}
                                                    >
                                                        {displayText}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-top">
                                                <Badge variant={getTypeBadgeVariant(postType)} className="shadow-none">
                                                    {postTypeLabels[postType]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 align-top">
                                                <Badge variant={post.published ? 'default' : 'outline'} className="shadow-none">
                                                    {post.published ? labels.published : labels.draft}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 align-top text-muted-foreground">
                                                {formatDate(post.publishedAt || post.createdAt)}
                                            </TableCell>
                                            <TableCell className="py-4 align-top text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Link href={`/admin/posts/edit?id=${post.id}`} aria-label={labels.edit}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <DeleteButton
                                                        onDelete={async () => {
                                                            await deletePost(post.id);
                                                        }}
                                                        title={labels.deleteContentTitle}
                                                        description={labels.deleteContentDescription.replace('{title}', truncateText(displayText, 20))}
                                                        ariaLabel={labels.deleteContentTitle}
                                                        className="h-9 w-9 rounded-md"
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </section>
    );
}
