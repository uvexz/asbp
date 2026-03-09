'use client';

import { useRef, useState } from 'react';
import { Edit, Eye, ImagePlus, Loader2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';
import { createQuickMemo } from '@/app/actions/posts';
import { uploadMedia } from '@/app/actions/media';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MemoQuickPostProps {
  className?: string;
  hasS3?: boolean;
}

export function MemoQuickPost({ className, hasS3 = false }: MemoQuickPostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createQuickMemo(content.trim());
      if (result.success) {
        setContent('');
        setIsOpen(false);
        setIsPreview(false);
      } else {
        setError(result.error);
      }
    } catch {
      setError(t('publishFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const markdownLines: string[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadMedia(formData);

        if (result.success && result.data) {
          markdownLines.push(`![${file.name}](${result.data.url})`);
        } else if (!result.success) {
          errors.push(result.error);
        }
      }

      if (markdownLines.length > 0) {
        setContent((prev) => prev + (prev ? '\n' : '') + markdownLines.join('\n'));
      }

      if (errors.length > 0) {
        const successCount = markdownLines.length;
        const failCount = errors.length;
        const reason = errors[0];
        const summary =
          successCount > 0
            ? tCommon('uploadPartial', { successCount, failCount })
            : tCommon('uploadFailedCount', { failCount });
        setError(reason ? `${summary} ${tCommon('uploadReason', { reason })}` : summary);
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setError(null);
        }
      }}
    >
      <div className={className}>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t('quickMemo')}
                onClick={() => setIsOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('quickMemo')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <DialogContent className="max-w-xl gap-0 p-0" closeLabel={tCommon('close')}>
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base font-medium tracking-tight">{t('quickMemo')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={isPreview ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => setIsPreview(false)}
              >
                <Edit className="h-4 w-4" />
                {tCommon('edit')}
              </Button>
              <Button
                type="button"
                variant={isPreview ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setIsPreview(true)}
              >
                <Eye className="h-4 w-4" />
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
                  multiple
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  aria-label={tCommon('upload')}
                  className="shrink-0"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  <span className="sr-only">{tCommon('upload')}</span>
                </Button>
              </div>
            )}
          </div>

          {isPreview ? (
            <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none min-h-[160px] overflow-auto rounded-lg border border-border/60 bg-muted/20 p-4">
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
              className="min-h-[160px] resize-none border-border/60 bg-muted/20 text-sm leading-6 shadow-none"
              autoFocus
            />
          )}

          {error ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tCommon('publishing')}
                </>
              ) : (
                tCommon('publish')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
