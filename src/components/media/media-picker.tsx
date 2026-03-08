'use client';

import { useState, useEffect, useTransition, useRef, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { getMedia, uploadMedia, type Media } from "@/app/actions/media";
import { hasS3Config } from "@/app/actions/settings";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface MediaPickerProps {
  onSelect: (url: string, alt?: string) => void;
  onSelectMultiple?: (items: Array<{ url: string; alt?: string }>) => void;
  trigger?: React.ReactNode;
  className?: string;
  multiple?: boolean;
}

export function MediaPicker({ onSelect, onSelectMultiple, trigger, className, multiple = false }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasS3, setHasS3] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedIds = useMemo(() => new Set(selectedMedia.map((media) => media.id)), [selectedMedia]);

  const loadData = useCallback(async (): Promise<Media[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const s3Configured = await hasS3Config();
      setHasS3(s3Configured);

      if (!s3Configured) {
        setMediaList([]);
        return [];
      }

      const data = await getMedia();
      setMediaList(data);
      return data;
    } catch {
      setError(tCommon('loadFailedRetry'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      setSelectedMedia([]);
    }
  }, [open, loadData]);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError(null);

    startTransition(async () => {
      const uploadedIds: string[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadMedia(formData);
        if (result.success && result.data) {
          uploadedIds.push(result.data.id);
        } else if (!result.success) {
          errors.push(result.error);
        }
      }

      const data = await loadData();
      if (uploadedIds.length > 0) {
        const newlyUploaded = data.filter((media) => uploadedIds.includes(media.id));
        setSelectedMedia((prev) => {
          if (!multiple) {
            return newlyUploaded.slice(0, 1);
          }
          const merged = [...prev];
          for (const media of newlyUploaded) {
            if (!merged.some((item) => item.id === media.id)) {
              merged.push(media);
            }
          }
          return merged;
        });
      }

      if (errors.length > 0) {
        const successCount = uploadedIds.length;
        const failCount = errors.length;
        const reason = errors[0];
        const summary = successCount > 0
          ? tCommon('uploadPartial', { successCount, failCount })
          : tCommon('uploadFailedCount', { failCount });
        setError(reason ? `${summary} ${tCommon('uploadReason', { reason })}` : summary);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  }

  function handleSelect() {
    if (selectedMedia.length === 0) return;

    if (multiple && onSelectMultiple) {
      onSelectMultiple(
        selectedMedia.map((media) => ({ url: media.url, alt: media.filename }))
      );
    } else if (multiple) {
      selectedMedia.forEach((media) => onSelect(media.url, media.filename));
    } else {
      const media = selectedMedia[0];
      if (media) {
        onSelect(media.url, media.filename);
      }
    }

    setOpen(false);
    setSelectedMedia([]);
  }

  function toggleSelect(media: Media) {
    if (!multiple) {
      setSelectedMedia([media]);
      return;
    }

    setSelectedMedia((prev) => {
      if (prev.some((item) => item.id === media.id)) {
        return prev.filter((item) => item.id !== media.id);
      }
      return [...prev, media];
    });
  }

  function isImageFile(mimeType: string | null): boolean {
    return mimeType?.startsWith('image/') ?? false;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={className}>
            <ImageIcon className="h-4 w-4 mr-2" />
            {tCommon('insertSelectedImages')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('mediaLibraryTitle')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasS3 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
            </div>
            <p className="mb-2 font-medium text-foreground">{t('s3Required')}</p>
            <p className="text-sm text-muted-foreground">{t('s3RequiredDesc')}</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
                multiple={multiple}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {t('uploadNewMedia')}
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              {mediaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                  <p className="text-muted-foreground">{t('noMediaFiles')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {mediaList.filter(m => isImageFile(m.mimeType)).map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => toggleSelect(media)}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-lg border-2 bg-muted/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selectedIds.has(media.id)
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-border"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={media.url}
                        alt={media.filename}
                        className="w-full h-full object-cover"
                      />
                      {selectedIds.has(media.id) && (
                        <div className="absolute top-2 right-2 rounded-full bg-primary p-1 text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleSelect}
                disabled={selectedMedia.length === 0}
              >
                {tCommon('insertSelectedImages')}{multiple && selectedMedia.length > 0 ? ` (${selectedMedia.length})` : ''}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
