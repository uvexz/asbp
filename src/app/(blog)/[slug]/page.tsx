import { Badge } from '@/components/ui/badge';
import { getPostBySlug } from '@/app/actions/posts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostComments } from '@/app/actions/comments';
import { CommentForm } from '@/components/layout/comment-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getInitials } from '@/lib/user-utils';
import { formatDate } from '@/lib/date-utils';
import { getTranslations } from 'next-intl/server';
import { getGravatarUrl } from '@/lib/gravatar';

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
                        <p className="text-neutral-500 text-sm font-normal leading-none">
                            {t('by')} {post.author.name} • {formatDate(post.publishedAt || post.createdAt)}
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
            <section className="space-y-8 border-t border-neutral-200 pt-12">
                <h2 className="text-2xl font-bold text-black">{t('commentsCount', { count: comments.length })}</h2>
                <div className="space-y-6">
                    {comments.map((comment) => {
                        const isUserComment = comment.user;
                        const authorName = isUserComment ? comment.user!.name : (comment.guestName || t('anonymous'));
                        const authorImage = isUserComment 
                            ? comment.user!.image 
                            : (comment.guestEmail ? getGravatarUrl(comment.guestEmail) : null);
                        const authorBio = isUserComment ? comment.user!.bio : null;
                        const authorWebsite = isUserComment ? comment.user!.website : comment.guestWebsite;
                        
                        return (
                            <div key={comment.id} className="border-b border-neutral-100 pb-4 last:border-0">
                                <div className="flex gap-3">
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage src={authorImage || undefined} />
                                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            {authorWebsite ? (
                                                <a href={authorWebsite} target="_blank" rel="noopener noreferrer" className="font-bold text-black hover:text-blue-600">
                                                    {authorName}
                                                </a>
                                            ) : (
                                                <span className="font-bold text-black">{authorName}</span>
                                            )}
                                            <span className="text-sm text-neutral-500">{formatDate(comment.createdAt)}</span>
                                        </div>
                                        {authorBio && (
                                            <p className="text-sm text-neutral-500 mt-0.5">{authorBio}</p>
                                        )}
                                        <p className="text-neutral-700 mt-2">{comment.content}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {comments.length === 0 && <p className="text-neutral-500 italic">{t('noComments')}</p>}
                </div>
                <CommentForm postId={post.id} user={currentUser} />
            </section>
        </div>
    );
}
