'use client';

import { useState } from 'react';
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
import { KeyRound, Loader2, Plus, Trash2, Smartphone, Monitor, Key } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    const handleAddPasskey = async () => {
        if (!passkeyName.trim()) return;
        
        setLoading(true);
        try {
            await authClient.passkey.addPasskey({
                name: passkeyName,
            });
            setPasskeyName('');
            router.refresh();
        } catch (error) {
            console.error('Failed to add passkey:', error);
            alert(t('passkeyError'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePasskey = async (id: string) => {
        setDeleteLoading(id);
        try {
            await authClient.passkey.deletePasskey({ id });
            setPasskeys(passkeys.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete passkey:', error);
            alert(t('passkeyError'));
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
                return 'Security Key';
            case 'multidevice':
                return 'Platform Authenticator';
            default:
                return deviceType;
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        {t('addPasskey')}
                    </CardTitle>
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
                        onClick={handleAddPasskey}
                        disabled={loading || !passkeyName.trim()}
                        className="bg-[#4cdf20] text-gray-900 hover:bg-[#4cdf20]/90 font-bold"
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
                        <div className="text-center py-8 text-gray-500">
                            <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">{t('noPasskeys')}</p>
                            <p className="text-sm mt-1">{t('noPasskeysDesc')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {passkeys.map((passkey) => (
                                <div
                                    key={passkey.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            {getDeviceIcon(passkey.deviceType)}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {passkey.name || 'Unnamed Passkey'}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span>{formatDeviceType(passkey.deviceType)}</span>
                                                {passkey.backedUp && (
                                                    <span className="text-green-600">✓ {t('backedUp')}</span>
                                                )}
                                                {passkey.createdAt && (
                                                    <span>
                                                        {new Date(passkey.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
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
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeletePasskey(passkey.id)}
                                                    className="bg-red-500 hover:bg-red-600"
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
