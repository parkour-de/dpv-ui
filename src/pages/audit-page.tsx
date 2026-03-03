import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context-core";
import { useTranslation } from "react-i18next";
import { api, getErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, History, User, Tag, Clock } from "lucide-react";

interface AuditEntry {
    date: string;
    author: string;
    action: string;
    type: string;
    key: string;
    node?: unknown;
}

export function AuditPage() {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            setError(null);
            try {
                if (token) {
                    const data = await api.get<AuditEntry[]>('/audit', token);
                    setLogs(data || []);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch audit logs", err);
                setError(getErrorMessage(err, t));
            } finally {
                setLoading(false);
            }
        };

        if (user?.roles?.includes('admin')) {
            fetchLogs();
        }
    }, [token, user]);

    if (!user?.roles?.includes('admin')) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Sie haben keine Berechtigung, diese Seite anzuzeigen.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Aktivitätsprotokoll</h1>
                    <p className="text-muted-foreground">
                        Letzte administrative Änderungen im System
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Lade Protokoll...</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">Keine Einträge gefunden</h3>
                    <p className="text-muted-foreground">Es wurden noch keine Aktionen protokolliert.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((entry, idx) => (
                        <Card key={idx} className="overflow-hidden border-l-4 border-l-primary/50">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${entry.action === 'create' ? 'bg-green-100 text-green-800' :
                                                entry.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {entry.action}
                                            </span>
                                            <span className="text-sm font-semibold flex items-center gap-1">
                                                <Tag className="h-3 w-3" />
                                                {entry.type}
                                            </span>
                                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                                ID: {entry.key}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(entry.date).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'medium' })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                Autor: {entry.author}
                                            </span>
                                        </div>
                                    </div>

                                    {!!entry.node && (
                                        <div className="text-xs bg-muted/50 p-2 rounded border font-mono max-h-24 overflow-auto max-w-full sm:max-w-xs">
                                            <pre>{JSON.stringify(entry.node, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
