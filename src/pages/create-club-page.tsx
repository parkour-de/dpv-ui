import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/auth-context-core";
import { type Club, GERMAN_STATES } from "@/types";
import { InfoBox } from "@/components/info-box";

export function CreateClubPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        legal_form: "e.V.",
        state: "",
        email: "",
        address: ""
    });
    const userName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim();
    // Not accepted when creating a club, so it is saved right after creation (see handleSubmit).
    // Left empty, the person creating the club becomes the contact person.
    const [contactPerson, setContactPerson] = useState("");
    // The creator's own board entry (function, §26 BGB); also saved right after creation
    const [myFunction, setMyFunction] = useState("");
    const [isAuthorizedRepresentative, setIsAuthorizedRepresentative] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Search logic for duplicate prevention
    const [searchResults, setSearchResults] = useState<Club[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.name.length >= 3 && token) {
                setSearching(true);
                try {
                    const results = await api.get<Club[]>(`/clubs/search?q=${encodeURIComponent(formData.name)}`, token);
                    setSearchResults(results || []);
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.name, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!token) {
            setError(t('create_club.errors.not_authenticated'));
            setLoading(false);
            return;
        }

        try {
            const created = await api.post<Club>('/clubs', formData, token);
            setError(null); // Clear any previous errors on success
            const contact = contactPerson.trim() || userName;
            if (created?._key && contact) {
                // The club exists at this point; if this fails, the contact person can still be set on its page
                await api.patch(`/club/${created._key}`, { contact_person: contact }, token)
                    .catch(err => console.error("Failed to save contact person", err));
            }
            if (created?._key && user?.email && (isAuthorizedRepresentative || myFunction.trim())) {
                // Updates the creator's existing board entry (same request as on the club page)
                await api.post(`/club/${created._key}/owners`, { email: user.email, authorizedRepresentative: isAuthorizedRepresentative, function: myFunction.trim() }, token)
                    .catch(err => console.error("Failed to save board entry", err));
            }
            // Continue on the new club's page so details, admins and membership can be set up there
            navigate(created?._key ? `/club/${created._key}` : "/dashboard");
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <h1 className="text-2xl font-bold tracking-tight">{t('create_club.title')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle>{t('create_club.card.title')}</CardTitle>
                    <CardDescription>{t('create_club.card.description')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <InfoBox
                            title={t('create_club.info.title')}
                            items={[t('create_club.info.no_membership'), t('create_club.info.next_steps'), t('create_club.info.delete')]}
                        />

                        {/* Name and legal form side by side, so together they read as the club's full name */}
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('create_club.labels.name')}</Label>
                                <Input id="name" placeholder={t('create_club.placeholders.name')} value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="legal_form">{t('create_club.labels.legal_form')}</Label>
                                <Input
                                    id="legal_form"
                                    placeholder={t('create_club.placeholders.legal_form')}
                                    value={formData.legal_form}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Search Results / Duplicate Warning */}
                        {searchResults.length > 0 && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-md space-y-2 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium text-sm">
                                    <Info className="h-4 w-4" />
                                    <span>{t('create_club.search.found_matches')}</span>
                                </div>
                                <ul className="space-y-1">
                                    {searchResults.map(club => (
                                        <li key={club._key} className="text-sm flex items-center justify-between">
                                            <span className="font-semibold text-amber-900 dark:text-amber-100">{club.name} ({club.legal_form})</span>
                                            <Link to={`/club/${club._key}`} className="text-primary hover:underline flex items-center gap-1 text-xs" target="_blank">
                                                {t('club.details.actions.back')} <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-amber-700 dark:text-amber-300 italic pt-1">
                                    {t('create_club.search.description')}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">{t('club.details.labels.state')}</Label>
                                <select
                                    id="state"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">–</option>
                                    {GERMAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">{t('create_club.labels.address_opt')}</Label>
                                <Input id="address" placeholder={t('create_club.placeholders.address')} value={formData.address} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-end">
                            <div className="space-y-2">
                                <Label htmlFor="my_function">{t('create_club.labels.my_function')}</Label>
                                <Input id="my_function" placeholder={t('create_club.placeholders.my_function')} value={myFunction} onChange={(e) => setMyFunction(e.target.value)} />
                            </div>
                            <Label className="flex items-center gap-2 cursor-pointer font-normal md:h-10">
                                <input
                                    type="checkbox"
                                    checked={isAuthorizedRepresentative}
                                    onChange={(e) => setIsAuthorizedRepresentative(e.target.checked)}
                                />
                                <span>{t('create_club.labels.authorized_representative')}</span>
                            </Label>
                        </div>

                        <InfoBox items={[t('create_club.info.contact', { name: userName })]} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('create_club.labels.club_email_opt')}</Label>
                                <Input id="email" type="email" placeholder={t('create_club.placeholders.email')} value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_person">{t('create_club.labels.contact_person_opt')}</Label>
                                <Input id="contact_person" placeholder={userName} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <p>{error}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Link to="/dashboard">
                            <Button type="button" variant="ghost">{t('create_club.actions.cancel')}</Button>
                        </Link>
                        <Button type="submit" disabled={loading || searching}>
                            {loading ? t('create_club.actions.creating') : t('create_club.actions.create')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
