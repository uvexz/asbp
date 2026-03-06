'use client';

import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, Edit, ImagePlus, Loader2, FolderOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uploadMedia } from '@/app/actions/media';
import { MediaPicker } from '@/components/media/media-picker';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  hasS3?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '使用 Markdown 编写内容...',
  className = '',
  minHeight = '400px',
  hasS3 = false,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
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
        onChange(value + (value ? '\n' : '') + markdownLines.join('\n'));
      }

      if (errors.length > 0) {
        const successCount = markdownLines.length;
        const failCount = errors.length;
        const reason = errors[0];
        const summary = successCount > 0
          ? `已上传 ${successCount} 张，${failCount} 张失败。`
          : `上传失败，共 ${failCount} 张。`;
        setUploadError(reason ? `${summary} 原因：${reason}` : summary);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('上传失败，请重试');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            type="button"
            variant={isPreview ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => setIsPreview(false)}
          >
            <Edit className="h-4 w-4 mr-1" />
            编辑
          </Button>
          <Button
            type="button"
            variant={isPreview ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setIsPreview(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </div>
        {hasS3 && (
          <div className="flex gap-1">
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
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              <span className="ml-1">上传</span>
            </Button>
            <MediaPicker
              multiple
              onSelect={(url, alt) => {
                const imageMarkdown = `![${alt || 'image'}](${url})`;
                onChange(value + (value ? '\n' : '') + imageMarkdown);
              }}
              onSelectMultiple={(items) => {
                const markdown = items
                  .map((item) => `![${item.alt || 'image'}](${item.url})`)
                  .join('\n');
                onChange(value + (value ? '\n' : '') + markdown);
              }}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4" />
                  <span className="ml-1">媒体库</span>
                </Button>
              }
            />
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-sm text-red-500">{uploadError}</p>
      )}

      {isPreview ? (
        <div
          className="prose prose-neutral prose-sm max-w-none p-3 border rounded-md bg-gray-50 dark:bg-white/5 overflow-auto"
          style={{ minHeight }}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">暂无内容</p>
          )}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-white/20 font-mono"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
