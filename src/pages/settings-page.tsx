import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/auth-context-core";
import { useConfig } from "@/context/config-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Save, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";

export function SettingsPage() {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const { config, refreshConfig } = useConfig();
    const [links, setLinks] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (config?.links) {
            setLinks({
                privacy: config.links.privacy || "https://parkour-deutschland.de/datenschutzerklaerung/",
                statutes: config.links.statutes || "https://parkour-deutschland.de/wp-content/uploads/2026/03/Satzung_DPV_Stand_2025.pdf",
                finances: config.links.finances || "https://parkour-deutschland.de/wp-content/uploads/2025/11/Beitragsordnung_DPV.pdf",
                ...config.links
            });
        } else {
            // Default fallbacks if empty
            setLinks({
                privacy: "https://parkour-deutschland.de/datenschutzerklaerung/",
                statutes: "https://parkour-deutschland.de/wp-content/uploads/2026/03/Satzung_DPV_Stand_2025.pdf",
                finances: "https://parkour-deutschland.de/wp-content/uploads/2025/11/Beitragsordnung_DPV.pdf"
            });
        }
    }, [config]);

    // Ensure only global admins can access this page
    if (!user || !user.roles?.includes("global_admin")) {
        return <Navigate to="/dashboard" />;
    }

    const handleChange = (key: string, value: string) => {
        setLinks(prev => ({ ...prev, [key]: value }));
        setSuccess(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            await api.patch('/config/links', { links }, token || "");
            await refreshConfig();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Systemeinstellungen</h1>
            </div>

            <Card>
                <form onSubmit={handleSave}>
                    <CardHeader>
                        <CardTitle>Dokumenten-Links</CardTitle>
                        <CardDescription>
                            Konfigurieren Sie hier die URLs zu wichtigen Dokumenten, die bei der Registrierung und Mitgliedschaft angezeigt werden.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="privacy">Datenschutzerklärung URL</Label>
                            <Input 
                                id="privacy" 
                                value={links.privacy || ""} 
                                onChange={(e) => handleChange("privacy", e.target.value)} 
                                placeholder="https://..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="statutes">Satzung URL</Label>
                            <Input 
                                id="statutes" 
                                value={links.statutes || ""} 
                                onChange={(e) => handleChange("statutes", e.target.value)} 
                                placeholder="https://..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="finances">Beitragsordnung URL</Label>
                            <Input 
                                id="finances" 
                                value={links.finances || ""} 
                                onChange={(e) => handleChange("finances", e.target.value)} 
                                placeholder="https://..."
                                required
                            />
                        </div>
                        
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <p>{error}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center border-t py-4">
                        <div className="text-sm">
                            {success && <span className="text-green-600 font-medium">Beiträge erfolgreich gespeichert!</span>}
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Speichern
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
