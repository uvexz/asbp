import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { getComments, approveComment, deleteComment } from "@/app/actions/comments";
import { formatDate } from "@/lib/date-utils";
import { getTranslations } from 'next-intl/server';

export default async function AdminCommentsPage() {
    const comments = await getComments();
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('commentManagement')}</h1>
                <p className="text-gray-500 text-base font-normal leading-normal mt-2">{t('commentManagementDesc')}</p>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
                <div className="rounded-md border bg-white dark:bg-black">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">{tCommon('status')}</TableHead>
                                <TableHead>{t('author')}</TableHead>
                                <TableHead>{t('comment')}</TableHead>
                                <TableHead>{t('posts')}</TableHead>
                                <TableHead>{tCommon('date')}</TableHead>
                                <TableHead className="text-right">{tCommon('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comments.map((comment) => (
                                <TableRow key={comment.id}>
                                    <TableCell>
                                        <Badge className={
                                            comment.status === 'approved' ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-none" :
                                                comment.status === 'pending' ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-none" :
                                                    "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-none"
                                        }>{comment.status}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{comment.author || t('guest')}</TableCell>
                                    <TableCell className="max-w-xs truncate text-gray-500">{comment.content}</TableCell>
                                    <TableCell className="text-gray-500">{comment.postTitle || t('deletedPost')}</TableCell>
                                    <TableCell className="text-gray-500">{formatDate(comment.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {comment.status !== 'approved' && (
                                                <form action={approveComment.bind(null, comment.id)}>
                                                    <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></Button>
                                                </form>
                                            )}
                                            <form action={deleteComment.bind(null, comment.id)}>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {comments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-gray-500">{t('noCommentsFound')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
}
