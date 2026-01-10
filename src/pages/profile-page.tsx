import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, ApiError } from "@/lib/api";
import { type User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, Loader2 } from "lucide-react";

export function ProfilePage() {
    const { t } = useTranslation();
    const { user, token, apiUpdateUser, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        language: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                language: user.language || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            const updated = await api.patch<User>('/users/me', formData, token);
            // Update context - login function usually updates user in context
            // If check useAuth implementation (I don't have it open, but usage suggests login/apiUpdateUser)
            // The file initially used apiUpdateUser.
            if (apiUpdateUser) {
                apiUpdateUser(updated);
            } else if (login) {
                login(token, updated);
            }

            const messages = [t('profile.messages.success')];

            // Request Email Validation if changed
            if (formData.email !== user?.email) {
                await api.post('/users/request-email-validation', {
                    email: formData.email
                }, token);
                messages.push(t('profile.messages.email_sent', { email: formData.email }));
            }

            setMessage(messages.join(" "));
        } catch (err: unknown) {
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('profile.messages.error_save'));
            }
        } finally {
            setLoading(false);
        }
    };

    // Language options
    const languages = [
        { code: "", label: t('profile.language_options.browser_default') },
        { code: "de", label: "Deutsch 🇩🇪" },
        { code: "en", label: "English 🇬🇧" },
        { code: "es", label: "Español 🇪🇸" },
        { code: "fr", label: "Français 🇫🇷" },
        { code: "pl", label: "Polski 🇵🇱" },
        { code: "ro", label: "Română 🇷🇴" },
        { code: "sq", label: "Shqip 🇦🇱" },
        { code: "tr", label: "Türkçe 🇹🇷" },
        { code: "ru", label: "Русский 🇷🇺" },
        { code: "ua", label: "Українська 🇺🇦" },
        { code: "ar", label: "العربية 🇸🇦" },
    ];

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.personal_data.title')}</CardTitle>
                        <CardDescription>{t('profile.personal_data.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {message && (
                            <div className="bg-green-100 text-green-700 p-3 rounded-md flex items-center gap-2">
                                <Check className="h-4 w-4" /> {message}
                            </div>
                        )}
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> {error}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">{t('profile.labels.firstname')}</Label>
                                <Input
                                    id="firstname"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">{t('profile.labels.lastname')}</Label>
                                <Input
                                    id="lastname"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('profile.labels.email')}</Label>
                            <Input
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {formData.email !== user?.email && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {t('profile.messages.email_validation_required')}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="language">{t('profile.labels.language')}</Label>
                            <select
                                id="language"
                                name="language"
                                value={formData.language}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {languages.map(l => (
                                    <option key={l.code} value={l.code}>{l.label}</option>
                                ))}
                            </select>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('profile.actions.save')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
