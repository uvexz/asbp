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

  return (
    <>
      <button
        type="button"
        className={cn(
          'block cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        onClick={() => setIsOpen(true)}
        aria-label={imageLabel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ''}
          className="block max-w-full"
        />
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] border-none bg-black/90 p-4 shadow-none" closeLabel="Close image preview">
          <VisuallyHidden>
            <DialogTitle>{imageLabel}</DialogTitle>
          </VisuallyHidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ''}
            className="mx-auto max-h-[85vh] max-w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
