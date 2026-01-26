'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, Pencil, Check, X, Tag as TagIcon } from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-button';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getTags, createTag, deleteTag, updateTag } from '@/app/actions/tags';
import { useTranslations } from 'next-intl';

type Tag = {
    id: string;
    name: string;
    slug: string;
};

export default function AdminTagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const t = useTranslations('admin');
    const tCommon = useTranslations('common');

    // Load tags on mount
    useEffect(() => {
        async function loadTags() {
            const data = await getTags();
            setTags(data);
        }
        loadTags();
    }, []);

    async function refreshTags() {
        const data = await getTags();
        setTags(data);
    }

    async function handleCreateTag(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!newTagName.trim()) {
            setError(t('tagNameRequired'));
            return;
        }

        const formData = new FormData();
        formData.append('name', newTagName.trim());

        startTransition(async () => {
            const result = await createTag(formData);
            if (result.success) {
                setNewTagName('');
                toast.success('标签创建成功');
                await refreshTags();
            } else {
                setError(result.error);
                toast.error(result.error);
            }
        });
    }

    async function handleDeleteTag(id: string) {
        const result = await deleteTag(id);
        if (result.success) {
            await refreshTags();
        }
    }

    function startEditing(tag: Tag) {
        setEditingId(tag.id);
        setEditingName(tag.name);
    }

    function cancelEditing() {
        setEditingId(null);
        setEditingName('');
    }

    async function handleUpdateTag(id: string) {
        if (!editingName.trim()) {
            toast.error(t('tagNameRequired'));
            return;
        }

        startTransition(async () => {
            const result = await updateTag(id, editingName.trim());
            if (result.success) {
                toast.success('标签更新成功');
                setEditingId(null);
                setEditingName('');
                await refreshTags();
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('tagManagement')}</h1>
                <p className="text-gray-500 text-base font-normal leading-normal mt-2">{t('tagManagementDesc')}</p>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
                {/* Create Tag Form */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('createNewTag')}</h2>
                    <form onSubmit={handleCreateTag} className="flex items-center gap-4 max-w-md">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <InputGroupText><TagIcon className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                type="text"
                                placeholder={t('enterTagName')}
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                disabled={isPending}
                            />
                        </InputGroup>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold"
                        >
                            <Plus className="mr-2 h-4 w-4" /> {t('addTag')}
                        </Button>
                    </form>
                    {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                </div>

                {/* Tags Table */}
                <div className="rounded-md border bg-white dark:bg-black">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{tCommon('name')}</TableHead>
                                <TableHead>{t('slug')}</TableHead>
                                <TableHead className="text-right">{tCommon('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tags.map((tag) => (
                                <TableRow key={tag.id}>
                                    <TableCell className="font-medium">
                                        {editingId === tag.id ? (
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="h-8 w-40"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateTag(tag.id);
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                        ) : (
                                            tag.name
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-500">{tag.slug}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {editingId === tag.id ? (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-green-600 hover:bg-green-50"
                                                        onClick={() => handleUpdateTag(tag.id)}
                                                        disabled={isPending}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-500 hover:bg-gray-100"
                                                        onClick={cancelEditing}
                                                        disabled={isPending}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-500 hover:bg-gray-100"
                                                        onClick={() => startEditing(tag)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <DeleteButton
                                                        onDelete={() => handleDeleteTag(tag.id)}
                                                        title="删除标签"
                                                        description={`确定要删除标签「${tag.name}」吗？关联的文章将取消此标签。`}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tags.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-gray-500">
                                        {t('noTagsFound')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
}
