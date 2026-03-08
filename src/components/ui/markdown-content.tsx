import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';
import { ImageLightbox } from './image-lightbox';

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
    <div className="my-4 w-full overflow-x-auto">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        'prose prose-neutral max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-foreground/90 prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-foreground/70 prose-strong:text-foreground prose-img:rounded-md prose-img:border prose-img:border-border/60 prose-pre:overflow-x-auto prose-pre:rounded-md prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted prose-pre:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.95em] prose-code:before:content-none prose-code:after:content-none prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 [&_pre]:max-w-full md:prose-lg',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
