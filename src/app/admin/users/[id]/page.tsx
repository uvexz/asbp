import { getUserById, updateUser } from "@/app/actions/users";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/user-utils";
import Link from "next/link";
import { ArrowLeft, User, Mail, Globe, FileText, Shield, Image as ImageIcon } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { passkeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PasskeyManager } from "@/components/layout/passkey-manager";
import { ChangePassword } from "@/components/layout/change-password";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUserById(id);
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');
    const tAuth = await getTranslations('auth');

    if (!user) {
        notFound();
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const isOwnProfile = session?.user?.id === id;

    let userPasskeys: { id: string; name: string | null; credentialID: string; deviceType: string; backedUp: boolean; createdAt: Date | null }[] = [];
    if (isOwnProfile) {
        userPasskeys = await db
            .select()
            .from(passkeys)
            .where(eq(passkeys.userId, id))
            .orderBy(passkeys.createdAt);
    }

    async function handleSubmit(formData: FormData) {
        'use server';

        const name = formData.get('name') as string;
        const image = formData.get('image') as string;
        const bio = formData.get('bio') as string;
        const website = formData.get('website') as string;
        const role = formData.get('role') as string;

        await updateUser(id, {
            name: name || undefined,
            image: image || undefined,
            bio: bio || undefined,
            website: website || undefined,
            role: role || undefined,
        });

        redirect('/admin/users');
    }

    return (
        <div className="flex min-h-full flex-col">
            <header className="px-4 py-6 sm:px-6">
                <div className="flex flex-col gap-4">
                    <Link href="/admin/users" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        {t('backToUsers')}
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">{t('editUser')}</h1>
                        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('userManagementDesc')}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto px-4 pb-6 sm:px-6">
                <div className="max-w-2xl space-y-8">
                    <div className="flex items-center gap-6 rounded-xl border bg-muted/30 p-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 space-y-1">
                            <p className="text-xl font-semibold text-foreground">{user.name}</p>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="size-4" />
                                <span className="truncate">{user.email}</span>
                            </p>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role === 'admin' ? t('roleAdmin') : t('roleUser')}
                            </Badge>
                        </div>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <User className="size-5 text-muted-foreground" />
                                {t('userInfo')}
                            </h2>
                            <div className="space-y-3">
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText><User className="size-4" /></InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="name"
                                        name="name"
                                        defaultValue={user.name}
                                        placeholder={t('nickname')}
                                        required
                                    />
                                </InputGroup>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText><ImageIcon className="size-4" /></InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="image"
                                        name="image"
                                        defaultValue={user.image || ''}
                                        placeholder={t('avatarUrl')}
                                    />
                                </InputGroup>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText><Globe className="size-4" /></InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="website"
                                        name="website"
                                        defaultValue={user.website || ''}
                                        placeholder={t('website')}
                                    />
                                </InputGroup>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <FileText className="size-5 text-muted-foreground" />
                                {t('bio')}
                            </h2>
                            <Textarea
                                id="bio"
                                name="bio"
                                defaultValue={user.bio || ''}
                                placeholder={t('bioPlaceholder')}
                                rows={3}
                                className="resize-none"
                            />
                        </section>

                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <Shield className="size-5 text-muted-foreground" />
                                {t('role')}
                            </h2>
                            <Select name="role" defaultValue={user.role || 'user'}>
                                <SelectTrigger className="w-full max-w-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                                    <SelectItem value="user">{t('roleUser')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </section>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button type="submit">{t('saveChanges')}</Button>
                            <Link href="/admin/users">
                                <Button type="button" variant="outline">{tCommon('cancel')}</Button>
                            </Link>
                        </div>
                    </form>

                    {isOwnProfile && (
                        <section className="space-y-6 border-t border-border pt-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">{tAuth('security')}</h2>
                                <p className="text-sm text-muted-foreground">{tAuth('passkeysDesc')}</p>
                            </div>
                            <ChangePassword />
                            <PasskeyManager initialPasskeys={userPasskeys} />
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
