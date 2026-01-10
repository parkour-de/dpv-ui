import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";

export function CreateClubPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        legal_form: "",
        email: "",
        address: ""
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const token = sessionStorage.getItem('dpv_auth_token');
        if (!token) {
            setError(t('create_club.errors.not_authenticated'));
            setLoading(false);
            return;
        }

        try {
            await api.post('/clubs', formData, token);
            navigate("/dashboard");
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('create_club.errors.create_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
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
                        <Button type="submit" disabled={loading}>
                            {loading ? t('create_club.actions.creating') : t('create_club.actions.create')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
