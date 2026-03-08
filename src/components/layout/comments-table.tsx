'use client';

import { Check, UserCheck } from 'lucide-react';
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
import { DeleteButton } from '@/components/ui/delete-button';
import { approveComment, deleteComment } from '@/app/actions/comments';
import { formatDate } from '@/lib/date-utils';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
                {labels.noCommentsFound}
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-3 md:hidden">
                {comments.map((comment) => (
                    <div key={comment.id} className="space-y-3 rounded-xl border bg-card p-4 text-card-foreground">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{comment.author || labels.guest}</span>
                                    <Badge variant={getStatusBadgeVariant(comment.status)} className="shadow-none">
                                        {getStatusLabel(comment.status, labels.statusLabels)}
                                    </Badge>
                                </div>
                                <p className="line-clamp-2 text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                {comment.status !== 'approved' && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            onClick={() => handleApprove(comment.id, false)}
                                            disabled={isPending}
                                            title={labels.approveTitle}
                                            aria-label={labels.approveTitle}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon-sm"
                                            onClick={() => handleApprove(comment.id, true)}
                                            disabled={isPending}
                                            title={labels.addToWhitelist}
                                            aria-label={labels.addToWhitelist}
                                        >
                                            <UserCheck className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                <DeleteButton
                                    onDelete={async () => {
                                        await deleteComment(comment.id);
                                    }}
                                    title={labels.deleteCommentTitle}
                                    description={labels.deleteCommentDescription}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{comment.postTitle || labels.deletedPost}</span>
                            <span>·</span>
                            <span>{formatDate(comment.createdAt)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden rounded-xl border bg-card md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[110px]">{labels.status}</TableHead>
                            <TableHead>{labels.author}</TableHead>
                            <TableHead>{labels.comment}</TableHead>
                            <TableHead>{labels.posts}</TableHead>
                            <TableHead>{labels.date}</TableHead>
                            <TableHead className="text-right">{labels.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {comments.map((comment) => (
                            <TableRow key={comment.id}>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(comment.status)} className="shadow-none">
                                        {getStatusLabel(comment.status, labels.statusLabels)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-foreground">{comment.author || labels.guest}</TableCell>
                                <TableCell className="max-w-xs truncate text-muted-foreground">{comment.content}</TableCell>
                                <TableCell className="text-muted-foreground">{comment.postTitle || labels.deletedPost}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(comment.createdAt)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {comment.status !== 'approved' && (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    onClick={() => handleApprove(comment.id, false)}
                                                    disabled={isPending}
                                                    title={labels.approveTitle}
                                                    aria-label={labels.approveTitle}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon-sm"
                                                    onClick={() => handleApprove(comment.id, true)}
                                                    disabled={isPending}
                                                    title={labels.addToWhitelist}
                                                    aria-label={labels.addToWhitelist}
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        <DeleteButton
                                            onDelete={async () => {
                                                await deleteComment(comment.id);
                                            }}
                                            title={labels.deleteCommentTitle}
                                            description={labels.deleteCommentDescription}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
