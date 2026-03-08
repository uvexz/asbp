'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { authClient } from '@/lib/auth-client';
import { KeyRound, Loader2, Plus, Trash2, Smartphone, Monitor, Key, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';

interface Passkey {
    id: string;
    name: string | null;
    credentialID: string;
    deviceType: string;
    backedUp: boolean;
    createdAt: Date | null;
}

interface PasskeyManagerProps {
    initialPasskeys: Passkey[];
}

export function PasskeyManager({ initialPasskeys }: PasskeyManagerProps) {
    const [passkeys, setPasskeys] = useState<Passkey[]>(initialPasskeys);
    const [passkeyName, setPasskeyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const t = useTranslations('auth');
    const tCommon = useTranslations('common');
    const router = useRouter();

    useEffect(() => {
        setPasskeys(initialPasskeys);
    }, [initialPasskeys]);

    const handleAddPasskey = async () => {
        if (!passkeyName.trim()) return;

        setLoading(true);
        try {
            await authClient.passkey.addPasskey({
                name: passkeyName,
            });
            setPasskeyName('');
            toast.success(t('passkeyAdded'));
            router.refresh();
        } catch (error) {
            console.error('Failed to add passkey:', error);
            toast.error(t('passkeyError'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePasskey = async (id: string) => {
        setDeleteLoading(id);
        try {
            await authClient.passkey.deletePasskey({ id });
            setPasskeys((current) => current.filter((passkey) => passkey.id !== id));
            toast.success(t('passkeyDeleted'));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete passkey:', error);
            toast.error(t('passkeyError'));
        } finally {
            setDeleteLoading(null);
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType.toLowerCase()) {
            case 'singledevice':
                return <Key className="h-5 w-5" />;
            case 'multidevice':
                return <Smartphone className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    const formatDeviceType = (deviceType: string) => {
        switch (deviceType.toLowerCase()) {
            case 'singledevice':
                return t('securityKey');
            case 'multidevice':
                return t('platformAuthenticator');
            default:
                return deviceType;
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        {t('addPasskey')}
                    </CardTitle>
                    <CardDescription>{t('passkeysDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="passkeyName">{t('passkeyName')}</Label>
                        <Input
                            id="passkeyName"
                            value={passkeyName}
                            onChange={(e) => setPasskeyName(e.target.value)}
                            placeholder={t('passkeyNamePlaceholder')}
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={handleAddPasskey}
                        disabled={loading || !passkeyName.trim()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('registering')}
                            </>
                        ) : (
                            <>
                                <KeyRound className="mr-2 h-4 w-4" />
                                {t('registerPasskey')}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('passkeys')}</CardTitle>
                    <CardDescription>{t('passkeysDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {passkeys.length === 0 ? (
                        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <KeyRound className="h-7 w-7" />
                            </div>
                            <p className="font-medium text-foreground">{t('noPasskeys')}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{t('noPasskeysDesc')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {passkeys.map((passkey) => (
                                <div
                                    key={passkey.id}
                                    className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                            {getDeviceIcon(passkey.deviceType)}
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <p className="font-medium text-foreground">
                                                {passkey.name || t('unnamedPasskey')}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                <span>{formatDeviceType(passkey.deviceType)}</span>
                                                {passkey.backedUp && (
                                                    <Badge variant="secondary" className="gap-1 shadow-none">
                                                        <Check className="h-3 w-3" />
                                                        {t('backedUp')}
                                                    </Badge>
                                                )}
                                                {passkey.createdAt && (
                                                    <span>{formatDate(passkey.createdAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-auto"
                                                aria-label={t('deletePasskey')}
                                                title={t('deletePasskey')}
                                            >
                                                {deleteLoading === passkey.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('deletePasskey')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('deletePasskeyConfirm')}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeletePasskey(passkey.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {t('deletePasskey')}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
