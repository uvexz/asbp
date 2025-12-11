'use client';

import { useState } from 'react';
import { MarkdownEditor } from './markdown-editor';

interface PostContentEditorProps {
  defaultValue?: string;
  name: string;
  placeholder?: string;
  minHeight?: string;
  hasS3: boolean;
}

export function PostContentEditor({
  defaultValue = '',
  name,
  placeholder,
  minHeight = '400px',
  hasS3,
}: PostContentEditorProps) {
  const [content, setContent] = useState(defaultValue);

  return (
    <>
      <input type="hidden" name={name} value={content} />
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder={placeholder}
        minHeight={minHeight}
        hasS3={hasS3}
      />
    </>
  );
}
