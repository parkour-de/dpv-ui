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
import { PaymentDetails } from "@/components/payment-details";

export function ProfilePage() {
    const { t } = useTranslation();
    const { user, token, apiUpdateUser, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Membership Actions Modal State
    const [actionModal, setActionModal] = useState<'apply' | 'cancel' | null>(null);
    const [actionDate, setActionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [formData, setFormData] = useState<{
        firstname: string;
        lastname: string;
        email: string;
        language: string;
        address: string;
        iban?: string;
        account_holder?: string;
        sepa_mandate_number?: string;
    }>({
        firstname: '',
        lastname: '',
        email: '',
        language: '',
        address: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                language: user.language || 'default',
                address: user.membership?.address || ''
            }));
        }
    }, [user]);

    const handleMembershipAction = async (action: 'apply' | 'cancel') => {
        if (!token) return;
        setActionLoading(true);
        setActionError(null);

        // Convert date string to unix seconds if present
        const unixSeconds = actionDate ? Math.floor(new Date(actionDate).getTime() / 1000) : 0;
        const payload = action === 'apply' ? { begin_date: unixSeconds } : { end_date: unixSeconds };

        try {
            await api.post(`/users/me/${action}`, payload, token);
            // Refresh user to get updated membership status
            const updatedUser = await api.get<User>('/users/me', token);
            if (apiUpdateUser) apiUpdateUser(updatedUser);
            setActionModal(null);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setActionError(err.data.message);
            } else {
                setActionError(t('profile.messages.error_save'));
            }
        } finally {
            setActionLoading(false);
        }
    };

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
            setError(null); // Clear any previous errors on success
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

    // Language options - use "default" as tombstone to clear backend language preference
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

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
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
                            <Label htmlFor="address">Adresse</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Straße, PLZ, Ort"
                                className="mb-4"
                            />
                        </div>

                        <PaymentDetails
                            token={token!}
                            fetchUrl="/users/me/payment-details"
                            isAdmin={user?.roles?.includes('admin') || user?.roles?.includes('owner')}
                            formData={formData}
                            onChange={(field, val) => setFormData(p => ({ ...p, [field]: val }))}
                            isReadOnly={false}
                            alwaysOpen={false}
                        />

                        <div className="space-y-2 mt-4">
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

            <Card>
                <CardHeader>
                    <CardTitle>Mitgliedschaft</CardTitle>
                    <CardDescription>Verwalte deine Mitgliedschaft im DPV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {actionError && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> {actionError}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md bg-muted/20">
                        <div className="space-y-1">
                            <p className="font-medium">DPV Mitgliedschaft</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {(() => {
                                    const status = user.membership?.status || 'inactive';
                                    const { begin_date, end_date } = user.membership || {};
                                    const now = Math.floor(Date.now() / 1000);

                                    // Use standard badge colors for membership
                                    const badgeColors: Record<string, string> = {
                                        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                                        inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                                        requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                                        denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                                        cancelled: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
                                    };

                                    let badgeColor = badgeColors[status] || badgeColors.inactive;
                                    let label: string = status;

                                    if (status === 'active' && begin_date && begin_date > now) {
                                        label = 'Anstehend';
                                        badgeColor = badgeColors.requested;
                                    } else if (status === 'cancelled' && end_date && end_date > now) {
                                        label = 'Gekündigt';
                                        badgeColor = badgeColors.cancelled;
                                    }

                                    return (
                                        <>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${badgeColor}`}>
                                                {label.charAt(0).toUpperCase() + label.slice(1)}
                                            </span>
                                            {begin_date ? (
                                                <span className="text-xs text-muted-foreground mr-2 font-mono">
                                                    seit {new Date(begin_date * 1000).toLocaleDateString()}
                                                </span>
                                            ) : null}
                                            {end_date ? (
                                                <span className="text-xs font-bold text-destructive font-mono">
                                                    Gekündigt zum {new Date(end_date * 1000).toLocaleDateString()}
                                                </span>
                                            ) : null}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-0">
                            {(user.membership?.status === 'active' || user.membership?.status === 'requested') ? (
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => {
                                    if (user.membership?.status === 'requested') {
                                        if (confirm("Möchtest du deinen Antrag wirklich zurückziehen?")) {
                                            handleMembershipAction('cancel');
                                        }
                                    } else {
                                        setActionModal('cancel');
                                    }
                                }} disabled={actionLoading}>
                                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {user.membership?.status === 'active' ? 'Kündigen' : 'Antrag zurückziehen'}
                                </Button>
                            ) : (
                                <Button size="sm" onClick={() => setActionModal('apply')} disabled={actionLoading}>
                                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {(user.membership?.status === 'cancelled' || user.membership?.status === 'denied')
                                        ? 'Erneut beantragen'
                                        : 'Mitgliedschaft beantragen'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Modal equivalent inline */}
            {actionModal && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-lg border">
                        <CardHeader>
                            <CardTitle>
                                {actionModal === 'apply' ? 'Mitgliedschaft beantragen' : 'Mitgliedschaft kündigen'}
                            </CardTitle>
                            <CardDescription>
                                {actionModal === 'apply'
                                    ? 'Bitte wähle aus, ab wann du aktiv werden möchtest.'
                                    : 'Bitte wähle aus, zu wann du kündigen möchtest.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="actionDate">{actionModal === 'apply' ? 'Beginn (Optional)' : 'Ende (Optional)'}</Label>
                                <Input
                                    id="actionDate"
                                    type="date"
                                    value={actionDate}
                                    onChange={(e) => setActionDate(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground pt-1">
                                    {actionModal === 'apply'
                                        ? 'Wenn du das Datum leer lässt, startet die Mitgliedschaft sofort.'
                                        : 'Wenn du das Datum leer lässt, wird die Kündigung sofort wirksam.'}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-2 bg-muted/20 py-4">
                            <Button variant="ghost" onClick={() => setActionModal(null)} disabled={actionLoading}>
                                Abbrechen
                            </Button>
                            <Button variant={actionModal === 'apply' ? 'default' : 'destructive'} onClick={() => handleMembershipAction(actionModal)} disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {actionModal === 'apply' ? 'Beantragen' : 'Kündigen'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
