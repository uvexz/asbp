import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { getUsers, deleteUser } from "@/app/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { getInitials } from "@/lib/user-utils";
import { formatDate } from "@/lib/date-utils";
import { getTranslations } from 'next-intl/server';

export default async function AdminUsersPage() {
    const users = await getUsers();
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');

    return (
        <div className="flex min-h-full flex-col">
            <header className="flex flex-col gap-2 px-4 py-6 sm:px-6">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('userManagement')}</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('userManagementDesc')}</p>
            </header>

            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <div className="rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('user')}</TableHead>
                                <TableHead>{t('email')}</TableHead>
                                <TableHead>{t('role')}</TableHead>
                                <TableHead>{t('bio')}</TableHead>
                                <TableHead>{t('registrationTime')}</TableHead>
                                <TableHead className="text-right">{tCommon('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 space-y-1">
                                                <p className="font-medium text-foreground">{user.name}</p>
                                                {user.website && (
                                                    <a
                                                        href={user.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block truncate text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                                                    >
                                                        {user.website}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                            {user.role === 'admin' ? t('roleAdmin') : t('roleUser')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{user.bio || '-'}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/admin/users/${user.id}`}>
                                                <Button variant="outline" size="icon" aria-label={t('editUser')} title={t('editUser')}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <form action={async () => {
                                                'use server';
                                                await deleteUser(user.id);
                                            }}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="submit"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    aria-label={tCommon('delete')}
                                                    title={tCommon('delete')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
}
