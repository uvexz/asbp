'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getTags, createTag, deleteTag } from '@/app/actions/tags';
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
                await refreshTags();
            } else {
                setError(result.error);
            }
        });
    }

    async function handleDeleteTag(id: string) {
        startTransition(async () => {
            const result = await deleteTag(id);
            if (result.success) {
                await refreshTags();
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
                        <Input
                            type="text"
                            placeholder={t('enterTagName')}
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            disabled={isPending}
                            className="flex-1"
                        />
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
                                    <TableCell className="font-medium">{tag.name}</TableCell>
                                    <TableCell className="text-gray-500">{tag.slug}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:text-red-600 hover:bg-red-100"
                                            onClick={() => handleDeleteTag(tag.id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
