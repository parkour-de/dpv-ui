import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, ApiError } from "@/lib/api";
import { type User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function LandingPage() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Basic Auth Header
            const token = btoa(`${email}:${password}`);
            const user = await api.get<User>('/users/me', token);

            login(token, user);
            navigate("/dashboard");
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('auth.login.error_generic'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">{t('app.title')}</h1>
                    <p className="text-muted-foreground">{t('app.subtitle')}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('auth.login.title')}</CardTitle>
                        <CardDescription>{t('auth.login.description')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('auth.fields.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">{t('auth.fields.password')}</Label>
                                    <Link to="/reset-password" className="text-xs text-primary hover:underline">
                                        {t('auth.fields.forgot_password')}
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <p>{error}</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? t('auth.login.submit_loading') : t('auth.login.submit')}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                {t('auth.register.question')}{" "}
                                <Link to="/register" className="text-primary hover:underline font-medium">
                                    {t('auth.register.action')}
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                <div className="text-center text-xs text-muted-foreground">
                    <Link to="/imprint" className="hover:underline mr-4">{t('footer.imprint')}</Link>
                    <Link to="/help" className="hover:underline">{t('footer.help')}</Link>
                </div>
            </div>
        </div>
    );
}
