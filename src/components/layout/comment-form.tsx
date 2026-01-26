'use client';

import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { createComment, type CommentActionResult } from '@/app/actions/comments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { md5 } from '@/lib/hash';

interface CommentFormProps {
    postId: string;
    user?: {
        id: string;
        name: string;
        image?: string | null;
    } | null;
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

export function CommentForm({ postId, user }: CommentFormProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<CommentActionResult | null>(null);
    const [guestEmail, setGuestEmail] = useState('');
    const t = useTranslations('blog');
    const tAuth = useTranslations('auth');

    const gravatarUrl = useMemo(() => {
        if (guestEmail && guestEmail.includes('@')) {
            return getGravatarUrl(guestEmail);
        }
        return null;
    }, [guestEmail]);

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const response = await createComment(postId, formData);
            setResult(response);
            
            if (response.success) {
                const form = document.getElementById('comment-form') as HTMLFormElement;
                form?.reset();
            }
        });
    }

    return (
        <div className="border-t border-neutral-200 pt-8">
            <h3 className="text-xl font-bold text-black mb-4">{t('leaveComment')}</h3>
            
            {result?.success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    {user ? t('commentPublished') : t('commentPending')}
                </div>
            )}
            
            {result && !result.success && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {result.error}
                </div>
            )}
            
            <form id="comment-form" action={handleSubmit} className="space-y-4">
                {user ? (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-black">{user.name}</p>
                            <p className="text-sm text-neutral-500">{t('commentAsUser')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                        <Link href="/sign-in" className="text-blue-600 hover:underline">{tAuth('signIn')}</Link> {t('loginForAutoApprove')}
                    </div>
                )}
                
                <Textarea 
                    name="content" 
                    className="w-full rounded border-neutral-300 focus:ring-black focus:border-black transition" 
                    placeholder={t('commentPlaceholder')} 
                    rows={4} 
                    required 
                    disabled={isPending}
                />
                
                {!user && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                                <AvatarImage src={gravatarUrl || undefined} />
                                <AvatarFallback>?</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex flex-col sm:flex-row gap-4">
                                <Input 
                                    name="guestName" 
                                    className="flex-1 rounded border-neutral-300 focus:ring-black focus:border-black transition" 
                                    placeholder={t('commentName')} 
                                    type="text" 
                                    required 
                                    disabled={isPending}
                                />
                                <Input 
                                    name="guestEmail" 
                                    className="flex-1 rounded border-neutral-300 focus:ring-black focus:border-black transition" 
                                    placeholder={t('commentEmail')} 
                                    type="email" 
                                    required 
                                    disabled={isPending}
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <Input 
                            name="guestWebsite" 
                            className="rounded border-neutral-300 focus:ring-black focus:border-black transition" 
                            placeholder={t('commentWebsite')} 
                            type="url" 
                            disabled={isPending}
                        />
                    </div>
                )}
                
                <Button 
                    className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50" 
                    type="submit"
                    disabled={isPending}
                >
                    {isPending ? t('submittingComment') : t('submitComment')}
                </Button>
            </form>
        </div>
    );
}
