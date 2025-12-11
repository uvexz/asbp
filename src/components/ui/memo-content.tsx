'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageLightbox } from './image-lightbox';

interface MemoContentProps {
  content: string;
}

export function MemoContent({ content }: MemoContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, alt }) => (
          <ImageLightbox
            src={typeof src === 'string' ? src : ''}
            alt={alt || ''}
            className="w-24 h-24 object-cover rounded-lg border mt-2"
          />
        ),
        p: ({ children, ...props }) => {
          // Check if children contains only images
          const hasOnlyImages = Array.isArray(children) 
            ? children.every(child => 
                typeof child === 'object' && child !== null && 'type' in child && child.type === 'img'
              )
            : false;
          
          if (hasOnlyImages) {
            return <div className="flex flex-wrap gap-2" {...props}>{children}</div>;
          }
          return <p {...props}>{children}</p>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
