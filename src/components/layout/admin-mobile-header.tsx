'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LayoutDashboard, FileText, MessageSquare, Image as ImageIcon, Tag, Settings, Plus, Github, Navigation, Users, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { LogoutButton } from '@/components/layout/logout-button';
import { useTranslations } from 'next-intl';
import { getInitials, formatRole } from '@/lib/user-utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AdminMobileHeaderProps {
    settings?: { s3Bucket: string | null } | null;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
        role: string;
    };
}

export function AdminMobileHeader({ settings, user }: AdminMobileHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const t = useTranslations('admin');
    const tCommon = useTranslations('common');

    const navItems = [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/admin/posts', label: t('posts'), icon: FileText },
        { href: '/admin/comments', label: t('comments'), icon: MessageSquare },
        { href: '/admin/users', label: t('users'), icon: Users },
        { href: '/admin/media', label: t('media'), icon: ImageIcon },
        { href: '/admin/tags', label: t('tags'), icon: Tag },
        { href: '/admin/navigation', label: t('navigation'), icon: Navigation },
        { href: '/admin/settings', label: t('settings'), icon: Settings },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (item.label === t('media') && !settings?.s3Bucket) {
            return false;
        }
        return true;
    });

    const closeMenu = () => setIsOpen(false);

    return (
        <>
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border sticky top-0 z-40">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sidebar-foreground truncate">{user.name}</span>
                </div>
                <Button variant="ghost" size="icon" aria-label={tCommon('openMenu')} onClick={() => setIsOpen(true)}>
                    <Menu className="h-6 w-6 text-sidebar-foreground" />
                </Button>
            </header>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-72 bg-sidebar p-0" closeLabel={tCommon('close')}>
                    <SheetHeader className="border-b border-sidebar-border p-4 text-left">
                        <SheetTitle>{tCommon('menu')}</SheetTitle>
                        <Link
                            href={`/admin/users/${user.id}`}
                            onClick={closeMenu}
                            className="mt-3 flex min-w-0 items-center gap-3"
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.image || undefined} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col">
                                <span className="font-medium text-sidebar-foreground truncate">{user.name}</span>
                                <span className="text-sm text-sidebar-primary truncate">{formatRole(user.role)}</span>
                            </div>
                        </Link>
                    </SheetHeader>

                    <nav className="flex-1 overflow-auto p-4">
                        <div className="flex flex-col gap-2">
                            {filteredNavItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={closeMenu}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                                            isActive
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5", isActive ? "text-sidebar-primary" : "text-sidebar-foreground")} />
                                        <span className="text-sm font-medium truncate">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="p-4 border-t border-sidebar-border space-y-3">
                        <Link
                            href="/admin/posts/edit"
                            onClick={closeMenu}
                            className={cn(buttonVariants({ className: 'flex w-full min-h-11 justify-center rounded-lg font-bold' }))}
                        >
                            <Plus className="h-5 w-5" />
                            <span className="truncate">{t('newPost')}</span>
                        </Link>
                        <Link
                            href="/"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors"
                        >
                            <Home className="h-5 w-5" />
                            <span className="text-sm font-medium truncate">{t('backToBlog')}</span>
                        </Link>
                        <Link
                            href="https://github.com/uvexz/asbp"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={closeMenu}
                            className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors"
                        >
                            <Github className="h-5 w-5" />
                            <span className="text-sm font-medium truncate">{t('openSource')}</span>
                        </Link>
                        <LogoutButton />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
