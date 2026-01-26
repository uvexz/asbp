'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Image as ImageIcon, Loader2, Check, FileText } from "lucide-react";
import { getMedia, uploadMedia, type Media } from "@/app/actions/media";
import { hasS3Config } from "@/app/actions/settings";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  onSelect: (url: string, alt?: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function MediaPicker({ onSelect, trigger, className }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasS3, setHasS3] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const s3Configured = await hasS3Config();
      setHasS3(s3Configured);
      
      if (s3Configured) {
        const data = await getMedia();
        setMediaList(data);
      }
    } catch {
      setError('Failed to load media');
    } finally {
      setIsLoading(false);
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (result.success && result.data) {
        await loadData();
        // Auto-select the newly uploaded file
        const newMedia = mediaList.find(m => m.id === result.data?.id);
        if (newMedia) {
          setSelectedMedia(newMedia);
        }
      } else if (!result.success) {
        setError(result.error);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  }

  function handleSelect() {
    if (selectedMedia) {
      onSelect(selectedMedia.url, selectedMedia.filename);
      setOpen(false);
      setSelectedMedia(null);
    }
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
            插入图片
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>选择媒体文件</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : !hasS3 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">S3 存储未配置</p>
            <p className="text-sm text-gray-400">请先在设置中配置 S3 存储</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
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
                上传新图片
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              {mediaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">暂无媒体文件</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {mediaList.filter(m => isImageFile(m.mimeType)).map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => setSelectedMedia(media)}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden border-2 transition-all relative",
                        selectedMedia?.id === media.id
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-transparent hover:border-gray-300"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={media.url}
                        alt={media.filename}
                        className="w-full h-full object-cover"
                      />
                      {selectedMedia?.id === media.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSelect}
                disabled={!selectedMedia}
                className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90"
              >
                插入选中图片
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
