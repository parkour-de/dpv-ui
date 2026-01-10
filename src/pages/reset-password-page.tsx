import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export function ResetPasswordPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const key = searchParams.get("key");
    const expiry = searchParams.get("expiry");

    const [email, setEmail] = useState("");
    const [formData, setFormData] = useState({
        password: "",
        confirm: ""
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const isResetMode = !!(token && key && expiry);

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/users/request-password-reset', { email });
            setSuccess(true);
        } catch (err: unknown) {
            console.error(err);
            // Even if email not found, we often show success for security. 
            // But here we might get 400.
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('auth.reset_password.errors.generic'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirm) {
            setError(t('auth.reset_password.errors.mismatch'));
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await api.post('/users/reset-password', {
                key,
                expiry,
                token,
                password: formData.password,
                confirm: formData.confirm
            });
            setSuccess(true);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('auth.reset_password.errors.reset_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                        </div>
                        <CardTitle>{isResetMode ? t('auth.reset_password.confirm.success.title') : t('auth.reset_password.request.success.title')}</CardTitle>
                        <CardDescription>
                            {isResetMode
                                ? t('auth.reset_password.confirm.success.description')
                                : t('auth.reset_password.request.success.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link to="/">
                            <Button>{t('auth.reset_password.actions.back_to_login')}</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Link to="/" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <CardTitle>{isResetMode ? t('auth.reset_password.confirm.title') : t('auth.reset_password.request.title')}</CardTitle>
                    </div>
                    <CardDescription>
                        {isResetMode
                            ? t('auth.reset_password.confirm.description')
                            : t('auth.reset_password.request.description')}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={isResetMode ? handleResetSubmit : handleRequestSubmit}>
                    <CardContent className="space-y-4">
                        {isResetMode ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('auth.reset_password.confirm.labels.new_password')}</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} required minLength={10} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">{t('auth.reset_password.confirm.labels.confirm_password')}</Label>
                                    <Input id="confirm" type="password" value={formData.confirm} onChange={(e) => setFormData(p => ({ ...p, confirm: e.target.value }))} required />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('auth.fields.email')}</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <p>{error}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading
                                ? t('auth.reset_password.actions.wait')
                                : (isResetMode
                                    ? t('auth.reset_password.confirm.submit')
                                    : t('auth.reset_password.request.submit')
                                )
                            }
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
