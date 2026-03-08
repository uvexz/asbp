'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
            setError(tCommon('copyFailedRetry'));
        }
    }

    const loadData = useCallback(async () => {
        try {
            const settingsData = await getSettings();
            setSettings(settingsData);

            if (settingsData.s3Bucket) {
                const mediaData = await getMedia();
                setMediaList(mediaData);
            }
        } catch {
            setError(tCommon('loadFailedRetry'));
        } finally {
            setIsLoading(false);
        }
    }, [tCommon]);

    // Load settings and media on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    async function refreshMedia() {
        try {
            const mediaData = await getMedia();
            setMediaList(mediaData);
        } catch {
            setError(tCommon('refreshFailedRetry'));
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
                setSuccessMessage(tCommon('uploadSuccessFile', { name: file.name }));
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
                setSuccessMessage(tCommon('deleteSuccessFile', { name: mediaToDelete.filename }));
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
        if (bytes === null) return tCommon('unknownSize');
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('loadingMedia')}</p>
            </div>
        );
    }

    // S3 not configured
    if (!settings?.s3Bucket) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-foreground">{t('s3Required')}</h1>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">{t('s3RequiredDesc')}</p>
                <Button asChild>
                    <Link href="/admin/settings">{tCommon('goToSettings')}</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('mediaLibraryTitle')}</h1>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('mediaLibraryDesc')}</p>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    />
                    <Button onClick={handleUploadClick} disabled={isPending}>
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
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert" aria-live="polite">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>{error}</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => void loadData()} disabled={isPending}>
                            {tCommon('retry')}
                        </Button>
                    </div>
                </div>
            )}
            {successMessage && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-foreground" aria-live="polite">
                    {successMessage}
                </div>
            )}

            {/* Media Grid */}
            {mediaList.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-full bg-muted p-6 text-muted-foreground">
                        <ImageIcon className="h-12 w-12" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-foreground">{t('noMediaFiles')}</h2>
                    <p className="mb-6 max-w-md text-sm text-muted-foreground">{t('noMediaFilesDesc')}</p>
                    <Button onClick={handleUploadClick} disabled={isPending}>
                        <Upload className="mr-2 h-4 w-4" /> {t('uploadMedia')}
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                    {mediaList.map((media) => (
                        <div
                            key={media.id}
                            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted/40"
                        >
                            {isImageFile(media.mimeType) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                    src={media.url} 
                                    alt={media.filename}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                                    <FileText className="mb-2 h-12 w-12" />
                                    <span className="w-full truncate text-sm">
                                        {media.filename}
                                    </span>
                                </div>
                            )}
                            
                            {/* Overlay with info and actions */}
                            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-background/95 via-background/55 to-background/20 p-3 opacity-100 transition-opacity group-hover:opacity-100">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 bg-background/70 text-foreground hover:bg-background hover:text-foreground"
                                        onClick={() => copyToClipboard(media)}
                                        disabled={isPending}
                                        title={t('copyLink')}
                                        aria-label={t('copyLink')}
                                    >
                                        {copiedId === media.id ? (
                                            <Check className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Copy className="h-5 w-5" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 bg-background/70 text-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => openDeleteDialog(media)}
                                        disabled={isPending}
                                        title={tCommon('delete')}
                                        aria-label={tCommon('delete')}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                                {isImageFile(media.mimeType) ? (
                                    <button
                                        type="button"
                                        className="rounded text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                                        onClick={() => setPreviewMedia(media)}
                                    >
                                        <p className="truncate text-sm font-medium">{media.filename}</p>
                                        <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                                    </button>
                                ) : (
                                    <div className="text-foreground">
                                        <p className="truncate text-sm font-medium">{media.filename}</p>
                                        <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                                    </div>
                                )}
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
                                    <Input
                                        type="text"
                                        readOnly
                                        aria-label={t('copyLink')}
                                        value={previewMedia.url}
                                        className="min-w-0 flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(previewMedia)}
                                    >
                                        {copiedId === previewMedia.id ? (
                                            <Check className="mr-1 h-4 w-4 text-primary" />
                                        ) : (
                                            <Copy className="h-4 w-4 mr-1" />
                                        )}
                                        {t('copyLink')}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
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
