'use client';

import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createComment, deleteComment, type CommentActionResult } from '@/app/actions/comments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { md5 } from '@/lib/hash';
import { cn } from '@/lib/utils';
import { MessageCircle, Reply, User, Mail, Globe, Send, X, Trash2 } from 'lucide-react';
import { Captcha } from '@/components/ui/captcha';
import { useRouter } from 'next/navigation';

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    parentId: string | null;
    user: {
        id: string;
        name: string;
        image: string | null;
        bio: string | null;
        website: string | null;
    } | null;
    guestName: string | null;
    guestEmail: string | null;
    guestWebsite: string | null;
}

interface CommentSectionProps {
    postId: string;
    comments: Comment[];
    user?: {
        id: string;
        name: string;
        image?: string | null;
    } | null;
    isAdmin?: boolean;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getGravatarUrl(email: string): string {
    const hash = md5(email.trim().toLowerCase());
    return `https://use.sevencdn.com/avatar/${hash}?d=mp`;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

// Input Group 组件
function InputGroup({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex items-center rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-all", className)}>
            {children}
        </div>
    );
}

function InputGroupPrefix({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("flex items-center justify-center pl-3 text-muted-foreground", className)}>
            {children}
        </span>
    );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            className={cn(
                "flex-1 h-9 bg-transparent px-3 py-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className
            )}
            {...props}
        />
    );
}

InputGroup.Prefix = InputGroupPrefix;
InputGroup.Input = InputGroupInput;


