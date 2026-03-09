'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export function Pagination({ currentPage, totalPages, baseUrl = '' }: PaginationProps) {
  const t = useTranslations('pagination');

  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const buildPageUrl = (page: number): string => {
    if (page === 1) {
      return baseUrl || '/';
    }
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl || '/'}${separator}page=${page}`;
  };

  const pageNumbers = getPageNumbers();
  const iconButtonClass = cn(
    buttonVariants({ variant: 'ghost', size: 'sm' }),
    'h-8 w-8 rounded-full px-0 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
  );
  const pageButtonClass = cn(
    buttonVariants({ variant: 'ghost', size: 'sm' }),
    'h-8 rounded-full px-3 font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground'
  );

  return (
    <nav className="flex items-center justify-center gap-1.5 border-t border-border/40 pt-6" aria-label="Pagination">
      {isFirstPage ? (
        <span className={cn(iconButtonClass, 'pointer-events-none opacity-35')} aria-disabled="true">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t('previousPage')}</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className={iconButtonClass}
          aria-label={t('goToPrevious')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-1.5 text-sm text-muted-foreground/70"
              aria-hidden="true"
            >
              …
            </span>
          );
        }

        const isCurrentPage = page === currentPage;

        return isCurrentPage ? (
          <span
            key={page}
            className={cn(
              buttonVariants({ variant: 'secondary', size: 'sm' }),
              'pointer-events-none h-8 rounded-full px-3 font-medium shadow-none'
            )}
            aria-current="page"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildPageUrl(page)}
            className={pageButtonClass}
            aria-label={t('goToPage', { page })}
          >
            {page}
          </Link>
        );
      })}

      {isLastPage ? (
        <span className={cn(iconButtonClass, 'pointer-events-none opacity-35')} aria-disabled="true">
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">{t('nextPage')}</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className={iconButtonClass}
          aria-label={t('goToNext')}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
