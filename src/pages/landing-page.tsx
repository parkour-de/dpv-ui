import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context-core";
import { api } from "@/lib/api";
import { type User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Basic Auth Header
            const token = btoa(`${email}:${password}`);
            const user = await api.get<User>('/users/me', token);

            login(token, user);
            navigate("/dashboard");
        } catch (err: unknown) {
            console.error(err);
            setError("Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">DPV</h1>
                    <p className="text-muted-foreground">Mitgliederverwaltung</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Anmelden</CardTitle>
                        <CardDescription>Geben Sie Ihre Zugangsdaten ein, um fortzufahren.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Passwort</Label>
                                    <Link to="/reset-password" className="text-xs text-primary hover:underline">
                                        Passwort vergessen?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Anmelden..." : "Anmelden"}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Noch kein Konto?{" "}
                                <Link to="/register" className="text-primary hover:underline font-medium">
                                    Registrieren
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                <div className="text-center text-xs text-muted-foreground">
                    <Link to="/imprint" className="hover:underline mr-4">Impressum</Link>
                    <Link to="/help" className="hover:underline">Hilfe</Link>
                </div>
            </div>
        </div>
    );
}
