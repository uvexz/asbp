'use client';

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { checkRegistrationStatus, postRegistrationCleanup } from "@/app/actions/auth-helpers";
import { useTranslations } from 'next-intl';

interface ImportUser {
    id: string;
    name: string;
    email: string;
    role?: string | null;
}

interface ImportPreview {
    users: ImportUser[];
    hasSettings: boolean;
    hasPosts: boolean;
    hasComments: boolean;
}

export default function SignUp() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [isFirstUser, setIsFirstUser] = useState(false);
    
    // Import state
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState<unknown>(null);
    const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
    const [selectedUser, setSelectedUser] = useState<ImportUser | null>(null);
    const [importPassword, setImportPassword] = useState("");
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const t = useTranslations('auth');
    const router = useRouter();

    useEffect(() => {
        checkRegistrationStatus().then((status) => {
            setAllowed(status.allowed);
            setIsFirstUser(status.isFirstUser);
            setChecking(false);
        });
    }, []);

    const handleSignUp = async () => {
        setLoading(true);
        await authClient.signUp.email({
            email,
            password,
            name,
            fetchOptions: {
                onSuccess: async () => {
                    await postRegistrationCleanup(email);
                    router.push("/admin");
                },
                onError: (ctx) => {
                    alert(ctx.error.message);
                    setLoading(false);
                },
            },
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportError(null);
        setImportLoading(true);

        try {
            const content = await file.text();
            const data = JSON.parse(content);
            
            const response = await fetch('/api/init-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'parse', data }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to parse import file');
            }

            const preview = await response.json();
            setImportData(data);
            setImportPreview(preview);
            
            // Auto-select first admin user or first user
            const adminUser = preview.users.find((u: ImportUser) => u.role === 'admin');
            setSelectedUser(adminUser || preview.users[0]);
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Failed to parse file');
        } finally {
            setImportLoading(false);
        }
    };

    const handleImportInitialize = async () => {
        if (!selectedUser || !importPassword || !importData) return;

        setImportLoading(true);
        setImportError(null);

        try {
            const response = await fetch('/api/init-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'initialize',
                    data: importData,
                    selectedUserId: selectedUser.id,
                    password: importPassword,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Import failed');
            }

            // Login with the new credentials
            await authClient.signIn.email({
                email: selectedUser.email,
                password: importPassword,
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/admin");
                    },
                    onError: () => {
                        router.push("/sign-in");
                    },
                },
            });
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Import failed');
            setImportLoading(false);
        }
    };

    const resetImport = () => {
        setShowImport(false);
        setImportData(null);
        setImportPreview(null);
        setSelectedUser(null);
        setImportPassword("");
        setImportError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (checking) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!allowed) {
        return (
            <div className="flex h-screen w-full items-center justify-center px-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl text-red-500">{t('registrationClosed')}</CardTitle>
                        <CardDescription>
                            {t('registrationClosedDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/sign-in" className="w-full"><Button variant="outline" className="w-full">{t('backToLogin')}</Button></Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Import initialization flow for first user
    if (isFirstUser && showImport) {
        return (
            <div className="flex h-screen w-full items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-fit -ml-2 mb-2"
                            onClick={resetImport}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            {t('back')}
                        </Button>
                        <CardTitle className="text-2xl">{t('importInitTitle')}</CardTitle>
                        <CardDescription>
                            {t('importInitDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {!importPreview ? (
                            <div className="grid gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    className="block w-full text-sm text-muted-foreground
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-primary file:text-primary-foreground
                                        hover:file:bg-primary/90
                                        file:cursor-pointer cursor-pointer"
                                />
                                {importLoading && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t('parsing')}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>{t('importPreview')}:</p>
                                    <ul className="list-disc list-inside">
                                        {importPreview.hasPosts && <li>{t('postsIncluded')}</li>}
                                        {importPreview.hasComments && <li>{t('commentsIncluded')}</li>}
                                        {importPreview.hasSettings && <li>{t('settingsIncluded')}</li>}
                                    </ul>
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('selectUser')}</Label>
                                    <div className="space-y-2">
                                        {importPreview.users.map((user) => (
                                            <div
                                                key={user.id}
                                                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                                    selectedUser?.id === user.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:border-muted-foreground/50'
                                                }`}
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                                {user.role === 'admin' && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="importPassword">{t('setNewPassword')}</Label>
                                    <Input
                                        id="importPassword"
                                        type="password"
                                        required
                                        value={importPassword}
                                        onChange={(e) => setImportPassword(e.target.value)}
                                        placeholder={t('passwordPlaceholder')}
                                    />
                                </div>
                            </div>
                        )}

                        {importError && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                {importError}
                            </div>
                        )}
                    </CardContent>
                    {importPreview && (
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                onClick={handleImportInitialize}
                                disabled={!selectedUser || !importPassword || importLoading}
                            >
                                {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t('initializeWithImport')}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{t('signUpTitle')}</CardTitle>
                    <CardDescription>
                        {t('signUpDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('name')}</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" onClick={handleSignUp} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('signUp')}
                    </Button>
                    
                    {isFirstUser && (
                        <>
                            <div className="relative w-full my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">{t('or')}</span>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setShowImport(true)}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {t('importFromBackup')}
                            </Button>
                        </>
                    )}
                    
                    <div className="text-center text-sm">
                        {t('hasAccount')}{" "}
                        <Link href="/sign-in" className="underline">
                            {t('signIn')}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
