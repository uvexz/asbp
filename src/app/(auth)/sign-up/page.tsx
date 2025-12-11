'use client';

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import Link from 'next/link';
import { checkRegistrationStatus, postRegistrationCleanup } from "@/app/actions/auth-helpers";
import { useTranslations } from 'next-intl';

export default function SignUp() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const t = useTranslations('auth');

    const router = useRouter();

    useEffect(() => {
        checkRegistrationStatus().then((status) => {
            setAllowed(status.allowed);
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
