import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Github, Settings } from 'lucide-react';

interface BlogFooterProps {
    siteTitle: string;
}

export async function BlogFooter({ siteTitle }: BlogFooterProps) {
    const currentYear = new Date().getFullYear();
    const t = await getTranslations('blog');
    
    return (
        <footer className="px-4 sm:px-10 py-8">
            <div className="flex items-center justify-center gap-3">
                <p className="text-neutral-500 text-sm">© {currentYear} {siteTitle}. {t('allRightsReserved')}</p>
                <div className="flex items-center gap-2 text-neutral-500">
                    <Link
                        href="https://github.com/uvexz/asbp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        aria-label="GitHub"
                    >
                        <Github className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                        href="/admin"
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        aria-label="Admin"
                    >
                        <Settings className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
