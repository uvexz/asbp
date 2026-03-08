'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Search, Loader2 } from 'lucide-react';
import { searchPosts, type SearchResult } from '@/app/actions/search';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SearchDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialogContent({ open, onOpenChange }: SearchDialogContentProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const latestQueryRef = useRef('');
  const router = useRouter();
  const tBlog = useTranslations('blog');
  const showResults = query.length >= 2 && open;

  const navigateTo = useCallback(
    (slug: string) => {
      onOpenChange(false);
      router.push(`/${slug}`);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    latestQueryRef.current = query;

    if (!showResults) {
      return;
    }

    const currentQuery = query;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const data = await searchPosts(currentQuery);
        if (latestQueryRef.current !== currentQuery) return;
        setResults(data);
        setSelectedIndex(0);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, showResults]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((index) => Math.min(index + 1, results.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === 'Enter' && results[selectedIndex]) {
        event.preventDefault();
        navigateTo(results[selectedIndex].slug);
      }
    },
    [results, selectedIndex, navigateTo],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-border/70 p-0" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>{tBlog('searchDialogTitle')}</DialogTitle>
        </VisuallyHidden>

        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tBlog('searchContentPlaceholder')}
            aria-label={tBlog('searchDialogTitle')}
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="max-h-[26rem] overflow-y-auto px-2 py-2">
          {!showResults ? (
            <div className="px-3 py-8 text-sm text-muted-foreground">
              {tBlog('searchMinCharacters')}
            </div>
          ) : results.length === 0 && !isPending ? (
            <div className="px-3 py-8 text-sm text-muted-foreground">
              {tBlog('searchNoResults')}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => navigateTo(result.slug)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full rounded-md px-3 py-3 text-left transition-colors',
                    index === selectedIndex ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6">{result.excerpt}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
