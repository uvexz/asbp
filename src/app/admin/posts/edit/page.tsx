import Link from 'next/link';
import { Save, ArrowLeft, Type, Link as LinkIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { Label } from '@/components/ui/label';
import { createPost, updatePost, getPostById } from '@/app/actions/posts';
import { getTags, getPostTags, updatePostTags } from '@/app/actions/tags';
import { hasS3Config } from '@/app/actions/settings';
import { redirect } from 'next/navigation';
import { TagSelector } from '@/components/ui/tag-selector';
import { PostContentEditor } from '@/components/ui/post-content-editor';
import { getTranslations } from 'next-intl/server';

type PostType = 'post' | 'page' | 'memo';

export default async function AdminEditPostPage({ searchParams }: { searchParams: Promise<{ id?: string; type?: string }> }) {
    const { id, type } = await searchParams;
    const isEdit = !!id;
    let post: Awaited<ReturnType<typeof getPostById>> | null = null;
    let postTagIds: string[] = [];
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');

    // Default post type from query param or 'post'
    const defaultPostType = (type as PostType) || 'post';

    // Fetch all available tags and check S3 config
    const allTags = await getTags();
    const s3Configured = await hasS3Config();

    if (isEdit) {
        post = await getPostById(id);
        if (!post) {
            redirect('/admin/posts');
        }
        // Fetch tags for this post
        const postTags = await getPostTags(id);
        postTagIds = postTags.map(tag => tag.id);
    }

    const currentPostType = (post?.postType as PostType) || defaultPostType;
    const isMemo = currentPostType === 'memo';

    const postTypeLabels: Record<PostType, { new: string; edit: string }> = {
        post: { new: t('newPost'), edit: t('editPost') },
        page: { new: t('newPage'), edit: t('editPage') },
        memo: { new: t('newMemo'), edit: t('editMemo') },
    };

    // For edit mode, update tags before the main action
    async function handleEditSubmit(formData: FormData) {
        'use server';
        
        if (!post) return;
        
        // Get tag IDs from form
        const tagIds = formData.getAll('tagIds') as string[];
        
        // Update tags first (before redirect happens)
        await updatePostTags(post.id, tagIds);
        
        // Then update post (this will redirect)
        await updatePost(post.id, formData);
    }

    // Wrapper for createPost to handle the return type
    async function handleCreateSubmit(formData: FormData) {
        'use server';
        await createPost(formData);
    }

    // createPost now handles tags directly via formData
    const action = isEdit && post ? handleEditSubmit : handleCreateSubmit;

    return (
        <div className="flex flex-col h-full">
            <form action={action} className="flex flex-col h-full">
                <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
                    <div className="flex items-center gap-4 text-gray-900 dark:text-white">
                        <Link href="/admin/posts">
                            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                            {isEdit ? postTypeLabels[currentPostType].edit : postTypeLabels[currentPostType].new}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="submit" className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold">
                            <Save className="mr-2 h-4 w-4" /> {tCommon('save')}
                        </Button>
                    </div>
                </header>
                <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
                    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
                        <div className="flex-grow space-y-4">
                            {/* Hidden postType field */}
                            <input type="hidden" name="postType" value={currentPostType} />
                            
                            {/* Title - hidden for memo, but still required for DB */}
                            {isMemo ? (
                                <input type="hidden" name="title" value={post?.title || ''} />
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="title">{t('postTitle')}</Label>
                                    <InputGroup>
                                        <InputGroupAddon>
                                            <InputGroupText><Type className="size-4" /></InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="title"
                                            name="title"
                                            placeholder={t('postTitle')}
                                            required
                                            defaultValue={post?.title}
                                        />
                                    </InputGroup>
                                </div>
                            )}
                            
                            {/* Slug - auto-generated for memo */}
                            {isMemo ? (
                                <input type="hidden" name="slug" value={post?.slug || ''} />
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="slug">{t('postSlug')}</Label>
                                    <InputGroup>
                                        <InputGroupAddon>
                                            <InputGroupText><LinkIcon className="size-4" /></InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="slug"
                                            name="slug"
                                            placeholder="article-slug"
                                            className="font-mono text-sm"
                                            required
                                            defaultValue={post?.slug}
                                        />
                                    </InputGroup>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="content">{t('postContent')}</Label>
                                <PostContentEditor
                                    name="content"
                                    defaultValue={post?.content}
                                    placeholder={isMemo ? t('writeSomething') : t('postContent')}
                                    minHeight={isMemo ? '200px' : '400px'}
                                    hasS3={s3Configured}
                                />
                            </div>
                        </div>
                        <div className="lg:w-80 flex-shrink-0 space-y-6">
                            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                                <h3 className="font-semibold leading-none tracking-tight">{t('publishSettings')}</h3>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="published"
                                        id="published"
                                        defaultChecked={post?.published ?? true}
                                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <Label htmlFor="published">{tCommon('publish')}</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="publishedAt">{t('publishTime')}</Label>
                                    <InputGroup>
                                        <InputGroupAddon>
                                            <InputGroupText><Calendar className="size-4" /></InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            type="datetime-local"
                                            id="publishedAt"
                                            name="publishedAt"
                                            defaultValue={post?.publishedAt ? new Date(post.publishedAt.getTime() - post.publishedAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                                        />
                                    </InputGroup>
                                    <p className="text-xs text-muted-foreground">{t('publishTimeHint')}</p>
                                </div>
                            </div>
                            {!isMemo && (
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                                    <h3 className="font-semibold leading-none tracking-tight">{t('postTags')}</h3>
                                    <TagSelector 
                                        availableTags={allTags} 
                                        selectedTagIds={postTagIds}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </form>
        </div>
    );
}
