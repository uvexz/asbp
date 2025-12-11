import Link from 'next/link';
import { MemoQuickPost } from './memo-quick-post';
import { MobileNav, type NavItemData } from './mobile-nav';
import { getTranslations } from 'next-intl/server';

export type { NavItemData };

interface BlogHeaderProps {
    siteTitle: string;
    navItems?: NavItemData[];
    isAdmin?: boolean;
    hasS3?: boolean;
}

export async function BlogHeader({ siteTitle, navItems = [], isAdmin = false, hasS3 = false }: BlogHeaderProps) {
    const t = await getTranslations('blog');
    
    const mobileTranslations = {
        home: t('home'),
        memos: t('memos'),
        menu: t('menu'),
    };
    
    return (
        <header className="flex items-center justify-between whitespace-nowrap mt-20 px-4 sm:px-10 py-4">
            <div className="flex items-center gap-4 text-black">
                <h2 className="text-black text-lg font-bold leading-tight tracking-[-0.015em]">{siteTitle}</h2>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex flex-1 justify-end gap-8">
                <nav className="flex items-center gap-9">
                    <Link
                        href="/"
                        className="text-neutral-500 text-sm font-medium leading-normal hover:text-black transition-colors"
                    >
                        {t('home')}
                    </Link>
                    <span className="flex items-center gap-1">
                        <Link
                            href="/memo"
                            className="text-neutral-500 text-sm font-medium leading-normal hover:text-black transition-colors"
                        >
                            {t('memos')}
                        </Link>
                        {isAdmin && <MemoQuickPost hasS3={hasS3} />}
                    </span>
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.url}
                            target={item.openInNewTab ? '_blank' : undefined}
                            rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                            className="text-neutral-500 text-sm font-medium leading-normal hover:text-black transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            
            {/* Mobile Navigation */}
            <MobileNav 
                navItems={navItems} 
                isAdmin={isAdmin} 
                hasS3={hasS3} 
                translations={mobileTranslations}
            />
        </header>
    );
}
