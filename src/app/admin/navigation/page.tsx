import { Plus, Trash2, ExternalLink, GripVertical, Type, Link as LinkIcon, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
        <div className="flex min-h-full flex-col">
            <header className="flex flex-wrap items-start justify-between gap-4 px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('navSettings')}</h1>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('navSettingsDesc')}</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('addNavigation')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
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
                                <p className="text-xs text-muted-foreground">{t('sortOrderHint')}</p>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
                                <Label htmlFor="openInNewTab" className="cursor-pointer">{t('openInNewTab')}</Label>
                                <Switch id="openInNewTab" name="openInNewTab" />
                            </div>
                            <Button type="submit" className="w-full">{tCommon('add')}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <div className="space-y-6">
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <h2 className="text-base font-semibold tracking-tight text-foreground">{t('fixedNavItems')}</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="secondary">{tBlog('home')} → /</Badge>
                            <Badge variant="secondary">{tBlog('memos')} → /memo</Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{t('fixedNavItemsDesc')}</p>
                    </div>

                    <div className="rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12" />
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
                                            <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{item.label}</TableCell>
                                        <TableCell className="font-mono text-sm text-muted-foreground">{item.url}</TableCell>
                                        <TableCell>
                                            {item.openInNewTab ? <ExternalLink className="h-4 w-4 text-muted-foreground" /> : null}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{item.sortOrder}</TableCell>
                                        <TableCell className="text-right">
                                            <form action={deleteNavItem.bind(null, item.id)}>
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    title={tCommon('delete')}
                                                    aria-label={tCommon('delete')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {navItems.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            {t('noNavItems')}
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
