import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context-core";
import { useTranslation } from "react-i18next";
import { api, getErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, History, User, Tag, Clock, Filter, Search } from "lucide-react";

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

    const [userFilter, setUserFilter] = useState("");
    const [targetFilter, setTargetFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    // Use a robust debounce if preferred, or just rely on React's render cycle for now, 
    // but useEffect will trigger on every keystroke. For a simple admin panel this is ok 
    // but let's be mindful.

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            setError(null);
            try {
                if (token) {
                    const params = new URLSearchParams();
                    if (userFilter) params.append('user', userFilter);
                    if (targetFilter) params.append('target', targetFilter);
                    if (actionFilter) params.append('action', actionFilter);

                    const qs = params.toString() ? `?${params.toString()}` : '';
                    const data = await api.get<AuditEntry[]>(`/audit${qs}`, token);
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
            const timeoutId = setTimeout(() => fetchLogs(), 300); // minimal debounce
            return () => clearTimeout(timeoutId);
        }
    }, [token, user, t, userFilter, targetFilter, actionFilter]);

    if (!user?.roles?.includes('admin')) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                {t('dashboard.audit_page.unauthorized')}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.audit_page.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('dashboard.audit_page.description')}
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            <Card className="bg-muted/50">
                <CardContent className="p-4 flex flex-col md:flex-row flex-wrap items-start md:items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium w-full md:w-auto">
                        <Filter className="h-4 w-4" />
                        {t('dashboard.audit_page.filter')}
                    </div>

                    <div className="relative w-full md:max-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('dashboard.audit_page.author')}
                            className="pl-8 bg-background"
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                        />
                    </div>

                    <div className="relative w-full md:max-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('dashboard.audit_page.target')}
                            className="pl-8 bg-background"
                            value={targetFilter}
                            onChange={(e) => setTargetFilter(e.target.value)}
                        />
                    </div>

                    <select
                        className="h-10 w-full md:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="">{t('dashboard.audit_page.all_actions')}</option>
                        <option value="create">{t('dashboard.audit_page.create')}</option>
                        <option value="update">{t('dashboard.audit_page.update')}</option>
                        <option value="delete">{t('dashboard.audit_page.delete')}</option>
                    </select>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">{t('dashboard.audit_page.loading')}</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">{t('dashboard.audit_page.no_entries')}</h3>
                    <p className="text-muted-foreground">{t('dashboard.audit_page.no_actions')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((entry, idx) => {
                        const statusColor = entry.action === 'create' ? 'bg-green-100 text-green-800' :
                            entry.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800';
                        return (
                            <Card key={`${entry.date}-${entry.key}-${idx}`} className="overflow-hidden border-l-4 border-l-primary/50">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${statusColor}`}>
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
                                                    {t('dashboard.audit_page.author_label')} {entry.author}
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}
