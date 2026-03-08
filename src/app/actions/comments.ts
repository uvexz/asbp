'use server';

import { db } from '@/lib/db';
import { comments, posts } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { commentSchema, formatValidationIssues } from '@/lib/validations';
import { getLocale, getTranslations } from 'next-intl/server';
import { isAdminAuthorized } from '@/lib/server-utils';
import { getCachedPostComments, invalidateCommentsCache } from '@/lib/cache-layer';
import { createMathCaptchaChallenge, verifyMathCaptchaToken } from '@/lib/crypto';

export type CommentActionResult =
    | { success: true; autoApproved?: boolean }
    | { success: false; error: string };

function sanitizeEmailHeaderValue(value: string): string {
    return value.replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function escapeHtmlWithLineBreaks(value: string): string {
    return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

export async function getCommentCaptchaChallenge() {
    return createMathCaptchaChallenge();
}

async function requireAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!isAdminAuthorized(session)) {
        throw new Error('Unauthorized');
    }

    return session;
}

export async function getComments(page: number = 1, pageSize: number = 20) {
    await requireAdmin();
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(comments);
    const total = totalResult?.count ?? 0;
    const totalPages = Math.ceil(total / validPageSize);

    const data = await db.select({
        id: comments.id,
        content: comments.content,
        author: comments.guestName,
        status: comments.status,
        createdAt: comments.createdAt,
        postTitle: posts.title
    })
        .from(comments)
        .leftJoin(posts, eq(comments.postId, posts.id))
        .orderBy(desc(comments.createdAt))
        .limit(validPageSize)
        .offset(offset);

    return {
        comments: data,
        total,
        totalPages,
        currentPage: validPage,
    };
}

export async function approveComment(id: string, addToWhitelistFlag: boolean = false) {
    await requireAdmin();

    const comment = await db.query.comments.findFirst({
        where: eq(comments.id, id),
        columns: { guestEmail: true, postId: true }
    });

    if (addToWhitelistFlag && comment?.guestEmail) {
        const { addToWhitelist } = await import('@/lib/spam-detector');
        await addToWhitelist(comment.guestEmail);
    }

    await db.update(comments).set({ status: 'approved' }).where(eq(comments.id, id));
    if (comment?.postId) {
        invalidateCommentsCache(comment.postId);
    }
    revalidatePath('/admin/comments');
}

export async function deleteComment(id: string) {
    await requireAdmin();
    const comment = await db.query.comments.findFirst({
        where: eq(comments.id, id),
        columns: { postId: true }
    });
    await db.delete(comments).where(eq(comments.id, id));
    if (comment?.postId) {
        invalidateCommentsCache(comment.postId);
    }
    revalidatePath('/admin/comments');
}


export async function createComment(postId: string, formData: FormData, parentId?: string): Promise<CommentActionResult> {
    const content = formData.get('content') as string;
    const guestName = formData.get('guestName') as string;
    const guestEmail = formData.get('guestEmail') as string;
    const guestWebsite = formData.get('guestWebsite') as string;
    const captchaToken = formData.get('captchaToken');
    const captchaResponse = formData.get('captchaResponse');

    // Check if user is logged in
    const session = await auth.api.getSession({
        headers: await headers()
    });

    let newCommentId: string | undefined;

    if (session?.user) {
        // Logged in user - skip guest validation, auto-approve
        if (!content || content.trim().length === 0) {
            const tErrors = await getTranslations('errors');
            return { success: false, error: tErrors('contentRequired') };
        }

        const result = await db.insert(comments).values({
            content: content.trim(),
            postId,
            userId: session.user.id,
            parentId: parentId || null,
            status: 'approved', // Auto-approve for logged in users
        }).returning({ id: comments.id });
        newCommentId = result[0]?.id;
        invalidateCommentsCache(postId);
    } else {
        const hasValidCaptcha =
            typeof captchaToken === 'string' &&
            typeof captchaResponse === 'string' &&
            verifyMathCaptchaToken(captchaToken, captchaResponse);

        if (!hasValidCaptcha) {
            return { success: false, error: 'captcha_invalid' };
        }

        // Guest user - validate guest fields
        const validationResult = commentSchema.safeParse({ content, guestName, guestEmail, guestWebsite });

        if (!validationResult.success) {
            const tErrors = await getTranslations('errors');
            return { success: false, error: formatValidationIssues(validationResult.error.issues, tErrors) };
        }

        // Check spam using AI
        const { checkCommentSpam } = await import('@/lib/spam-detector');
        const spamResult = await checkCommentSpam(
            validationResult.data.content,
            validationResult.data.guestName,
            validationResult.data.guestEmail,
            validationResult.data.guestWebsite
        );

        // Reject high-risk spam
        if (spamResult.isSpam) {
            return { success: false, error: 'spam_rejected' };
        }

        // Determine status based on spam check
        const status = spamResult.autoApproved ? 'approved' : 'pending';

        const result = await db.insert(comments).values({
            content: validationResult.data.content,
            postId,
            guestName: validationResult.data.guestName,
            guestEmail: validationResult.data.guestEmail,
            guestWebsite: validationResult.data.guestWebsite || null,
            parentId: parentId || null,
            status,
        }).returning({ id: comments.id });
        newCommentId = result[0]?.id;
        invalidateCommentsCache(postId);

        // Send email notifications
        if (newCommentId) {
            // Only notify admin for pending comments (not auto-approved)
            if (!spamResult.autoApproved) {
                sendAdminNotification(newCommentId, postId).catch(console.error);
            }
            // Notify parent comment author if this is a reply
            if (parentId) {
                sendReplyNotification(parentId, newCommentId, postId).catch(console.error);
            }
        }

        revalidatePath('/admin/comments');
        return { success: true, autoApproved: spamResult.autoApproved };
    }

    // Send email notifications for logged-in users
    if (newCommentId) {
        // Notify parent comment author if this is a reply
        if (parentId) {
            sendReplyNotification(parentId, newCommentId, postId).catch(console.error);
        }
    }

    revalidatePath('/admin/comments');

    return { success: true, autoApproved: true };
}

