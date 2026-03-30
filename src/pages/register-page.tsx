import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

export function RegisterPage() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstname: "",
        lastname: "",
        dateOfBirth: "",
        consentPrivacy: false
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/users', {
                email: formData.email,
                password: formData.password,
                firstname: formData.firstname,
                lastname: formData.lastname,
                dateOfBirth: formData.dateOfBirth,
                consent_privacy: formData.consentPrivacy
            });
            setError(null); // Clear any previous errors on success
            setSuccess(true);
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, t));
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
                        <CardTitle>{t('auth.register.success.title')}</CardTitle>
                        <CardDescription>
                            {t('auth.register.success.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link to="/login">
                            <Button>{t('auth.register.success.action')}</Button>
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
                    <CardTitle>{t('auth.register.title')}</CardTitle>
                    <CardDescription>{t('auth.register.description')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">{t('auth.fields.firstname')}</Label>
                                <Input id="firstname" value={formData.firstname} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">{t('auth.fields.lastname')}</Label>
                                <Input id="lastname" value={formData.lastname} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Geburtsdatum</Label>
                            <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('auth.fields.email')}</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('auth.fields.password')}</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} required minLength={10} />
                            <p className="text-[0.8rem] text-muted-foreground">
                                {t('auth.register.password_hint')}
                            </p>
                        </div>
                        <div className="flex items-start space-x-2 mt-4 pt-2">
                            <input
                                type="checkbox"
                                id="consentPrivacy"
                                checked={formData.consentPrivacy}
                                onChange={handleChange}
                                required
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="consentPrivacy" className="text-sm font-normal leading-tight text-muted-foreground">
                                <Trans
                                    i18nKey="club.details.membership.consent_privacy"
                                    defaults="Ich stimme der <1>Datenschutzerklärung</1> zu."
                                    components={{
                                        1: <a href="https://parkour-deutschland.de/datenschutzerklaerung/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600" />
                                    }}
                                />
                            </Label>
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
                            {loading ? t('auth.register.submit_loading') : t('auth.register.submit')}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.register.login_question')}{" "}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                {t('auth.register.login_action')}
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
