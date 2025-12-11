'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

/**
 * Pagination component for navigating through pages
 * Displays page numbers and previous/next buttons
 * Disables navigation buttons appropriately at boundaries
 */
export function Pagination({ currentPage, totalPages, baseUrl = '' }: PaginationProps) {
  const t = useTranslations('pagination');
  
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
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

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {/* Previous button */}
      {isFirstPage ? (
        <span
          className={cn(
            buttonVariants({ variant: 'outline', size: 'icon-sm' }),
            'pointer-events-none opacity-50'
          )}
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t('previousPage')}</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))}
          aria-label={t('goToPrevious')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {/* Page numbers */}
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-neutral-500"
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
              buttonVariants({ variant: 'default', size: 'icon-sm' }),
              'pointer-events-none'
            )}
            aria-current="page"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildPageUrl(page)}
            className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))}
            aria-label={t('goToPage', { page })}
          >
            {page}
          </Link>
        );
      })}

      {/* Next button */}
      {isLastPage ? (
        <span
          className={cn(
            buttonVariants({ variant: 'outline', size: 'icon-sm' }),
            'pointer-events-none opacity-50'
          )}
          aria-disabled="true"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">{t('nextPage')}</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))}
          aria-label={t('goToNext')}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
