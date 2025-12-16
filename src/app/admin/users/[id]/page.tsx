import { getUserById, updateUser } from "@/app/actions/users";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, User, Mail, Globe, FileText, Shield, Image } from "lucide-react";
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

    // Check if current user is editing their own profile
    const session = await auth.api.getSession({ headers: await headers() });
    const isOwnProfile = session?.user?.id === id;

    // Get passkeys if editing own profile
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
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <Link href="/admin/users" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    {t('backToUsers')}
                </Link>
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('editUser')}</h1>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
                <div className="max-w-2xl space-y-8">
                    {/* User Avatar & Info Header */}
                    <div className="flex items-center gap-6 p-4 border rounded-lg bg-muted/30">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-xl font-bold">{user.name}</p>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Mail className="size-4" />
                                {user.email}
                            </p>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                                {user.role === 'admin' ? t('roleAdmin') : t('roleUser')}
                            </span>
                        </div>
                    </div>

                    {/* User Info Form */}
                    <form action={handleSubmit} className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <User className="size-5" />
                                {t('userInfo') || 'User Information'}
                            </h2>
                            <div className="space-y-3">
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText>{t('nickname')}</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="name"
                                        name="name"
                                        defaultValue={user.name}
                                        required
                                    />
                                </InputGroup>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <InputGroupText><Image className="size-4" /></InputGroupText>
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
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="size-5" />
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
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Shield className="size-5" />
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

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold">
                                {t('saveChanges')}
                            </Button>
                            <Link href="/admin/users">
                                <Button type="button" variant="outline">{tCommon('cancel')}</Button>
                            </Link>
                        </div>
                    </form>

                    {/* Security Section - Only show for own profile */}
                    {isOwnProfile && (
                        <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-gray-800">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tAuth('security')}</h2>
                            
                            {/* Change Password */}
                            <ChangePassword />
                            
                            {/* Passkey Management */}
                            <PasskeyManager initialPasskeys={userPasskeys} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
