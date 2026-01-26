'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageLightbox } from './image-lightbox';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const components: Components = {
  img: ({ src, alt }) => {
    if (!src || typeof src !== 'string') return null;
    return <ImageLightbox src={src} alt={alt} />;
  },
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto w-full my-4">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
