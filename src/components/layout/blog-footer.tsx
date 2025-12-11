import { getTranslations } from 'next-intl/server';

interface BlogFooterProps {
    siteTitle: string;
}

export async function BlogFooter({ siteTitle }: BlogFooterProps) {
    const currentYear = new Date().getFullYear();
    const t = await getTranslations('blog');
    
    return (
        <footer className="text-center px-4 sm:px-10 py-8">
            <p className="text-neutral-500 text-sm">© {currentYear} {siteTitle}. {t('allRightsReserved')}</p>
        </footer>
    );
}
