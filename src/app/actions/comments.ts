'use server';

import { db } from '@/lib/db';
import { comments, posts } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
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

export async function getComments() {
    // Join with posts to get post title if possible, or just fetch comments
    // Drizzle query builder with relations is cleaner but currently we used raw schema without explicit relations.
    // We'll manual join or just fetch generic for now.
    const data = await db.select({
        id: comments.id,
        content: comments.content,
        // For guest comments
        author: comments.guestName,
        status: comments.status,
        createdAt: comments.createdAt,
        postTitle: posts.title
    })
        .from(comments)
        .leftJoin(posts, eq(comments.postId, posts.id))
        .orderBy(desc(comments.createdAt));

    return data;
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


export async function createComment(postId: string, formData: FormData): Promise<CommentActionResult> {
    const content = formData.get('content') as string;
    const guestName = formData.get('guestName') as string;
    const guestEmail = formData.get('guestEmail') as string;

    // Check if user is logged in
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user) {
        // Logged in user - skip guest validation, auto-approve
        if (!content || content.trim().length === 0) {
            return { success: false, error: 'Comment content is required' };
        }

        await db.insert(comments).values({
            content: content.trim(),
            postId,
            userId: session.user.id,
            status: 'approved', // Auto-approve for logged in users
        });
    } else {
        // Guest user - validate guest fields
        const validationResult = commentSchema.safeParse({ content, guestName, guestEmail });
        
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues
                .map(issue => issue.message)
                .join(', ');
            return { success: false, error: errorMessages };
        }

        await db.insert(comments).values({
            content: validationResult.data.content,
            postId,
            guestName: validationResult.data.guestName,
            guestEmail: validationResult.data.guestEmail,
            status: 'pending', // Pending for guests
        });
    }

    revalidatePath('/admin/comments');
    
    return { success: true };
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