async function sendReplyNotification(parentCommentId: string, newCommentId: string, postId: string) {
    const { getResendClient } = await import('@/lib/resend');
    const { getSettings } = await import('@/app/actions/settings');

    const locale = await getLocale();
    const [resend, settings, tEmails] = await Promise.all([
        getResendClient(),
        getSettings(),
        getTranslations({ locale, namespace: 'emails' }),
    ]);

    if (!resend || !settings.resendFromEmail) {
        return; // Email not configured
    }

    // Get parent comment to find recipient email
    const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentCommentId),
        with: { user: true }
    });

    if (!parentComment) return;

    const recipientEmail = parentComment.user?.email || parentComment.guestEmail;
    if (!recipientEmail) return;

    // Get new comment details
    const newComment = await db.query.comments.findFirst({
        where: eq(comments.id, newCommentId),
        with: { user: true }
    });

    if (!newComment) return;

    // Get post details
    const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId)
    });

    if (!post) return;

    const replierName = newComment.user?.name || newComment.guestName || tEmails('anonymousUser');
    const siteTitle = settings.siteTitle || 'Blog';

    try {
        await resend.emails.send({
            from: settings.resendFromEmail,
            to: recipientEmail,
            subject: sanitizeEmailHeaderValue(tEmails('replySubject', { replierName, siteTitle })),
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${tEmails('replyHeading')}</h2>
                    <p style="color: #666;">${tEmails('replyBody', {
                        postTitle: escapeHtml(post.title),
                        replierName: escapeHtml(replierName),
                    })}</p>
                    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="color: #333; margin: 0;">${escapeHtmlWithLineBreaks(newComment.content)}</p>
                    </div>
                    <p style="color: #999; font-size: 14px;">
                        ${tEmails('autoMessageNoReply', { siteTitle: escapeHtml(siteTitle) })}
                    </p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send reply notification:', error);
    }
}

export async function getPostComments(postId: string) {
    return getCachedPostComments(postId);
}

/**
 * Send email notification to admin when a new guest comment is submitted
 */
async function sendAdminNotification(commentId: string, postId: string) {
    const { getResendClient } = await import('@/lib/resend');
    const { getSettings } = await import('@/app/actions/settings');
    const { users } = await import('@/db/schema');

    const locale = await getLocale();
    const [resend, settings, tEmails] = await Promise.all([
        getResendClient(),
        getSettings(),
        getTranslations({ locale, namespace: 'emails' }),
    ]);

    if (!resend || !settings.resendFromEmail) {
        return; // Email not configured
    }

    // Get admin email
    const adminUser = await db.query.users.findFirst({
        where: eq(users.role, 'admin'),
        columns: { email: true, name: true }
    });

    if (!adminUser?.email) return;

    // Get comment details
    const comment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
    });

    if (!comment) return;

    // Get post details
    const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
        columns: { title: true, slug: true }
    });

    if (!post) return;

    const siteTitle = settings.siteTitle || 'Blog';
    const reviewUrl = escapeHtml(`${process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/admin/comments`);
    const commenterName = comment.guestName || tEmails('anonymousUser');

    try {
        await resend.emails.send({
            from: settings.resendFromEmail,
            to: adminUser.email,
            subject: sanitizeEmailHeaderValue(tEmails('adminPendingSubject', { siteTitle })),
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${tEmails('adminPendingHeading')}</h2>
                    <p style="color: #666;">${tEmails('adminPendingBody', {
                        postTitle: escapeHtml(post.title),
                        commenterName: escapeHtml(commenterName),
                    })}</p>
                    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="color: #333; margin: 0;">${escapeHtmlWithLineBreaks(comment.content)}</p>
                    </div>
                    <p style="margin-top: 16px;">
                        <a href="${reviewUrl}" style="background: #4cdf20; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                            ${tEmails('reviewComment')}
                        </a>
                    </p>
                    <p style="color: #999; font-size: 14px; margin-top: 24px;">
                        ${tEmails('autoMessage', { siteTitle: escapeHtml(siteTitle) })}
                    </p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
}
