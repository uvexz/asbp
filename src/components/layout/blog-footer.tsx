import { getTranslations } from 'next-intl/server';
import { Github, Rss, Settings } from 'lucide-react';
import { FooterIconLink } from './footer-icon-link';

interface BlogFooterProps {
    siteTitle: string;
}

export async function BlogFooter({ siteTitle }: BlogFooterProps) {
    const currentYear = new Date().getFullYear();
    const t = await getTranslations('blog');
    
    return (
        <footer className="sm:px-10 py-8">
            <div className="flex items-center justify-center gap-2">
                <p className="text-neutral-500 text-sm">© {currentYear} {siteTitle}. {t('allRightsReserved')}</p>
                <div className="flex items-center gap-1 text-neutral-500">
                    <FooterIconLink href="https://github.com/uvexz/asbp" label="GitHub" external>
                        <Github className="h-3.5 w-3.5" />
                    </FooterIconLink>
                    <FooterIconLink href="/feed.xml" label="RSS Feed">
                        <Rss className="h-3.5 w-3.5" />
                    </FooterIconLink>
                    <FooterIconLink href="/admin" label="Admin">
                        <Settings className="h-3.5 w-3.5" />
                    </FooterIconLink>
                </div>
            </div>
        </footer>
    );
}
