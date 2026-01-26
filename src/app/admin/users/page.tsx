import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { getUsers, deleteUser } from "@/app/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { getInitials, formatRole } from "@/lib/user-utils";
import { formatDate } from "@/lib/date-utils";
import { getTranslations } from 'next-intl/server';

export default async function AdminUsersPage() {
    const users = await getUsers();
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('userManagement')}</h1>
                <p className="text-gray-500 text-base font-normal leading-normal mt-2">{t('userManagementDesc')}</p>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
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
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            {user.website && (
                                                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                    {user.website}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'admin' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                        {formatRole(user.role || 'user')}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">{user.bio || '-'}</TableCell>
                                <TableCell>{formatDate(user.createdAt)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/admin/users/${user.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <form action={async () => {
                                            'use server';
                                            await deleteUser(user.id);
                                        }}>
                                            <Button variant="outline" size="sm" type="submit">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </main>
        </div>
    );
}
