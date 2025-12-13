'use client';

import Link from 'next/link';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavIconLinkProps {
    href: string;
    label: string;
    children: React.ReactNode;
}

export function NavIconLink({ href, label, children }: NavIconLinkProps) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={href}
                        className="text-neutral-500 hover:text-black transition-colors"
                    >
                        {children}
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
