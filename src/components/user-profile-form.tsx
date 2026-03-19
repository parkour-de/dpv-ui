import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type User, type Club } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { PaymentDetails } from "@/components/payment-details";
import { api, getErrorMessage } from "@/lib/api";

interface UserProfileFormProps {
    readonly user: User;
    readonly token: string;
    readonly isAdminView?: boolean;
    readonly onSaveSuccess?: (updatedUser: User, message: string) => void;
    readonly endpointOverride?: string; // e.g. "/user/123" for admin, defaults to "/users/me"
}

export function UserProfileForm({ user, token, isAdminView = false, onSaveSuccess, endpointOverride }: UserProfileFormProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [clubMatch, setClubMatch] = useState<{ name: string; status: string } | null>(null);

    const endpoint = endpointOverride || `/user/${user._key}`;

    const [formData, setFormData] = useState<{
        firstname: string;
        lastname: string;
        email: string;
        language: string;
        your_club: string;
        address: string;
        dateOfBirth: string;
        iban?: string;
        account_holder?: string;
        sepa_mandate_number?: string;
    }>({
        firstname: '',
        lastname: '',
        email: '',
        language: '',
        your_club: '',
        address: '',
        dateOfBirth: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                language: user.language || 'default',
                your_club: user.your_club || '',
                address: user.membership?.address || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
            }));
        }
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.your_club && formData.your_club.length >= 3 && token) {
                try {
                    const matches = await api.get<Club[]>(`/clubs/search?q=${encodeURIComponent(formData.your_club)}`, token);
                    const exactMatch = matches.find(c => c.name.toLowerCase() === formData.your_club.toLowerCase());
                    if (exactMatch?.membership?.status === 'active') {
                        setClubMatch({ name: exactMatch.name, status: exactMatch.membership.status });
                    } else {
                        setClubMatch(null);
                    }
                } catch (e) {
                    console.error("Club search failed", e);
                    setClubMatch(null);
                }
            } else {
                setClubMatch(null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.your_club, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);
        if (user.membership?.status === 'active' && !formData.your_club) {
            setError(t('profile.messages.your_club_required', { defaultValue: 'Bitte gib deinen Verein an.' }));
            setLoading(false);
            return;
        }
        try {
            // Include dateOfBirth explicitly since backend may expect it
            const payload = {
                ...formData,
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : formData.dateOfBirth
            };

            const updated = await api.patch<User>(endpoint, payload, token);

            const messages = [t('profile.messages.success')];

            // Request Email Validation if changed and editing self
            if (!isAdminView && formData.email !== user?.email) {
                await api.post('/users/request-email-validation', {
                    email: formData.email
                }, token);
                messages.push(t('profile.messages.email_sent', { email: formData.email }));
            }

            const finalMessage = messages.join(" ");
            setMessage(finalMessage);
            setError(null);

            if (onSaveSuccess) {
                onSaveSuccess(updated, finalMessage);
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    };

    const languages = [
        { code: "default", label: t('profile.language_options.browser_default') },
        { code: "de", label: "🇩🇪 Deutsch" },
        { code: "en", label: "🇬🇧 English" },
        { code: "es", label: "🇪🇸 Español" },
        { code: "fr", label: "🇫🇷 Français" },
        { code: "pl", label: "🇵🇱 Polski" },
        { code: "ro", label: "🇷🇴 Română" },
        { code: "sq", label: "🇦🇱 Shqip" },
        { code: "tr", label: "🇹🇷 Türkçe" },
        { code: "ru", label: "🇷🇺 Русский" },
        { code: "uk", label: "🇺🇦 Українська" },
        { code: "ar", label: "🇸🇦 العربية" },
    ];

    return (
        <form onSubmit={handleSave}>
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.personal_data.title')}</CardTitle>
                    <CardDescription>{isAdminView ? "Benutzerdaten" : t('profile.personal_data.description')}</CardDescription>
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

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Straße, PLZ, Ort"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Geburtsdatum</Label>
                            <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label htmlFor="your_club">{t('profile.labels.yourClub', { defaultValue: 'Dein Verein' })}</Label>
                            <Input
                                id="your_club"
                                name="your_club"
                                value={formData.your_club}
                                onChange={handleChange}
                                placeholder="Optional"
                            />
                            {clubMatch && user.membership?.status === 'active' && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1">
                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    {t('profile.messages.your_club_is_member', { name: clubMatch.name })}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('profile.labels.email')}</Label>
                            <Input
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {!isAdminView && formData.email !== user?.email && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {t('profile.messages.email_validation_required')}
                                </p>
                            )}
                        </div>
                    </div>

                    <PaymentDetails
                        token={token}
                        fetchUrl={`/user/${user._key}/payment-details`}
                        isAdmin={isAdminView}
                        formData={formData}
                        onChange={(field, val) => setFormData(p => ({ ...p, [field]: val }))}
                        isReadOnly={false}
                        alwaysOpen={false}
                    />

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
    );
}
