'use client';

import { Check, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { approveComment, deleteComment } from '@/app/actions/comments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/date-utils';

interface Comment {
    id: string;
    status: string | null;
    author: string | null;
    content: string;
    postTitle: string | null;
    createdAt: Date;
}

interface CommentsTableProps {
    comments: Comment[];
    labels: {
        status: string;
        author: string;
        comment: string;
        posts: string;
        date: string;
        actions: string;
        guest: string;
        deletedPost: string;
        noCommentsFound: string;
        addToWhitelist: string;
        commentApproved: string;
        commentApprovedWhitelisted: string;
        deleteCommentTitle: string;
        deleteCommentDescription: string;
        approveTitle: string;
        statusLabels: {
            approved: string;
            pending: string;
            unknown: string;
        };
    };
}

function getStatusBadgeVariant(status: string | null): 'default' | 'secondary' | 'outline' {
    if (status === 'approved') return 'default';
    if (status === 'pending') return 'secondary';
    return 'outline';
}

function getStatusLabel(
    status: string | null,
    statusLabels: CommentsTableProps['labels']['statusLabels'],
) {
    if (status === 'approved') return statusLabels.approved;
    if (status === 'pending') return statusLabels.pending;
    return statusLabels.unknown;
}

export function CommentsTable({ comments, labels }: CommentsTableProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleApprove = (id: string, addToWhitelist: boolean = false) => {
        startTransition(async () => {
            await approveComment(id, addToWhitelist);
            toast.success(addToWhitelist ? labels.commentApprovedWhitelisted : labels.commentApproved);
            router.refresh();
        });
    };

    if (comments.length === 0) {
        return (
            <section className="overflow-hidden rounded-2xl border bg-card px-4 py-14 sm:px-5">
                <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                    {labels.noCommentsFound}
                </div>
            </section>
        );
    }

    return (
        <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="divide-y md:hidden">
                {comments.map((comment) => {
                    const statusLabel = getStatusLabel(comment.status, labels.statusLabels);
                    const postTitle = comment.postTitle || labels.deletedPost;

                    return (
                        <article key={comment.id} className="space-y-4 px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={getStatusBadgeVariant(comment.status)} className="shadow-none text-[11px]">
                                            {statusLabel}
                                        </Badge>
                                        <span className="text-sm font-medium text-foreground">{comment.author || labels.guest}</span>
                                    </div>
                                    <p className="line-clamp-4 break-words text-sm leading-6 text-foreground">{comment.content}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    {comment.status !== 'approved' ? (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleApprove(comment.id, false)}
                                                disabled={isPending}
                                                title={labels.approveTitle}
                                                aria-label={labels.approveTitle}
                                                className="h-11 w-11 rounded-xl"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => handleApprove(comment.id, true)}
                                                disabled={isPending}
                                                title={labels.addToWhitelist}
                                                aria-label={labels.addToWhitelist}
                                                className="h-11 w-11 rounded-xl"
                                            >
                                                <UserCheck className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : null}
                                    <DeleteButton
                                        onDelete={async () => {
                                            await deleteComment(comment.id);
                                        }}
                                        title={labels.deleteCommentTitle}
                                        description={labels.deleteCommentDescription}
                                        ariaLabel={labels.deleteCommentTitle}
                                        className="h-11 w-11 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                                <p className="line-clamp-2 break-words">{postTitle}</p>
                                <p>{formatDate(comment.createdAt)}</p>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="hidden md:block">
                <Table className="table-fixed">
                    <TableHeader className="bg-muted/20">
                        <TableRow>
                            <TableHead className="w-[130px]">{labels.status}</TableHead>
                            <TableHead className="w-[180px]">{labels.author}</TableHead>
                            <TableHead>{labels.comment}</TableHead>
                            <TableHead className="w-[200px]">{labels.posts}</TableHead>
                            <TableHead className="w-[140px]">{labels.date}</TableHead>
                            <TableHead className="w-[150px] text-right">{labels.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {comments.map((comment) => {
                            const statusLabel = getStatusLabel(comment.status, labels.statusLabels);
                            const postTitle = comment.postTitle || labels.deletedPost;

                            return (
                                <TableRow key={comment.id}>
                                    <TableCell className="py-4 align-top">
                                        <Badge variant={getStatusBadgeVariant(comment.status)} className="shadow-none">
                                            {statusLabel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 align-top whitespace-normal">
                                        <div className="break-words font-medium text-foreground">{comment.author || labels.guest}</div>
                                    </TableCell>
                                    <TableCell className="py-4 align-top whitespace-normal">
                                        <p className="line-clamp-3 break-words text-sm leading-6 text-foreground">{comment.content}</p>
                                    </TableCell>
                                    <TableCell className="py-4 align-top whitespace-normal text-sm text-muted-foreground">
                                        <p className="line-clamp-2 break-words">{postTitle}</p>
                                    </TableCell>
                                    <TableCell className="py-4 align-top text-muted-foreground">
                                        {formatDate(comment.createdAt)}
                                    </TableCell>
                                    <TableCell className="py-4 align-top text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {comment.status !== 'approved' ? (
                                                <>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleApprove(comment.id, false)}
                                                        disabled={isPending}
                                                        title={labels.approveTitle}
                                                        aria-label={labels.approveTitle}
                                                        className="h-9 w-9 rounded-md"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={() => handleApprove(comment.id, true)}
                                                        disabled={isPending}
                                                        title={labels.addToWhitelist}
                                                        aria-label={labels.addToWhitelist}
                                                        className="h-9 w-9 rounded-md"
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : null}
                                            <DeleteButton
                                                onDelete={async () => {
                                                    await deleteComment(comment.id);
                                                }}
                                                title={labels.deleteCommentTitle}
                                                description={labels.deleteCommentDescription}
                                                ariaLabel={labels.deleteCommentTitle}
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
        </section>
    );
}
