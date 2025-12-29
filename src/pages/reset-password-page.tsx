import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export function ResetPasswordPage() {
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
                setError("Ein Fehler ist aufgetreten.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirm) {
            setError("Passwörter stimmen nicht überein.");
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
                setError("Passwort konnte nicht zurückgesetzt werden.");
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
                        <CardTitle>{isResetMode ? "Passwort geändert" : "E-Mail gesendet"}</CardTitle>
                        <CardDescription>
                            {isResetMode
                                ? "Ihr Passwort wurde erfolgreich geändert. Sie können sich nun anmelden."
                                : "Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen gesendet."}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link to="/">
                            <Button>Zur Anmeldung</Button>
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
                        <CardTitle>{isResetMode ? "Passwort neu setzen" : "Passwort vergessen"}</CardTitle>
                    </div>
                    <CardDescription>
                        {isResetMode
                            ? "Bitte geben Sie ein neues Passwort ein."
                            : "Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen des Passworts zu erhalten."}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={isResetMode ? handleResetSubmit : handleRequestSubmit}>
                    <CardContent className="space-y-4">
                        {isResetMode ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Neues Passwort</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} required minLength={10} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">Passwort bestätigen</Label>
                                    <Input id="confirm" type="password" value={formData.confirm} onChange={(e) => setFormData(p => ({ ...p, confirm: e.target.value }))} required />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail</Label>
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
                            {loading ? "Bitte warten..." : (isResetMode ? "Passwort speichern" : "Link anfordern")}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
