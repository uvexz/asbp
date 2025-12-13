
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageSquare, Image as ImageIcon, Tag, Settings, Plus, Github, Navigation, Users, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoutButton } from '@/components/layout/logout-button';
import { useTranslations } from 'next-intl';

interface AdminSidebarProps {
    settings?: { s3Bucket: string | null } | null;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
        role: string;
    };
}

import { getInitials, formatRole } from '@/lib/user-utils';

export function AdminSidebar({ settings, user }: AdminSidebarProps) {
    const pathname = usePathname();
    const t = useTranslations('admin');
    
    // 内容管理组
    const contentItems = [
        { href: '/admin/posts', label: t('posts'), icon: FileText },
        { href: '/admin/comments', label: t('comments'), icon: MessageSquare },
        { href: '/admin/tags', label: t('tags'), icon: Tag },
        { href: '/admin/media', label: t('media'), icon: ImageIcon },
    ].filter(item => {
        if (item.label === t('media') && !settings?.s3Bucket) {
            return false;
        }
        return true;
    });

    // 系统管理组
    const systemItems = [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/admin/users', label: t('users'), icon: Users },
        { href: '/admin/navigation', label: t('navigation'), icon: Navigation },
        { href: '/admin/settings', label: t('settings'), icon: Settings },
    ];

    return (
        <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4 h-screen sticky top-0">
            <div className="flex flex-col gap-4">
                <Link 
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <h1 className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal">{user.name}</h1>
                        <p className="text-green-600 dark:text-green-400 text-sm font-normal leading-normal">{formatRole(user.role)}</p>
                    </div>
                </Link>
                <nav className="flex flex-col gap-6 mt-4">
                    {/* 内容管理组 */}
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('contentGroup')}</p>
                        {contentItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-green-100 text-gray-900 dark:bg-green-900/20 dark:text-gray-50"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-gray-900 dark:text-gray-50" : "text-gray-700 dark:text-gray-300")} />
                                    <p className="text-sm font-medium leading-normal">{item.label}</p>
                                </Link>
                            );
                        })}
                    </div>
                    
                    {/* 系统管理组 */}
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('systemGroup')}</p>
                        {systemItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-green-100 text-gray-900 dark:bg-green-900/20 dark:text-gray-50"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-gray-900 dark:text-gray-50" : "text-gray-700 dark:text-gray-300")} />
                                    <p className="text-sm font-medium leading-normal">{item.label}</p>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
            <div className="flex flex-col gap-4">
                <Link
                    href="/admin/posts/edit"
                    className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-[#4cdf20] text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#4cdf20]/90 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    <span className="truncate">{t('newPost')}</span>
                </Link>
                <div className="flex flex-col gap-1">
                    <Link 
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Home className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        <p className="text-sm font-medium leading-normal">{t('backToBlog')}</p>
                    </Link>
                    <Link 
                        href="https://github.com/uvexz/asbp" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Github className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        <p className="text-sm font-medium leading-normal">{t('openSource')}</p>
                    </Link>
                    <LogoutButton />
                </div>
            </div>
        </aside>
    );
}
