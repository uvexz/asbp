'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';

interface LogoutButtonProps {
    className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
    const router = useRouter();
    const t = useTranslations('auth');

    async function handleLogout() {
        await authClient.signOut();
        router.push('/');
    }

    return (
        <button
            onClick={handleLogout}
            className={className || "flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full"}
        >
            <LogOut className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <p className="text-sm font-medium leading-normal">{t('logout')}</p>
        </button>
    );
}
