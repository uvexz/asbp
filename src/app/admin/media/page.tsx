'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, AlertTriangle, Trash2, Image as ImageIcon, FileText, Loader2, Copy, Check } from "lucide-react";
import { getMedia, uploadMedia, deleteMedia, type Media } from "@/app/actions/media";
import { getSettings } from "@/app/actions/settings";
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from 'next-intl';

export default function AdminMediaPage() {
    const [settings, setSettings] = useState<{ s3Bucket: string | null } | null>(null);
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
    const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations('admin');
    const tCommon = useTranslations('common');

    async function copyToClipboard(media: Media) {
        try {
            await navigator.clipboard.writeText(media.url);
            setCopiedId(media.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            setError('Failed to copy link');
        }
    }

    // Load settings and media on mount
    useEffect(() => {
        async function loadData() {
            try {
                const settingsData = await getSettings();
                setSettings(settingsData);
                
                if (settingsData.s3Bucket) {
                    const mediaData = await getMedia();
                    setMediaList(mediaData);
                }
            } catch {
                setError('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    async function refreshMedia() {
        try {
            const mediaData = await getMedia();
            setMediaList(mediaData);
        } catch {
            setError('Failed to refresh media');
        }
    }

    function handleUploadClick() {
        fileInputRef.current?.click();
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            const result = await uploadMedia(formData);
            if (result.success) {
                setSuccessMessage(`Successfully uploaded: ${file.name}`);
                await refreshMedia();
            } else {
                setError(result.error);
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        });
    }

    function openDeleteDialog(media: Media) {
        setMediaToDelete(media);
        setDeleteDialogOpen(true);
    }

    async function handleDelete() {
        if (!mediaToDelete) return;

        setError(null);
        setSuccessMessage(null);

        startTransition(async () => {
            const result = await deleteMedia(mediaToDelete.id);
            if (result.success) {
                setSuccessMessage(`Successfully deleted: ${mediaToDelete.filename}`);
                await refreshMedia();
            } else {
                setError(result.error);
            }
            setDeleteDialogOpen(false);
            setMediaToDelete(null);
        });
    }

    function isImageFile(mimeType: string | null): boolean {
        return mimeType?.startsWith('image/') ?? false;
    }

    function formatFileSize(bytes: number | null): string {
        if (bytes === null) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <p className="text-gray-500 mt-4">{t('loadingMedia')}</p>
            </div>
        );
    }

    // S3 not configured
    if (!settings?.s3Bucket) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center px-4">
                <div className="bg-yellow-100 p-4 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('s3Required')}</h1>
                <p className="text-gray-500 max-w-md mb-6">{t('s3RequiredDesc')}</p>
                <Link href="/admin/settings">
                    <Button className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold">{tCommon('goToSettings')}</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('mediaLibraryTitle')}</h1>
                    <p className="text-gray-500 text-base font-normal leading-normal">{t('mediaLibraryDesc')}</p>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    />
                    <Button 
                        className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold"
                        onClick={handleUploadClick}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {t('uploadNewMedia')}
                    </Button>
                </div>
            </header>

            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
            {/* Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">
                    {successMessage}
                </div>
            )}

            {/* Media Grid */}
            {mediaList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('noMediaFiles')}</h2>
                    <p className="text-gray-500 max-w-md mb-6">{t('noMediaFilesDesc')}</p>
                    <Button 
                        className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold"
                        onClick={handleUploadClick}
                        disabled={isPending}
                    >
                        <Upload className="mr-2 h-4 w-4" /> {t('uploadMedia')}
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                    {mediaList.map((media) => (
                        <div 
                            key={media.id} 
                            className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl relative group overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                            {isImageFile(media.mimeType) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                    src={media.url} 
                                    alt={media.filename}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                    <FileText className="h-12 w-12 text-gray-400 mb-2" />
                                    <span className="text-gray-500 text-sm text-center truncate w-full">
                                        {media.filename}
                                    </span>
                                </div>
                            )}
                            
                            {/* Overlay with info and actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:text-blue-400 hover:bg-blue-500/20"
                                        onClick={() => copyToClipboard(media)}
                                        disabled={isPending}
                                        title={t('copyLink')}
                                    >
                                        {copiedId === media.id ? (
                                            <Check className="h-5 w-5 text-green-400" />
                                        ) : (
                                            <Copy className="h-5 w-5" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:text-red-400 hover:bg-red-500/20"
                                        onClick={() => openDeleteDialog(media)}
                                        disabled={isPending}
                                        title={tCommon('delete')}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div 
                                    className="text-white cursor-pointer"
                                    onClick={() => isImageFile(media.mimeType) && setPreviewMedia(media)}
                                >
                                    <p className="text-sm font-medium truncate">{media.filename}</p>
                                    <p className="text-xs text-gray-300">{formatFileSize(media.size)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Preview Dialog */}
            <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden [&>button]:hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="truncate pr-8">{previewMedia?.filename}</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 pt-2 flex flex-col gap-3">
                        {previewMedia && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewMedia.url}
                                    alt={previewMedia.filename}
                                    className="max-h-[60vh] w-auto mx-auto object-contain rounded-lg"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={previewMedia.url}
                                        className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(previewMedia)}
                                    >
                                        {copiedId === previewMedia.id ? (
                                            <Check className="h-4 w-4 mr-1 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4 mr-1" />
                                        )}
                                        {t('copyLink')}
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {formatFileSize(previewMedia.size)} · {previewMedia.mimeType}
                                </p>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('deleteMedia')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteMediaConfirm', { filename: mediaToDelete?.filename || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isPending}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {tCommon('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </main>
        </div>
    );
}
