'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
    AlertTriangle,
    Check,
    Copy,
    FileText,
    Image as ImageIcon,
    Loader2,
    Trash2,
    Upload,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteMedia, getMedia, type Media, uploadMedia } from '@/app/actions/media';
import { getSettings } from '@/app/actions/settings';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
        setError(null);

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

    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="rounded-full border bg-card p-4 shadow-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{t('loadingMedia')}</p>
                </div>
            </div>
        );
    }

    if (!settings?.s3Bucket) {
        return (
            <div className="flex h-full flex-col px-4 py-6 sm:px-6">
                <div className="flex flex-1 items-center justify-center">
                    <section className="w-full max-w-xl rounded-2xl border bg-card px-6 py-8 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="mt-5 space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">{t('s3Required')}</h1>
                            <p className="text-sm leading-6 text-muted-foreground">{t('s3RequiredDesc')}</p>
                        </div>
                        <Button asChild className="mt-6">
                            <Link href="/admin/settings">{tCommon('goToSettings')}</Link>
                        </Button>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <header className="flex flex-col gap-4 px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-2">
                        <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('mediaLibraryTitle')}</h1>
                        <p className="text-sm leading-6 text-muted-foreground sm:text-base">{t('mediaLibraryDesc')}</p>
                    </div>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        />
                        <Button onClick={handleUploadClick} disabled={isPending} size="sm">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {t('uploadNewMedia')}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <div className="flex flex-col gap-5">
                    {error ? (
                        <div
                            className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
                            role="alert"
                            aria-live="polite"
                        >
                            <p className="leading-6">{error}</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => void loadData()} disabled={isPending}>
                                {tCommon('retry')}
                            </Button>
                        </div>
                    ) : null}

                    {successMessage ? (
                        <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4 text-sm text-foreground" aria-live="polite">
                            {successMessage}
                        </div>
                    ) : null}

                    {mediaList.length === 0 ? (
                        <section className="flex min-h-[26rem] flex-col items-center justify-center rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                                <ImageIcon className="h-8 w-8" />
                            </div>
                            <div className="mt-5 max-w-md space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">{t('noMediaFiles')}</h2>
                                <p className="text-sm leading-6 text-muted-foreground">{t('noMediaFilesDesc')}</p>
                            </div>
                            <Button onClick={handleUploadClick} disabled={isPending} className="mt-6">
                                <Upload className="h-4 w-4" />
                                {t('uploadMedia')}
                            </Button>
                        </section>
                    ) : (
                        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                                {mediaList.map((media) => {
                                    const isImage = isImageFile(media.mimeType);
                                    const isCopied = copiedId === media.id;

                                    return (
                                        <article
                                            key={media.id}
                                            className="group overflow-hidden rounded-2xl border bg-background transition-colors hover:border-border/80"
                                        >
                                            <div className="relative aspect-square overflow-hidden bg-muted/40">
                                                {isImage ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={media.url}
                                                        alt={media.filename}
                                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-muted-foreground">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background/80">
                                                            <FileText className="h-6 w-6" />
                                                        </div>
                                                        <span className="line-clamp-2 break-all text-sm leading-5">{media.filename}</span>
                                                    </div>
                                                )}

                                                <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-2 p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-full border border-border/60 bg-background/90 shadow-sm backdrop-blur-sm"
                                                        onClick={() => copyToClipboard(media)}
                                                        disabled={isPending}
                                                        title={t('copyLink')}
                                                        aria-label={t('copyLink')}
                                                    >
                                                        {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-full border border-border/60 bg-background/90 text-destructive shadow-sm backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => openDeleteDialog(media)}
                                                        disabled={isPending}
                                                        title={tCommon('delete')}
                                                        aria-label={tCommon('delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {isImage ? (
                                                    <button
                                                        type="button"
                                                        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-inset"
                                                        onClick={() => setPreviewMedia(media)}
                                                        aria-label={tCommon('preview')}
                                                    >
                                                        <span className="sr-only">{tCommon('preview')}</span>
                                                    </button>
                                                ) : null}
                                            </div>

                                            <div className="space-y-1 border-t px-4 py-3">
                                                <p className="truncate text-sm font-medium text-foreground">{media.filename}</p>
                                                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                                    <span className="truncate">{formatFileSize(media.size)}</span>
                                                    <span className="truncate">{media.mimeType || '—'}</span>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0" closeLabel={tCommon('close')}>
                    <DialogHeader className="border-b px-5 py-4">
                        <DialogTitle className="truncate pr-8">{previewMedia?.filename}</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            {previewMedia ? `${formatFileSize(previewMedia.size)} · ${previewMedia.mimeType || '—'}` : null}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 p-5">
                        {previewMedia ? (
                            <>
                                <div className="overflow-hidden rounded-xl border bg-muted/30 p-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewMedia.url}
                                        alt={previewMedia.filename}
                                        className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain"
                                    />
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Input
                                        type="text"
                                        readOnly
                                        aria-label={t('copyLink')}
                                        value={previewMedia.url}
                                        className="min-w-0 flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => copyToClipboard(previewMedia)}
                                        className={cn('sm:shrink-0', copiedId === previewMedia.id && 'text-primary')}
                                    >
                                        {copiedId === previewMedia.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {t('copyLink')}
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setMediaToDelete(null);
                    }
                }}
            >
                <DialogContent closeLabel={tCommon('close')}>
                    <DialogHeader>
                        <DialogTitle>{t('deleteMedia')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteMediaConfirm', { filename: mediaToDelete?.filename || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isPending}>
                            {tCommon('cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {tCommon('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
