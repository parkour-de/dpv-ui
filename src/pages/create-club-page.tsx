import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";

export function CreateClubPage() {
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
            setError("Nicht authentifiziert.");
            setLoading(false);
            return;
        }

        try {
            await api.post('/clubs', formData, token);
            navigate("/dashboard");
        } catch (err: any) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError("Erstellen fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.");
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
                <h1 className="text-2xl font-bold tracking-tight">Neuen Verein gründen</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vereinsdaten</CardTitle>
                    <CardDescription>Tragen Sie die Basisdaten Ihres Vereins ein.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name des Vereins</Label>
                            <Input id="name" placeholder="Musterverein" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="legal_form">Rechtsform</Label>
                            <Input
                                id="legal_form"
                                placeholder="z.B. e.V."
                                value={formData.legal_form}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-Mail (optional)</Label>
                            <Input id="email" type="email" placeholder="info@verein.de" value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Adresse (optional)</Label>
                            <Input id="address" placeholder="Strasse 1, 12345 Stadt" value={formData.address} onChange={handleChange} />
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
                            <Button type="button" variant="ghost">Abbrechen</Button>
                        </Link>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Wird erstellt..." : "Verein erstellen"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
