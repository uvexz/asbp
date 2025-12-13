'use client';

import { useState, useRef } from 'react';
import { Plus, X, Loader2, Eye, Edit, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { createQuickMemo } from '@/app/actions/posts';
import { uploadMedia } from '@/app/actions/media';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';

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

  return (
    <div className={className}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-200 hover:bg-neutral-300 transition-colors"
            >
              <Plus className="h-3 w-3 text-neutral-600" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('quickMemo')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">{t('quickMemo')}</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Toolbar */}
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

                {/* Content */}
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

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="flex justify-end gap-2">
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {tCommon('publishing')}
                      </>
                    ) : (
                      tCommon('publish')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
