import { getUserById, updateUser } from "@/app/actions/users";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/user-utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from 'next-intl/server';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUserById(id);
    const t = await getTranslations('admin');
    const tCommon = await getTranslations('common');

    if (!user) {
        notFound();
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
                <form action={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xl font-bold">{user.name}</p>
                            <p className="text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">{t('nickname')}</Label>
                        <Input id="name" name="name" defaultValue={user.name} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">{t('avatarUrl')}</Label>
                        <Input id="image" name="image" defaultValue={user.image || ''} placeholder="https://example.com/avatar.jpg" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">{t('bio')}</Label>
                        <Textarea id="bio" name="bio" defaultValue={user.bio || ''} placeholder={t('bioPlaceholder')} rows={3} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">{t('website')}</Label>
                        <Input id="website" name="website" defaultValue={user.website || ''} placeholder="https://yourwebsite.com" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">{t('role')}</Label>
                        <Select name="role" defaultValue={user.role || 'user'}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                                <SelectItem value="user">{t('roleUser')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold">
                            {t('saveChanges')}
                        </Button>
                        <Link href="/admin/users">
                            <Button type="button" variant="outline">{tCommon('cancel')}</Button>
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
