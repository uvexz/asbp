import Link from 'next/link';
import { getPublishedPosts } from '@/app/actions/posts';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/date-utils';
import { getTranslations } from 'next-intl/server';

interface HomePageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
    const pageSize = 10;
    const t = await getTranslations('blog');
    
    const { posts, totalPages } = await getPublishedPosts(currentPage, pageSize);

    return (
        <div className="space-y-6">
            <div className="space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
                        <Link href={`/${post.slug}`} className="text-black text-xl font-bold leading-normal hover:text-neutral-700 transition-colors">{post.title}</Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <p className="text-neutral-500 text-sm font-normal leading-none">{formatDate(post.publishedAt || post.createdAt)}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {post.tags.map((postTag) => (
                                    <Link key={postTag.tag.id} href={`/tag/${postTag.tag.slug}`}>
                                        <Badge variant="secondary" className="hover:bg-neutral-200 transition-colors leading-none">
                                            {postTag.tag.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && <p className="text-neutral-500">{t('noPosts')}</p>}
            </div>
            
            {/* Pagination */}
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                baseUrl="/"
            />
        </div>
    );
}
