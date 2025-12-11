'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, FileText, MessageSquare, Image as ImageIcon, Tag, Settings, Plus, HelpCircle, Navigation, Users, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/layout/logout-button';
import { useTranslations } from 'next-intl';
import { getInitials, formatRole } from '@/lib/user-utils';

interface AdminMobileHeaderProps {
    settings?: { s3Bucket: string | null } | null;
    user: {
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

    const tAuth = useTranslations('auth');
    
    const navItems = [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/admin/posts', label: t('posts'), icon: FileText },
        { href: '/admin/comments', label: t('comments'), icon: MessageSquare },
        { href: '/admin/users', label: t('users'), icon: Users },
        { href: '/admin/media', label: t('media'), icon: ImageIcon },
        { href: '/admin/tags', label: t('tags'), icon: Tag },
        { href: '/admin/navigation', label: t('navigation'), icon: Navigation },
        { href: '/admin/passkeys', label: tAuth('passkeys'), icon: KeyRound },
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
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </header>

            {/* Mobile Drawer Overlay */}
            {isOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/50 z-50"
                    onClick={closeMenu}
                />
            )}

            {/* Mobile Drawer */}
            <aside className={cn(
                "lg:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-black z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                            <span className="text-sm text-green-600 dark:text-green-400">{formatRole(user.role)}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={closeMenu}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

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
                                            ? "bg-green-100 text-gray-900 dark:bg-green-900/20 dark:text-gray-50"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-gray-900 dark:text-gray-50" : "text-gray-700 dark:text-gray-300")} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                    <Link
                        href="/admin/posts/edit"
                        onClick={closeMenu}
                        className="flex items-center justify-center gap-2 w-full h-10 px-4 bg-[#4cdf20] text-gray-900 text-sm font-bold rounded-lg hover:bg-[#4cdf20]/90 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span>{t('newPost')}</span>
                    </Link>
                    <Link 
                        href="#" 
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <HelpCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">{t('help')}</span>
                    </Link>
                    <LogoutButton />
                </div>
            </aside>
        </>
    );
}
