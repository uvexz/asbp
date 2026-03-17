'use client';

import { useState } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImageLightbox({ src, alt, className }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const imageLabel = alt?.trim() || 'Image preview';
  const isThumbnail = className?.split(' ').some(c => c.startsWith('h-')) && className?.split(' ').some(c => c.startsWith('w-'));

  return (
    <>
      <button
        type="button"
        className={cn(
          'group relative block overflow-hidden bg-muted cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        onClick={() => setIsOpen(true)}
        aria-label={imageLabel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ''}
          className={cn(
            'block transition-transform duration-500 group-hover:scale-110',
            isThumbnail ? 'h-full w-full object-cover' : 'h-auto max-w-full w-full'
          )}
        />
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] border-none bg-black/95 p-0 shadow-lg" showCloseButton={true} closeLabel="Close">
          <VisuallyHidden>
            <DialogTitle>{imageLabel}</DialogTitle>
          </VisuallyHidden>
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt || ''}
              className="mx-auto block max-h-[90vh] max-w-full rounded-sm object-contain shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
