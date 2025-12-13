import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostsByTag } from '@/app/actions/tags';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { getTranslations } from 'next-intl/server';
import { getSettings } from '@/app/actions/settings';
import type { Metadata } from 'next';
import { Calendar, Tag } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const { tag } = await getPostsByTag(slug);
    const settings = await getSettings();
    const siteTitle = settings.siteTitle || 'My Blog';
    const t = await getTranslations('blog');
    
    if (!tag) {
        return { title: `Not Found - ${siteTitle}` };
    }
    
    return {
        title: `${t('postsTagged', { tag: tag.name })} - ${siteTitle}`,
    };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { tag, posts } = await getPostsByTag(slug);
    const t = await getTranslations('blog');

    if (!tag) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between gap-3">
                <div className="space-y-2">
                    <h1 className="text-black text-4xl font-black leading-tight tracking-[-0.033em]">
                        {t('postsTagged', { tag: tag.name })}
                    </h1>
                    <p className="text-neutral-500">
                        {posts.length === 1 ? t('postFound') : t('postsFound', { count: posts.length })}
                    </p>
                </div>
            </div>
            <div className="space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
                        <Link href={`/${post.slug}`} className="text-black text-xl font-bold leading-normal hover:text-neutral-700 transition-colors">
                            {post.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <p className="text-neutral-500 text-sm font-normal leading-none flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.publishedAt || post.createdAt)}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {post.tags.map((postTag) => (
                                    <Link key={postTag.tag.id} href={`/tag/${postTag.tag.slug}`}>
                                        <Badge  variant="secondary" className="hover:bg-neutral-200 transition-colors leading-none">
                                            {postTag.tag.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && (
                    <p className="text-neutral-500">{t('noPostsWithTag')}</p>
                )}
            </div>
            <div className="pt-4">
                <Link href="/" className="text-neutral-600 hover:text-black transition-colors">
                    {t('backToAllPosts')}
                </Link>
            </div>
        </div>
    );
}