// 单条评论组件
function CommentItem({ 
    comment, 
    onReply,
    onDelete,
    isAdmin,
    t 
}: { 
    comment: Comment; 
    onReply: (commentId: string, authorName: string) => void;
    onDelete?: (commentId: string) => void;
    isAdmin?: boolean;
    t: ReturnType<typeof useTranslations<'blog'>>;
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const isUserComment = comment.user;
    const authorName = isUserComment ? comment.user!.name : (comment.guestName || t('anonymous'));
    const authorImage = isUserComment 
        ? comment.user!.image 
        : (comment.guestEmail ? getGravatarUrl(comment.guestEmail) : null);
    const authorBio = isUserComment ? comment.user!.bio : null;
    const authorWebsite = isUserComment ? comment.user!.website : comment.guestWebsite;

    const handleDelete = async () => {
        if (!confirm(t('confirmDeleteComment'))) return;
        setIsDeleting(true);
        try {
            await deleteComment(comment.id);
            onDelete?.(comment.id);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="group">
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={authorImage || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {getInitials(authorName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {authorWebsite ? (
                            <a 
                                href={authorWebsite} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="font-semibold text-foreground hover:text-primary transition-colors"
                            >
                                {authorName}
                            </a>
                        ) : (
                            <span className="font-semibold text-foreground">{authorName}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                    {authorBio && (
                        <p className="text-xs text-muted-foreground mt-0.5">{authorBio}</p>
                    )}
                    <p className="text-foreground/90 mt-2 text-sm leading-relaxed">{comment.content}</p>
                    <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={() => onReply(comment.id, authorName)}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Reply className="h-3.5 w-3.5" />
                            {t('reply')}
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t('delete')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 评论表单组件
function CommentForm({ 
    postId, 
    user, 
    replyTo,
    onCancelReply,
    onSuccess
}: { 
    postId: string;
    user?: CommentSectionProps['user'];
    replyTo?: { id: string; authorName: string } | null;
    onCancelReply?: () => void;
    onSuccess?: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<CommentActionResult | null>(null);
    const [guestEmail, setGuestEmail] = useState('');
    const [content, setContent] = useState('');
    const [captchaValid, setCaptchaValid] = useState(false);
    const t = useTranslations('blog');
    const tAuth = useTranslations('auth');

    const gravatarUrl = useMemo(() => {
        if (guestEmail && guestEmail.includes('@')) {
            return getGravatarUrl(guestEmail);
        }
        return null;
    }, [guestEmail]);

    // 登录用户不需要验证码
    const needsCaptcha = !user;
    const canSubmit = content.trim() && (user || captchaValid);

    async function handleSubmit(formData: FormData) {
        // 访客需要验证码
        if (needsCaptcha && !captchaValid) {
            setResult({ success: false, error: t('captchaRequired') });
            return;
        }

        startTransition(async () => {
            const response = await createComment(postId, formData, replyTo?.id);
            setResult(response);
            
            if (response.success) {
                setContent('');
                setGuestEmail('');
                setCaptchaValid(false);
                onSuccess?.();
            }
        });
    }

    return (
        <div className="space-y-4">
            {replyTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                    <Reply className="h-4 w-4" />
                    <span>{t('replyingTo')} <strong className="text-foreground">{replyTo.authorName}</strong></span>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        className="ml-auto hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {result?.success && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md text-green-800 dark:text-green-200 text-sm">
                    {result.autoApproved ? t('commentPublished') : t('commentPending')}
                </div>
            )}
            
            {result && !result.success && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md text-red-800 dark:text-red-200 text-sm">
                    {result.error === 'spam_rejected' ? t('spamRejected') : result.error}
                </div>
            )}

            <form action={handleSubmit} className="space-y-4">
                {user ? (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="text-sm">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{t('commentAsUser')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                        <Link href="/sign-in" className="text-primary hover:underline">{tAuth('signIn')}</Link> {t('loginForAutoApprove')}
                    </div>
                )}

                {/* 评论内容输入 */}
                <div className="relative">
                    <Textarea 
                        name="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-24 pr-12 resize-none" 
                        placeholder={replyTo ? t('replyPlaceholder') : t('commentPlaceholder')} 
                        required 
                        disabled={isPending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isPending || !canSubmit}
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                {/* 访客验证码 */}
                {needsCaptcha && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('captchaLabel')}:</span>
                        <Captcha onVerify={setCaptchaValid} />
                    </div>
                )}
                
                {/* 访客信息输入 */}
                {!user && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <InputGroup>
                            <InputGroup.Prefix>
                                <User className="h-4 w-4" />
                            </InputGroup.Prefix>
                            <InputGroup.Input
                                name="guestName"
                                placeholder={t('commentName')}
                                required
                                disabled={isPending}
                            />
                        </InputGroup>
                        
                        <InputGroup>
                            <InputGroup.Prefix>
                                <Mail className="h-4 w-4" />
                            </InputGroup.Prefix>
                            <InputGroup.Input
                                name="guestEmail"
                                type="email"
                                placeholder={t('commentEmail')}
                                required
                                disabled={isPending}
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                            />
                            {gravatarUrl && (
                                <span className="pr-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={gravatarUrl} />
                                        <AvatarFallback className="text-xs">?</AvatarFallback>
                                    </Avatar>
                                </span>
                            )}
                        </InputGroup>
                        
                        <InputGroup className="sm:col-span-2">
                            <InputGroup.Prefix>
                                <Globe className="h-4 w-4" />
                            </InputGroup.Prefix>
                            <InputGroup.Input
                                name="guestWebsite"
                                type="url"
                                placeholder={t('commentWebsite')}
                                disabled={isPending}
                            />
                        </InputGroup>
                    </div>
                )}
            </form>
        </div>
    );
}


// 主评论区组件
export function CommentSection({ postId, comments: initialComments, user, isAdmin }: CommentSectionProps) {
    const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
    const [comments, setComments] = useState(initialComments);
    const router = useRouter();
    const t = useTranslations('blog');

    // 构建评论树结构
    const rootComments = comments.filter(c => !c.parentId);
    const repliesMap = new Map<string, Comment[]>();
    
    comments.forEach(comment => {
        if (comment.parentId) {
            const replies = repliesMap.get(comment.parentId) || [];
            replies.push(comment);
            repliesMap.set(comment.parentId, replies);
        }
    });

    const handleReply = (commentId: string, authorName: string) => {
        setReplyTo({ id: commentId, authorName });
        // 滚动到表单
        document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleCancelReply = () => {
        setReplyTo(null);
    };

    const handleSuccess = () => {
        setReplyTo(null);
    };

    const handleDelete = (commentId: string) => {
        // 删除评论及其所有回复
        setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
        router.refresh();
    };

    return (
        <section className="space-y-8">
            {/* 标题 */}
            <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-bold text-foreground">
                    {t('commentsCount', { count: comments.length })}
                </h2>
            </div>

            {/* 评论列表 */}
            <div className="space-y-6">
                {rootComments.length > 0 ? (
                    rootComments.map((comment) => {
                        const replies = repliesMap.get(comment.id) || [];
                        return (
                            <div key={comment.id} className="space-y-4">
                                <CommentItem 
                                    comment={comment} 
                                    onReply={handleReply}
                                    onDelete={handleDelete}
                                    isAdmin={isAdmin}
                                    t={t}
                                />
                                {/* 回复列表 */}
                                {replies.length > 0 && (
                                    <div className="ml-12 space-y-4 border-l-2 border-muted pl-4">
                                        {replies.map((reply) => (
                                            <CommentItem 
                                                key={reply.id} 
                                                comment={reply} 
                                                onReply={handleReply}
                                                onDelete={handleDelete}
                                                isAdmin={isAdmin}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-muted-foreground text-sm italic py-4">{t('noComments')}</p>
                )}
            </div>

            {/* 评论表单 */}
            <div id="comment-form-section" className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('leaveComment')}</h3>
                <CommentForm 
                    postId={postId} 
                    user={user} 
                    replyTo={replyTo}
                    onCancelReply={handleCancelReply}
                    onSuccess={handleSuccess}
                />
            </div>
        </section>
    );
}
