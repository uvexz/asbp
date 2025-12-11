'use client';

import { useState } from "react";
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
import { Loader2, KeyRound } from "lucide-react";
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('auth');

    const handleSignIn = async () => {
        setLoading(true);
        await authClient.signIn.email({
            email,
            password,
            fetchOptions: {
                onSuccess: () => {
                    router.push("/admin");
                },
                onError: (ctx) => {
                    alert(ctx.error.message);
                    setLoading(false);
                },
            },
        });
    };

    const handlePasskeySignIn = async () => {
        setPasskeyLoading(true);
        try {
            await authClient.signIn.passkey({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/admin");
                    },
                    onError: (ctx) => {
                        alert(ctx.error.message);
                        setPasskeyLoading(false);
                    },
                },
            });
        } catch {
            setPasskeyLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{t('loginTitle')}</CardTitle>
                    <CardDescription>
                        {t('loginDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
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
                <CardFooter className="flex flex-col gap-3">
                    <Button className="w-full" onClick={handleSignIn} disabled={loading || passkeyLoading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('signIn')}
                    </Button>
                    <div className="relative w-full">
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
                        onClick={handlePasskeySignIn} 
                        disabled={loading || passkeyLoading}
                    >
                        {passkeyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                        {t('signInWithPasskey')}
                    </Button>
                    <div className="text-center text-sm">
                        {t('noAccount')}{" "}
                        <Link href="/sign-up" className="underline">
                            {t('signUp')}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
