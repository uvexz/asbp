import { Plus, Trash2, ExternalLink, GripVertical, Type, Link as LinkIcon, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { getNavItems, createNavItem, deleteNavItem } from '@/app/actions/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AdminNavigationPage() {
    const navItems = await getNavItems();
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');
    const tBlog = await getTranslations('blog');

    return (
        <div className="flex flex-col h-full">
            <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('navSettings')}</h1>
                    <p className="text-gray-500 text-base font-normal leading-normal">{t('navSettingsDesc')}</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold">
                            <Plus className="mr-2 h-4 w-4" /> {t('addNavigation')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('addNavItem')}</DialogTitle>
                        </DialogHeader>
                        <form action={createNavItem} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">{t('displayName')}</Label>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText><Type className="size-4" /></InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput id="label" name="label" placeholder="About" required />
                                </InputGroup>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">{t('linkUrl')}</Label>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText><LinkIcon className="size-4" /></InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput id="url" name="url" placeholder="/about or https://..." required />
                                </InputGroup>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">{t('sortOrder')}</Label>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText><ListOrdered className="size-4" /></InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
                                </InputGroup>
                                <p className="text-xs text-gray-500">{t('sortOrderHint')}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="openInNewTab"
                                    id="openInNewTab"
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="openInNewTab">{t('openInNewTab')}</Label>
                            </div>
                            <Button type="submit" className="w-full">{tCommon('add')}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">

                {/* Fixed items notice */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h3 className="font-semibold mb-2">{t('fixedNavItems')}</h3>
                    <div className="flex gap-2">
                        <Badge variant="secondary">{tBlog('home')} → /</Badge>
                        <Badge variant="secondary">{tBlog('memos')} → /memo</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{t('fixedNavItemsDesc')}</p>
                </div>

                {/* Custom nav items */}
                <div className="rounded-md border bg-white dark:bg-black">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>{tCommon('name')}</TableHead>
                                <TableHead>{t('link')}</TableHead>
                                <TableHead>{t('newTab')}</TableHead>
                                <TableHead>{t('sortOrder')}</TableHead>
                                <TableHead className="text-right">{tCommon('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {navItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                    </TableCell>
                                    <TableCell className="font-medium">{item.label}</TableCell>
                                    <TableCell className="font-mono text-sm">{item.url}</TableCell>
                                    <TableCell>
                                        {item.openInNewTab && <ExternalLink className="h-4 w-4 text-gray-500" />}
                                    </TableCell>
                                    <TableCell>{item.sortOrder}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <form action={deleteNavItem.bind(null, item.id)}>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-100">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {navItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                                        {t('noNavItems')}
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
