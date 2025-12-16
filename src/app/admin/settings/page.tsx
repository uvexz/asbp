import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSettingsUncached, updateSettings } from "@/app/actions/settings";
import { getTranslations } from 'next-intl/server';

function Checkbox({ id, name, defaultChecked, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            type="checkbox"
            id={id}
            name={name}
            defaultChecked={defaultChecked}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            {...props}
        />
    );
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
    // Use uncached version for admin editing to ensure fresh data
    const settings = await getSettingsUncached();
    const t = await getTranslations('admin');
    const { saved } = await searchParams;

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 py-6 sm:px-6">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('blogSettings')}</h1>
                <p className="text-gray-500 text-base font-normal leading-normal mt-2">{t('blogSettingsDesc')}</p>
            </header>
            <main className="flex-1 px-4 pb-6 sm:px-6 overflow-auto">
            {saved && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md">
                    {t('settingsSaved')}
                </div>
            )}
            <form action={updateSettings} className="space-y-8">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">{t('generalSettings')}</h2>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="siteTitle">{t('siteTitle')}</Label>
                        <Input type="text" id="siteTitle" name="siteTitle" placeholder="My Awesome Blog" defaultValue={settings.siteTitle || ''} />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="siteDescription">{t('description')}</Label>
                        <Input type="text" id="siteDescription" name="siteDescription" placeholder="A blog about tech..." defaultValue={settings.siteDescription || ''} />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">{t('userRegistration')}</h2>
                    <div className="flex items-center gap-3">
                        <Checkbox 
                            id="allowRegistration" 
                            name="allowRegistration" 
                            defaultChecked={settings.allowRegistration ?? false}
                        />
                        <Label htmlFor="allowRegistration" className="cursor-pointer">{t('allowRegistration')}</Label>
                    </div>
                    <p className="text-sm text-gray-500">{t('allowRegistrationDesc')}</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">{t('mediaStorage')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="s3Endpoint">{t('endpoint')}</Label>
                            <Input type="text" id="s3Endpoint" name="s3Endpoint" placeholder="e.g. s3.amazonaws.com or MinIO URL" defaultValue={settings.s3Endpoint || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="s3Region">{t('region')}</Label>
                            <Input type="text" id="s3Region" name="s3Region" placeholder="us-east-1" defaultValue={settings.s3Region || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="s3Bucket">{t('bucketName')}</Label>
                            <Input type="text" id="s3Bucket" name="s3Bucket" placeholder="my-blog-media" defaultValue={settings.s3Bucket || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="s3AccessKey">{t('accessKey')}</Label>
                            <Input type="text" id="s3AccessKey" name="s3AccessKey" defaultValue={settings.s3AccessKey || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="s3SecretKey">{t('secretKey')}</Label>
                            <Input type="password" id="s3SecretKey" name="s3SecretKey" defaultValue={settings.s3SecretKey || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="s3CdnUrl">{t('cdnUrl')}</Label>
                            <Input type="text" id="s3CdnUrl" name="s3CdnUrl" placeholder={t('cdnUrlDesc')} defaultValue={settings.s3CdnUrl || ''} />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">{t('emailService')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="resendApiKey">{t('resendApiKey')}</Label>
                            <Input type="password" id="resendApiKey" name="resendApiKey" placeholder="re_..." defaultValue={settings.resendApiKey || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="resendFromEmail">{t('resendFromEmail')}</Label>
                            <Input type="email" id="resendFromEmail" name="resendFromEmail" placeholder={t('resendFromEmailDesc')} defaultValue={settings.resendFromEmail || ''} />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold border-b pb-2">{t('aiSpamDetection')}</h2>
                    <p className="text-sm text-gray-500">{t('aiSpamDetectionDesc')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="aiBaseUrl">{t('aiBaseUrl')}</Label>
                            <Input type="text" id="aiBaseUrl" name="aiBaseUrl" placeholder="https://api.openai.com/v1" defaultValue={settings.aiBaseUrl || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="aiApiKey">{t('aiApiKey')}</Label>
                            <Input type="password" id="aiApiKey" name="aiApiKey" placeholder="sk-..." defaultValue={settings.aiApiKey || ''} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="aiModel">{t('aiModel')}</Label>
                            <Input type="text" id="aiModel" name="aiModel" placeholder="gpt-4o-mini" defaultValue={settings.aiModel || ''} />
                        </div>
                    </div>
                </section>

                <Button type="submit" className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold">{t('saveChanges')}</Button>
            </form>
            </main>
        </div>
    );
}
