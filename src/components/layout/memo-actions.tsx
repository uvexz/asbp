'use client';

import { useState, useRef } from 'react';
import { Pencil, Trash2, X, Loader2, Eye, Edit, ImagePlus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { updateMemo, deleteMemo } from '@/app/actions/posts';
import { uploadMedia } from '@/app/actions/media';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';

interface MemoActionsProps {
    memoId: string;
    content: string;
    hasS3?: boolean;
}

export function MemoActions({ memoId, content: initialContent, hasS3 = false }: MemoActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations('admin');
    const tCommon = useTranslations('common');

    const handleUpdate = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await updateMemo(memoId, content.trim());
            if (result.success) {
                setIsEditOpen(false);
                setIsPreview(false);
            } else {
                setError(result.error);
            }
        } catch {
            setError('更新失败，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const result = await deleteMemo(memoId);
            if (result.success) {
                setIsDeleteOpen(false);
            } else {
                setError(result.error);
            }
        } catch {
            setError('删除失败，请重试');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadMedia(formData);

            if (result.success && result.data) {
                const imageMarkdown = `![${file.name}](${result.data.url})`;
                setContent(prev => prev + (prev ? '\n' : '') + imageMarkdown);
            } else {
                setError(result.success ? tCommon('uploadFailed') : result.error);
            }
        } catch {
            setError(tCommon('uploadFailedRetry'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const openEdit = () => {
        setContent(initialContent);
        setIsEditOpen(true);
        setError(null);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="p-1 hover:bg-neutral-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="h-4 w-4 text-neutral-400" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={openEdit}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {tCommon('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsDeleteOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {tCommon('delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Modal */}
            {isEditOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsEditOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold text-lg">{t('editMemo')}</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="p-1 hover:bg-neutral-100 rounded"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant={isPreview ? 'ghost' : 'secondary'}
                                            size="sm"
                                            onClick={() => setIsPreview(false)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            {tCommon('edit')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={isPreview ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setIsPreview(true)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            {tCommon('preview')}
                                        </Button>
                                    </div>
                                    {hasS3 && (
                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ImagePlus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {isPreview ? (
                                    <div className="prose prose-neutral prose-sm max-w-none p-3 border rounded-md bg-gray-50 min-h-[120px] overflow-auto">
                                        {content ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                                        ) : (
                                            <p className="text-muted-foreground italic">{tCommon('noContent')}</p>
                                        )}
                                    </div>
                                ) : (
                                    <Textarea
                                        placeholder={t('writeSomething')}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="min-h-[120px] resize-none font-mono text-sm"
                                        autoFocus
                                    />
                                )}

                                {error && <p className="text-sm text-red-500">{error}</p>}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        {tCommon('cancel')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleUpdate}
                                        disabled={!content.trim() || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {tCommon('save')}
                                            </>
                                        ) : (
                                            tCommon('save')
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作无法撤销，确定要删除这条随笔吗？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {tCommon('delete')}
                                </>
                            ) : (
                                tCommon('delete')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
