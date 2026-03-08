'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createComment, deleteComment, type CommentActionResult } from '@/app/actions/comments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { md5 } from '@/lib/hash';
import { Captcha } from '@/components/ui/captcha';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth/use-session';

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
  return `https://weavatar.com/avatar/${hash}?d=mp`;
}

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  isAdmin,
  t,
  locale,
}: {
  comment: Comment;
  onReply: (commentId: string, authorName: string) => void;
  onDelete?: (commentId: string) => void;
  isAdmin?: boolean;
  t: ReturnType<typeof useTranslations<'blog'>>;
  locale: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const authorName = comment.user ? comment.user.name : (comment.guestName || t('anonymous'));
  const authorImage = comment.user
    ? comment.user.image
    : (comment.guestEmail ? getGravatarUrl(comment.guestEmail) : null);
  const authorBio = comment.user ? comment.user.bio : null;
  const authorWebsite = comment.user ? comment.user.website : comment.guestWebsite;

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
    <article className="space-y-2">
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={authorImage || undefined} />
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
            {getInitials(authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {authorWebsite ? (
              <a
                href={authorWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {authorName}
              </a>
            ) : (
              <span className="font-medium text-foreground">{authorName}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt, locale)}
            </span>
          </div>
          {authorBio && <p className="mt-0.5 text-xs text-muted-foreground">{authorBio}</p>}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
            {comment.content}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => onReply(comment.id, authorName)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('reply')}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                {t('delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CommentForm({
  postId,
  user,
  replyTo,
  onCancelReply,
  onSuccess,
}: {
  postId: string;
  user?: CommentSectionProps['user'];
  replyTo?: { id: string; authorName: string } | null;
  onCancelReply?: () => void;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CommentActionResult | null>(null);
  const [content, setContent] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations('blog');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');

  const needsCaptcha = !user;
  const canSubmit = Boolean(content.trim()) && (user || captchaValid);

  async function handleSubmit(formData: FormData) {
    if (needsCaptcha && !captchaValid) {
      setResult({ success: false, error: 'captcha_invalid' });
      return;
    }

    startTransition(async () => {
      const response = await createComment(postId, formData, replyTo?.id);
      setResult(response);

      if (response.success) {
        formRef.current?.reset();
        setContent('');
        setCaptchaValid(false);
        setCaptchaResetKey((value) => value + 1);
        onSuccess?.();
        return;
      }

      if (needsCaptcha) {
        setCaptchaValid(false);
        setCaptchaResetKey((value) => value + 1);
      }
    });
  }

  return (
    <div className="space-y-4">
      {replyTo && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <p>
            {t('replyingTo')} <span className="text-foreground">{replyTo.authorName}</span>
          </p>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {tCommon('cancel')}
          </button>
        </div>
      )}

      {result?.success && (
        <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground">
          {result.autoApproved ? t('commentPublished') : t('commentPending')}
        </div>
      )}

      {result && !result.success && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {result.error === 'spam_rejected'
            ? t('spamRejected')
            : result.error === 'captcha_invalid'
              ? t('captchaRequired')
              : result.error}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        {user ? (
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {t('commentAsUser')} <span className="font-medium text-foreground">{user.name}</span>
          </div>
        ) : (
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
              {tAuth('signIn')}
            </Link>{' '}
            {t('loginForAutoApprove')}
          </div>
        )}

        {!user && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guest-name">{t('commentName')}</Label>
              <Input
                id="guest-name"
                name="guestName"
                placeholder={t('commentName')}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email">{t('commentEmail')}</Label>
              <Input
                id="guest-email"
                name="guestEmail"
                type="email"
                placeholder={t('commentEmail')}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="guest-website">{t('commentWebsite')}</Label>
              <Input
                id="guest-website"
                name="guestWebsite"
                type="url"
                placeholder={t('commentWebsite')}
                disabled={isPending}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="comment-content">
            {replyTo ? t('replyPlaceholder') : t('commentContent')}
          </Label>
          <Textarea
            id="comment-content"
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-28 resize-y"
            placeholder={replyTo ? t('replyPlaceholder') : t('commentPlaceholder')}
            required
            disabled={isPending}
          />
        </div>

        {needsCaptcha && (
          <Captcha
            key={captchaResetKey}
            onVerify={setCaptchaValid}
            label={t('captchaLabel')}
            refreshLabel={t('refreshCaptcha')}
          />
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !canSubmit}>
            {isPending
              ? t('submittingComment')
              : replyTo
                ? t('reply')
                : t('submitComment')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CommentSection({ postId, comments: initialComments, user, isAdmin }: CommentSectionProps) {
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
  const [comments, setComments] = useState(initialComments);
  const router = useRouter();
  const t = useTranslations('blog');
  const locale = useLocale();
  const { data: session } = useSession({ enabled: !user });
  const effectiveUser = session?.user ?? user ?? null;
  const effectiveIsAdmin = session?.isAdmin ?? isAdmin ?? false;

  const rootComments = comments.filter((comment) => !comment.parentId);
  const repliesMap = new Map<string, Comment[]>();

  comments.forEach((comment) => {
    if (comment.parentId) {
      const replies = repliesMap.get(comment.parentId) || [];
      replies.push(comment);
      repliesMap.set(comment.parentId, replies);
    }
  });

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ id: commentId, authorName });
    document
      .getElementById('comment-form-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleSuccess = () => {
    setReplyTo(null);
  };

  const handleDelete = (commentId: string) => {
    setComments((previous) => previous.filter((comment) => comment.id !== commentId && comment.parentId !== commentId));
    router.refresh();
  };

  return (
    <section className="space-y-8 border-t border-border/60 pt-10">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t('commentsCount', { count: comments.length })}
        </h2>
      </div>

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
                  isAdmin={effectiveIsAdmin}
                  t={t}
                  locale={locale}
                />
                {replies.length > 0 && (
                  <div className="ml-12 space-y-4 border-l border-border/60 pl-5">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        onReply={handleReply}
                        onDelete={handleDelete}
                        isAdmin={effectiveIsAdmin}
                        t={t}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="py-2 text-sm text-muted-foreground">{t('noComments')}</p>
        )}
      </div>

      <div id="comment-form-section" className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {t('leaveComment')}
        </h3>
        <CommentForm
          postId={postId}
          user={effectiveUser}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          onSuccess={handleSuccess}
        />
      </div>
    </section>
  );
}
