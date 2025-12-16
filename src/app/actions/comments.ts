'use server';

import { db } from '@/lib/db';
import { comments, posts } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { commentSchema } from '@/lib/validations';
import { isAdminAuthorized } from '@/lib/server-utils';

export type CommentActionResult = 
  | { success: true }
  | { success: false; error: string };

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

export async function approveComment(id: string) {
    await requireAdmin();
    await db.update(comments).set({ status: 'approved' }).where(eq(comments.id, id));
    revalidatePath('/admin/comments');
}

export async function deleteComment(id: string) {
    await requireAdmin();
    await db.delete(comments).where(eq(comments.id, id));
    revalidatePath('/admin/comments');
}


export async function createComment(postId: string, formData: FormData, parentId?: string): Promise<CommentActionResult> {
    const content = formData.get('content') as string;
    const guestName = formData.get('guestName') as string;
    const guestEmail = formData.get('guestEmail') as string;
    const guestWebsite = formData.get('guestWebsite') as string;

    // Check if user is logged in
    const session = await auth.api.getSession({
        headers: await headers()
    });

    let newCommentId: string | undefined;

    if (session?.user) {
        // Logged in user - skip guest validation, auto-approve
        if (!content || content.trim().length === 0) {
            return { success: false, error: 'Comment content is required' };
        }

        const result = await db.insert(comments).values({
            content: content.trim(),
            postId,
            userId: session.user.id,
            parentId: parentId || null,
            status: 'approved', // Auto-approve for logged in users
        }).returning({ id: comments.id });
        newCommentId = result[0]?.id;
    } else {
        // Guest user - validate guest fields
        const validationResult = commentSchema.safeParse({ content, guestName, guestEmail, guestWebsite });
        
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues
                .map(issue => issue.message)
                .join(', ');
            return { success: false, error: errorMessages };
        }

        const result = await db.insert(comments).values({
            content: validationResult.data.content,
            postId,
            guestName: validationResult.data.guestName,
            guestEmail: validationResult.data.guestEmail,
            guestWebsite: validationResult.data.guestWebsite || null,
            parentId: parentId || null,
            status: 'pending', // Pending for guests
        }).returning({ id: comments.id });
        newCommentId = result[0]?.id;
    }

    // Send email notifications
    if (newCommentId) {
        // Notify admin about new comment (for guest comments)
        if (!session?.user) {
            sendAdminNotification(newCommentId, postId).catch(console.error);
        }
        // Notify parent comment author if this is a reply
        if (parentId) {
            sendReplyNotification(parentId, newCommentId, postId).catch(console.error);
        }
    }

    revalidatePath('/admin/comments');
    
    return { success: true };
}

async function sendReplyNotification(parentCommentId: string, newCommentId: string, postId: string) {
    const { getResendClient } = await import('@/lib/resend');
    const { getSettings } = await import('@/app/actions/settings');
    
    const [resend, settings] = await Promise.all([
        getResendClient(),
        getSettings()
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

    const replierName = newComment.user?.name || newComment.guestName || '匿名用户';
    const siteTitle = settings.siteTitle || 'Blog';

    try {
        await resend.emails.send({
            from: settings.resendFromEmail,
            to: recipientEmail,
            subject: `${replierName} 回复了你的评论 - ${siteTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">你的评论收到了新回复</h2>
                    <p style="color: #666;">在文章《${post.title}》中，${replierName} 回复了你的评论：</p>
                    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="color: #333; margin: 0;">${newComment.content}</p>
                    </div>
                    <p style="color: #999; font-size: 14px;">
                        此邮件由 ${siteTitle} 自动发送，请勿直接回复。
                    </p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send reply notification:', error);
    }
}

export async function getPostComments(postId: string) {
    const data = await db.query.comments.findMany({
        where: (comments, { eq, and }) => and(
            eq(comments.postId, postId),
            eq(comments.status, 'approved')
        ),
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        with: {
            user: true,
        },
    });
    return data;
}

/**
 * Send email notification to admin when a new guest comment is submitted
 */
async function sendAdminNotification(commentId: string, postId: string) {
    const { getResendClient } = await import('@/lib/resend');
    const { getSettings } = await import('@/app/actions/settings');
    const { users } = await import('@/db/schema');
    
    const [resend, settings] = await Promise.all([
        getResendClient(),
        getSettings()
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const commenterName = comment.guestName || '匿名用户';

    try {
        await resend.emails.send({
            from: settings.resendFromEmail,
            to: adminUser.email,
            subject: `新评论待审核 - ${siteTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">收到新评论</h2>
                    <p style="color: #666;">文章《${post.title}》收到了来自 <strong>${commenterName}</strong> 的新评论：</p>
                    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="color: #333; margin: 0;">${comment.content}</p>
                    </div>
                    <p style="margin-top: 16px;">
                        <a href="${baseUrl}/admin/comments" style="background: #4cdf20; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                            审核评论
                        </a>
                    </p>
                    <p style="color: #999; font-size: 14px; margin-top: 24px;">
                        此邮件由 ${siteTitle} 自动发送。
                    </p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
}
