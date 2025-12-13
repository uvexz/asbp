import { Badge } from '@/components/ui/badge';
import { getPostBySlug } from '@/app/actions/posts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostComments } from '@/app/actions/comments';
import { CommentSection } from '@/components/layout/comment-section';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { formatDate } from '@/lib/date-utils';
import { getTranslations } from 'next-intl/server';
import { getSettings } from '@/app/actions/settings';
import type { Metadata } from 'next';
import { Calendar } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    const settings = await getSettings();
    const siteTitle = settings.siteTitle || 'My Blog';
    
    if (!post) {
        return { title: `Not Found - ${siteTitle}` };
    }
    
    return {
        title: `${post.title} - ${siteTitle}`,
    };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    const t = await getTranslations('blog');

    if (!post) {
        notFound();
    }

    const comments = await getPostComments(post.id);
    
    // Get current user session
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const currentUser = session?.user ? {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
    } : null;

    return (
        <div className="space-y-16 py-6 md:py-16">
            <article className="space-y-8">
                <header className="space-y-4">
                    <h1 className="text-black text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">{post.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="text-neutral-500 text-sm font-normal leading-none flex items-center gap-1">
                            {t('by')} {post.author.name} 
                            <Calendar className="ms-2 h-3 w-3" />
                            {formatDate(post.publishedAt || post.createdAt)}
                        </p>
                        {post.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">

                                {post.tags.map((postTag) => (
                                    <Link key={postTag.tag.id} href={`/tag/${postTag.tag.slug}`}>
                                        <Badge variant="secondary" className="hover:bg-neutral-200 transition-colors leading-none">
                                            {postTag.tag.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </header>
                <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:w-full prose-img:border-1 prose-pre:bg-neutral-900 prose-pre:text-neutral-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
            </article>
            <div className="border-t border-border pt-12">
                <CommentSection postId={post.id} comments={comments} user={currentUser} />
            </div>
        </div>
    );
}
