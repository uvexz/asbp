'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Search, FileText, Loader2, Command } from 'lucide-react';
import { searchPosts, type SearchResult } from '@/app/actions/search';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const latestQueryRef = useRef('');
  const router = useRouter();
  const tBlog = useTranslations('blog');
  const showResults = query.length >= 2 && open;

  const navigateTo = useCallback((slug: string) => {
    onOpenChange(false);
    router.push(`/${slug}`);
  }, [onOpenChange, router]);

  // Debounced search
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
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showResults]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex].slug);
    }
  }, [results, selectedIndex, navigateTo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{tBlog('searchDialogTitle')}</DialogTitle>
        </VisuallyHidden>
        {/* Search Input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tBlog('searchPostsPlaceholder')}
            aria-label={tBlog('searchDialogTitle')}
            className="flex-1 h-12 px-3 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            autoFocus
          />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {showResults && results.length === 0 && !isPending && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {tBlog('searchNoResults')}
            </div>
          )}

          {showResults && results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => navigateTo(result.slug)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {result.excerpt}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!showResults && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {tBlog('searchMinCharacters')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
            <span>{tBlog('searchNavigate')}</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>
            <span>{tBlog('searchOpen')}</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
            <span>{tBlog('searchClose')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SearchTriggerProps {
  className?: string;
  variant?: 'default' | 'icon';
}

/**
 * Search trigger button with keyboard shortcut
 */
export function SearchTrigger({ className, variant = 'default' }: SearchTriggerProps) {
  const [open, setOpen] = useState(false);
  const tCommon = useTranslations('common');
  const tBlog = useTranslations('blog');

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Icon-only variant for mobile/compact layouts
  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={tCommon('search')}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-md text-neutral-500',
            'hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
        >
          <Search className="h-4 w-4" />
        </button>
        <SearchDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tBlog('searchDialogTitle')}
        className={cn(
          'flex min-h-11 items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground',
          'border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">{tCommon('search')}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px]">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
