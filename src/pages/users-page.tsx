import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, ApiError } from "@/lib/api";
import { type User, type ClubStatus } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Filter, AlertCircle, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";

export function UsersPage() {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<ClubStatus | "">("");
    const [hasClubFilter, setHasClubFilter] = useState<"true" | "false" | "">("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                let query = `?`;
                if (statusFilter) query += `membership_status=${statusFilter}&`;
                if (hasClubFilter) query += `has_club=${hasClubFilter}&`;

                if (token) {
                    const data = await api.get<User[]>(`/users${query}`, token);
                    setUsers(data || []);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch users", err);
                if (err instanceof ApiError && err.data?.message) {
                    setError(err.data.message);
                } else {
                    setError(t('dashboard.errors.load_failed'));
                }
            } finally {
                setLoading(false);
            }
        };

        if (user?.roles?.includes('admin')) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [token, statusFilter, hasClubFilter, t, user]);

    const filteredUsers = users.filter(u => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (u.firstname || "").toLowerCase().includes(q) ||
            (u.lastname || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q)
        );
    });

    if (!user?.roles?.includes('admin')) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                You do not have permission to view this page.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
                    <p className="text-muted-foreground">
                        Liste der Plattform-Nutzer
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
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium w-full md:w-auto">
                        <Filter className="h-4 w-4" />
                        {t('dashboard.filter.label')}
                    </div>

                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Suchen..."
                            className="pl-8 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="h-10 w-full md:w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ClubStatus | "")}
                    >
                        <option value="">{t('dashboard.filter.all_status')}</option>
                        {['active', 'inactive', 'requested', 'denied', 'cancelled'].map((key) => (
                            <option key={key} value={key}>{t(`club.status.${key}`)}</option>
                        ))}
                    </select>

                    <select
                        className="h-10 w-full md:w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={hasClubFilter}
                        onChange={(e) => setHasClubFilter(e.target.value as "true" | "false" | "")}
                    >
                        <option value="">Alle Nutzer</option>
                        <option value="true">Mit Club(s)</option>
                        <option value="false">Ohne Club</option>
                    </select>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">{t('dashboard.loading')}</div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">{t('dashboard.empty.title', 'Keine Benutzer gefunden')}</h3>
                    <p className="text-muted-foreground mb-4">Passe deine Filter an oder suche neu.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredUsers.map(u => (
                        <Link key={u._key} to={`/users/${u._key}`}>
                            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between space-x-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="font-semibold text-primary">
                                                    {(u.firstname?.substring(0, 1) || '') + (u.lastname?.substring(0, 1) || '')}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold truncate">
                                                    {u.firstname} {u.lastname}
                                                </h3>
                                                <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                                            </div>
                                        </div>
                                        {u.membership?.status && (
                                            <StatusBadge membership={u.membership} />
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
