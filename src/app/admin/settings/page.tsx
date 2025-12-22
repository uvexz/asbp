import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { UmamiSettings } from "@/components/admin/umami-settings";
import { S3Settings } from "@/components/admin/s3-settings";
import { EmailSettings } from "@/components/admin/email-settings";
import { AiSettings } from "@/components/admin/ai-settings";
import { ExportSettings } from "@/components/admin/export-settings";
import { ImportSettings } from "@/components/admin/import-settings";
import { getSettingsUncached, updateSettings } from "@/app/actions/settings";
import { getTranslations } from 'next-intl/server';
import { Globe, FileText, BarChart3, Download, Upload } from "lucide-react";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
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
            <form action={updateSettings} className="space-y-8 max-w-2xl">
                {/* General Settings */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Globe className="size-5" />
                        {t('generalSettings')}
                    </h2>
                    <div className="space-y-3">
                        <InputGroup>
                            <InputGroupAddon>
                                <InputGroupText><Globe className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="siteTitle"
                                name="siteTitle"
                                placeholder={t('siteTitle')}
                                defaultValue={settings.siteTitle || ''}
                            />
                        </InputGroup>
                        <InputGroup>
                            <InputGroupAddon>
                                <InputGroupText><FileText className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="siteDescription"
                                name="siteDescription"
                                placeholder={t('description')}
                                defaultValue={settings.siteDescription || ''}
                            />
                        </InputGroup>
                    </div>
                </section>

                {/* User Registration */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">{t('userRegistration')}</h2>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                            <Label htmlFor="allowRegistration" className="cursor-pointer">{t('allowRegistration')}</Label>
                            <p className="text-sm text-muted-foreground">{t('allowRegistrationDesc')}</p>
                        </div>
                        <Switch
                            id="allowRegistration"
                            name="allowRegistration"
                            defaultChecked={settings.allowRegistration ?? false}
                        />
                    </div>
                </section>

                {/* Media Storage (S3) */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">{t('mediaStorage')}</h2>
                    <S3Settings
                        defaultEnabled={!!(settings.s3Endpoint && settings.s3Bucket)}
                        defaultEndpoint={settings.s3Endpoint || ''}
                        defaultRegion={settings.s3Region || ''}
                        defaultBucket={settings.s3Bucket || ''}
                        defaultAccessKey={settings.s3AccessKey || ''}
                        defaultSecretKey={settings.s3SecretKey || ''}
                        defaultCdnUrl={settings.s3CdnUrl || ''}
                        translations={{
                            mediaStorage: t('mediaStorage'),
                            mediaStorageDesc: t('mediaStorageDesc') || '',
                            endpoint: t('endpoint'),
                            region: t('region'),
                            bucketName: t('bucketName'),
                            accessKey: t('accessKey'),
                            secretKey: t('secretKey'),
                            cdnUrl: t('cdnUrl'),
                            cdnUrlDesc: t('cdnUrlDesc'),
                        }}
                    />
                </section>

                {/* Email Service */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">{t('emailService')}</h2>
                    <EmailSettings
                        defaultEnabled={!!settings.resendApiKey}
                        defaultApiKey={settings.resendApiKey || ''}
                        defaultFromEmail={settings.resendFromEmail || ''}
                        translations={{
                            emailService: t('emailService'),
                            emailServiceDesc: t('emailServiceDesc') || '',
                            resendApiKey: t('resendApiKey'),
                            resendFromEmail: t('resendFromEmail'),
                            resendFromEmailDesc: t('resendFromEmailDesc'),
                        }}
                    />
                </section>

                {/* AI Spam Detection */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">{t('aiSpamDetection')}</h2>
                    <AiSettings
                        defaultEnabled={!!(settings.aiBaseUrl && settings.aiApiKey)}
                        defaultBaseUrl={settings.aiBaseUrl || ''}
                        defaultApiKey={settings.aiApiKey || ''}
                        defaultModel={settings.aiModel || ''}
                        translations={{
                            aiSpamDetection: t('aiSpamDetection'),
                            aiSpamDetectionDesc: t('aiSpamDetectionDesc'),
                            aiBaseUrl: t('aiBaseUrl'),
                            aiApiKey: t('aiApiKey'),
                            aiModel: t('aiModel'),
                        }}
                    />
                </section>

                {/* Umami Analytics */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="size-5" />
                        {t('umamiAnalytics')}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t('umamiAnalyticsDesc')}</p>
                    <UmamiSettings
                        defaultEnabled={settings.umamiEnabled ?? false}
                        defaultCloud={settings.umamiCloud ?? false}
                        defaultHostUrl={settings.umamiHostUrl || ''}
                        defaultWebsiteId={settings.umamiWebsiteId || ''}
                        defaultApiKey={settings.umamiApiKey || ''}
                        defaultApiUserId={settings.umamiApiUserId || ''}
                        defaultApiSecret={settings.umamiApiSecret || ''}
                        translations={{
                            umamiEnabled: t('umamiEnabled'),
                            umamiCloud: t('umamiCloud'),
                            umamiCloudDesc: t('umamiCloudDesc'),
                            umamiHostUrl: t('umamiHostUrl'),
                            umamiHostUrlPlaceholder: t('umamiHostUrlPlaceholder'),
                            umamiWebsiteId: t('umamiWebsiteId'),
                            umamiApiKey: t('umamiApiKey'),
                            umamiApiKeyDesc: t('umamiApiKeyDesc'),
                            umamiApiUserId: t('umamiApiUserId'),
                            umamiApiSecret: t('umamiApiSecret'),
                            umamiApiSecretDesc: t('umamiApiSecretDesc'),
                        }}
                    />
                </section>

                <Button type="submit" className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold">
                    {t('saveChanges')}
                </Button>
            </form>

            {/* Data Export */}
            <section className="space-y-4 max-w-2xl mt-8 pt-8 border-t">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Download className="size-5" />
                    {t('dataExport')}
                </h2>
                <ExportSettings
                    translations={{
                        dataExport: t('dataExport'),
                        dataExportDesc: t('dataExportDesc'),
                        exportPosts: t('exportPosts'),
                        exportComments: t('exportComments'),
                        exportTags: t('exportTags'),
                        exportNavigation: t('exportNavigation'),
                        exportMedia: t('exportMedia'),
                        exportMediaDesc: t('exportMediaDesc'),
                        exportUsers: t('exportUsers'),
                        exportUsersDesc: t('exportUsersDesc'),
                        exportSettings: t('exportSettings'),
                        exportSettingsDesc: t('exportSettingsDesc'),
                        exportButton: t('exportButton'),
                        exporting: t('exporting'),
                    }}
                />
            </section>

            {/* Data Import */}
            <section className="space-y-4 max-w-2xl mt-8 pt-8 border-t">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="size-5" />
                    {t('dataImport')}
                </h2>
                <ImportSettings
                    translations={{
                        dataImport: t('dataImport'),
                        dataImportDesc: t('dataImportDesc'),
                        selectFile: t('selectFile'),
                        importButton: t('importButton'),
                        importing: t('importing'),
                        importSuccess: t('importSuccess'),
                        importFailed: t('importFailed'),
                        noFileSelected: t('noFileSelected'),
                        importResults: t('importResults'),
                        postsImported: t('postsImported'),
                        commentsImported: t('commentsImported'),
                        tagsImported: t('tagsImported'),
                        navItemsImported: t('navItemsImported'),
                        mediaImported: t('mediaImported'),
                        settingsImported: t('settingsImported'),
                    }}
                />
            </section>
            </main>
        </div>
    );
}
