'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageLightbox } from './image-lightbox';

interface MemoContentProps {
  content: string;
}

// Extract image URLs from markdown content
function extractImages(content: string): string[] {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: string[] = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[2]);
  }
  return images;
}

// Remove image markdown from content
function removeImages(content: string): string {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '').trim();
}

export function MemoContent({ content }: MemoContentProps) {
  const { textContent, images } = useMemo(() => ({
    textContent: removeImages(content),
    images: extractImages(content),
  }), [content]);

  return (
    <div>
      {textContent && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto w-full my-4">
                <table className="w-full border-collapse" {...props}>
                  {children}
                </table>
              </div>
            ),
          }}
        >
          {textContent}
        </ReactMarkdown>
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {images.map((src, index) => (
            <ImageLightbox
              key={index}
              src={src}
              alt={`Image ${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg border not-prose"
            />
          ))}
        </div>
      )}
    </div>
  );
}
