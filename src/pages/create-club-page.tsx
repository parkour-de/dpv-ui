import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Info, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/auth-context-core";
import { type Club } from "@/types";

export function CreateClubPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        legal_form: "",
        email: "",
        address: ""
    });
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
            await api.post('/clubs', formData, token);
            setError(null); // Clear any previous errors on success
            navigate("/dashboard");
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-2">
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">{t('create_club.title')}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('create_club.card.title')}</CardTitle>
                    <CardDescription>{t('create_club.card.description')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('create_club.labels.name')}</Label>
                            <Input id="name" placeholder={t('create_club.placeholders.name')} value={formData.name} onChange={handleChange} required />
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
                                            <Link to={`/clubs/${club._key}`} className="text-primary hover:underline flex items-center gap-1 text-xs" target="_blank">
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

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('create_club.labels.email_opt')}</Label>
                            <Input id="email" type="email" placeholder={t('create_club.placeholders.email')} value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">{t('create_club.labels.address_opt')}</Label>
                            <Input id="address" placeholder={t('create_club.placeholders.address')} value={formData.address} onChange={handleChange} />
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
