import { MarkdownContent } from './markdown-content';
import { ImageLightbox } from './image-lightbox';

interface MemoContentProps {
  content: string;
}

function extractImages(content: string): string[] {
  const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  return Array.from(content.matchAll(imageRegex), (match) => match[1]);
}

function removeImages(content: string): string {
  return content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim();
}

export function MemoContent({ content }: MemoContentProps) {
  const textContent = removeImages(content);
  const images = extractImages(content);

  return (
    <div className="space-y-3">
      {textContent && (
        <MarkdownContent
          content={textContent}
          className="prose-sm md:prose-base prose-p:my-0 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-3"
        />
      )}
      {images.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {images.map((src, index) => (
            <ImageLightbox
              key={`${src}-${index}`}
              src={src}
              alt={`Image ${index + 1}`}
              className="not-prose h-24 w-24 rounded-md border border-border/60 object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
