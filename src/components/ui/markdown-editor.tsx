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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadMedia(formData);
      
      if (result.success && result.data) {
        // Insert markdown image syntax at cursor or end
        const imageMarkdown = `![${file.name}](${result.data.url})`;
        onChange(value + (value ? '\n' : '') + imageMarkdown);
      }
    } catch (error) {
      console.error('Upload failed:', error);
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
              onSelect={(url, alt) => {
                const imageMarkdown = `![${alt || 'image'}](${url})`;
                onChange(value + (value ? '\n' : '') + imageMarkdown);
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
