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
                toast.success(t('tagCreated'));
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
                toast.success(t('tagUpdated'));
                setEditingId(null);
                setEditingName('');
                await refreshTags();
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <div className="flex min-h-full flex-col">
            <header className="flex flex-col gap-2 px-4 py-6 sm:px-6">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('tagManagement')}</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('tagManagementDesc')}</p>
            </header>

            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <div className="space-y-8">
                    <section className="max-w-xl space-y-4">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">{t('createNewTag')}</h2>
                        <form onSubmit={handleCreateTag} className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                            <Button type="submit" disabled={isPending}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('addTag')}
                            </Button>
                        </form>
                        {error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                                {error}
                            </div>
                        )}
                    </section>

                    <div className="rounded-xl border bg-card">
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
                                        <TableCell className="font-medium text-foreground">
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
                                        <TableCell className="font-mono text-sm text-muted-foreground">{tag.slug}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {editingId === tag.id ? (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-foreground hover:bg-accent"
                                                            onClick={() => handleUpdateTag(tag.id)}
                                                            disabled={isPending}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:bg-accent hover:text-foreground"
                                                            onClick={cancelEditing}
                                                            disabled={isPending}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:bg-accent hover:text-foreground"
                                                            onClick={() => startEditing(tag)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <DeleteButton
                                                            onDelete={() => handleDeleteTag(tag.id)}
                                                            title={t('deleteTagTitle')}
                                                            description={t('deleteTagDescription', { name: tag.name })}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {tags.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            {t('noTagsFound')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </main>
        </div>
    );
}
