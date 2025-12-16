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
import { getSettingsUncached, updateSettings } from "@/app/actions/settings";
import { getTranslations } from 'next-intl/server';
import { Globe, FileText, Database, Mail, Bot, BarChart3, Key, Server, Folder, Link } from "lucide-react";

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
                                <InputGroupText>{t('siteTitle')}</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="siteTitle"
                                name="siteTitle"
                                placeholder="My Awesome Blog"
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
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Database className="size-5" />
                        {t('mediaStorage')}
                    </h2>
                    <div className="space-y-3">
                        <InputGroup>
                            <InputGroupAddon>
                                <InputGroupText><Server className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="s3Endpoint"
                                name="s3Endpoint"
                                placeholder={t('endpoint')}
                                defaultValue={settings.s3Endpoint || ''}
                            />
                        </InputGroup>
                        <div className="grid grid-cols-2 gap-3">
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText>{t('region')}</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="s3Region"
                                    name="s3Region"
                                    placeholder="us-east-1"
                                    defaultValue={settings.s3Region || ''}
                                />
                            </InputGroup>
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText><Folder className="size-4" /></InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="s3Bucket"
                                    name="s3Bucket"
                                    placeholder={t('bucketName')}
                                    defaultValue={settings.s3Bucket || ''}
                                />
                            </InputGroup>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText>{t('accessKey')}</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="s3AccessKey"
                                    name="s3AccessKey"
                                    defaultValue={settings.s3AccessKey || ''}
                                />
                            </InputGroup>
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText><Key className="size-4" /></InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="s3SecretKey"
                                    name="s3SecretKey"
                                    type="password"
                                    placeholder={t('secretKey')}
                                    defaultValue={settings.s3SecretKey || ''}
                                />
                            </InputGroup>
                        </div>
                        <InputGroup>
                            <InputGroupAddon>
                                <InputGroupText><Link className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="s3CdnUrl"
                                name="s3CdnUrl"
                                placeholder={t('cdnUrlDesc')}
                                defaultValue={settings.s3CdnUrl || ''}
                            />
                        </InputGroup>
                    </div>
                </section>

                {/* Email Service */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="size-5" />
                        {t('emailService')}
                    </h2>
                    <div className="space-y-3">
                        <InputGroup>
                            <InputGroupAddon>
                                <InputGroupText><Key className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="resendApiKey"
                                name="resendApiKey"
                                type="password"
                                placeholder="re_..."
                                defaultValue={settings.resendApiKey || ''}
                            />
                        </InputGroup>
                        <InputGroup>
                            <InputGroupAddon>
                                <InputGroupText><Mail className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="resendFromEmail"
                                name="resendFromEmail"
                                type="email"
                                placeholder={t('resendFromEmailDesc')}
                                defaultValue={settings.resendFromEmail || ''}
                            />
                        </InputGroup>
                    </div>
                </section>

                {/* AI Spam Detection */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Bot className="size-5" />
                        {t('aiSpamDetection')}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t('aiSpamDetectionDesc')}</p>
                    <div className="space-y-3">
                        <InputGroup>
                            <InputGroupAddon>
                                <InputGroupText><Server className="size-4" /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="aiBaseUrl"
                                name="aiBaseUrl"
                                placeholder="https://api.openai.com/v1"
                                defaultValue={settings.aiBaseUrl || ''}
                            />
                        </InputGroup>
                        <div className="grid grid-cols-2 gap-3">
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText><Key className="size-4" /></InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="aiApiKey"
                                    name="aiApiKey"
                                    type="password"
                                    placeholder="sk-..."
                                    defaultValue={settings.aiApiKey || ''}
                                />
                            </InputGroup>
                            <InputGroup>
                                <InputGroupAddon>
                                    <InputGroupText>{t('aiModel')}</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="aiModel"
                                    name="aiModel"
                                    placeholder="gpt-4o-mini"
                                    defaultValue={settings.aiModel || ''}
                                />
                            </InputGroup>
                        </div>
                    </div>
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
            </main>
        </div>
    );
}
