'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const SearchDialogContent = dynamic(
  () => import('./search-dialog-content').then((mod) => mod.SearchDialogContent),
  { ssr: false },
);

interface SearchDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SearchDialogContext = createContext<SearchDialogContextValue | null>(null);

function useSearchDialog() {
  const context = useContext(SearchDialogContext);

  if (!context) {
    throw new Error('SearchTrigger must be used within SearchDialogProvider');
  }

  return context;
}

export function SearchDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [hasLoadedDialog, setHasLoadedDialog] = useState(false);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setHasLoadedDialog(true);
    }

    setOpen(nextOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        handleOpenChange(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenChange]);

  const value = useMemo(
    () => ({ open, setOpen: handleOpenChange }),
    [open, handleOpenChange],
  );

  return (
    <SearchDialogContext.Provider value={value}>
      {children}
      {hasLoadedDialog && open && (
        <SearchDialogContent open={open} onOpenChange={handleOpenChange} />
      )}
    </SearchDialogContext.Provider>
  );
}

interface SearchTriggerProps {
  className?: string;
  variant?: 'default' | 'icon';
}

export function SearchTrigger({ className, variant = 'default' }: SearchTriggerProps) {
  const { setOpen } = useSearchDialog();
  const tBlog = useTranslations('blog');

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tBlog('searchDialogTitle')}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={tBlog('searchDialogTitle')}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-md border border-border/70 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <Search className="h-4 w-4" />
      <span>{tBlog('searchDialogTitle')}</span>
      <kbd className="hidden items-center gap-0.5 rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline-flex">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}
