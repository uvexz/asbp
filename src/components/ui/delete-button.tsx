'use client';

import { useState, useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteButtonProps {
    onDelete: () => Promise<void>;
    title?: string;
    description?: string;
    variant?: 'icon' | 'button';
    buttonText?: string;
    className?: string;
    ariaLabel?: string;
}

export function DeleteButton({
    onDelete,
    title,
    description,
    variant = 'icon',
    buttonText,
    className,
    ariaLabel,
}: DeleteButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const tCommon = useTranslations('common');

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await onDelete();
                toast.success(tCommon('deleteSuccess'));
                setOpen(false);
            } catch {
                toast.error(tCommon('deleteFailedRetry'));
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {variant === 'icon' ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn('text-destructive hover:bg-destructive/10 hover:text-destructive', className)}
                        aria-label={ariaLabel || buttonText || tCommon('delete')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant="destructive" size="sm" className={className}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {buttonText || tCommon('delete')}
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title || tCommon('confirmDelete')}</AlertDialogTitle>
                    <AlertDialogDescription>{description || tCommon('confirmDeleteDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>{tCommon('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {buttonText || tCommon('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
