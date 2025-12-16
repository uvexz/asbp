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
        addToWhitelist?: string;
    };
}

export function CommentsTable({ comments, labels }: CommentsTableProps) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = (id: string, addToWhitelist: boolean = false) => {
        startTransition(async () => {
            await approveComment(id, addToWhitelist);
            toast.success(addToWhitelist ? '评论已通过并加入白名单' : '评论已通过审核');
        });
    };

    const getStatusBadgeClass = (status: string | null) => {
        if (status === 'approved') return "bg-green-100 text-green-700 shadow-none";
        if (status === 'pending') return "bg-yellow-100 text-yellow-700 shadow-none";
        return "bg-gray-100 text-gray-700 shadow-none";
    };

    return (
        <div>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">{labels.noCommentsFound}</div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border bg-white dark:bg-black p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{comment.author || labels.guest}</span>
                                        <Badge className={`${getStatusBadgeClass(comment.status)} text-xs`}>
                                            {comment.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{comment.content}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {comment.status !== 'approved' && (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                                onClick={() => handleApprove(comment.id, false)}
                                                disabled={isPending}
                                                title="通过"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                onClick={() => handleApprove(comment.id, true)}
                                                disabled={isPending}
                                                title={labels.addToWhitelist || '通过并加入白名单'}
                                            >
                                                <UserCheck className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    <DeleteButton
                                        onDelete={async () => {
                                            await deleteComment(comment.id);
                                        }}
                                        title="删除评论"
                                        description="确定要删除这条评论吗？此操作无法撤销。"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{comment.postTitle || labels.deletedPost}</span>
                                <span>·</span>
                                <span>{formatDate(comment.createdAt)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border bg-white dark:bg-black">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">{labels.status}</TableHead>
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
                                    <Badge className={`${getStatusBadgeClass(comment.status)} hover:opacity-80`}>
                                        {comment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{comment.author || labels.guest}</TableCell>
                                <TableCell className="max-w-xs truncate text-gray-500">{comment.content}</TableCell>
                                <TableCell className="text-gray-500">{comment.postTitle || labels.deletedPost}</TableCell>
                                <TableCell className="text-gray-500">{formatDate(comment.createdAt)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {comment.status !== 'approved' && (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-green-600 hover:bg-green-50"
                                                    onClick={() => handleApprove(comment.id, false)}
                                                    disabled={isPending}
                                                    title="通过"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleApprove(comment.id, true)}
                                                    disabled={isPending}
                                                    title={labels.addToWhitelist || '通过并加入白名单'}
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        <DeleteButton
                                            onDelete={async () => {
                                                await deleteComment(comment.id);
                                            }}
                                            title="删除评论"
                                            description="确定要删除这条评论吗？此操作无法撤销。"
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {comments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-gray-500">{labels.noCommentsFound}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
