import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check } from "lucide-react";

export function ProfilePage() {
    const { user, token, apiUpdateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstname: user?.firstname || '',
        lastname: user?.lastname || '',
        email: user?.email || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (!token) return;

        try {
            const messages = [];

            // Update Name if changed
            if (formData.firstname !== user?.firstname || formData.lastname !== user?.lastname) {
                const updatedUser = await api.patch('/users/me', {
                    firstname: formData.firstname,
                    lastname: formData.lastname
                }, token);
                apiUpdateUser(updatedUser as any);
                messages.push("Profil aktualisiert.");
            }

            // Request Email Validation if changed
            if (formData.email !== user?.email) {
                await api.post('/users/request-email-validation', {
                    email: formData.email
                }, token);
                messages.push(`Bestätigungs-E-Mail an ${formData.email} gesendet.`);
            }

            if (messages.length > 0) {
                setSuccess(messages.join(" "));
            } else {
                setSuccess("Keine Änderungen vorgenommen.");
            }

        } catch (err: any) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError("Speichern fehlgeschlagen.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Mein Profil</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Persönliche Daten</CardTitle>
                    <CardDescription>Verwalten Sie hier Ihre persönlichen Daten.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">Vorname</Label>
                                <Input id="firstname" value={formData.firstname} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">Nachname</Label>
                                <Input id="lastname" value={formData.lastname} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-Mail</Label>
                            <Input id="email" value={formData.email} onChange={handleChange} />
                            {formData.email !== user?.email && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Änderung erfordert Bestätigung per E-Mail.
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <p>{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-100 dark:bg-green-900/30 p-3 rounded-md">
                                <Check className="h-4 w-4" />
                                <p>{success}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Speichern..." : "Speichern"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
