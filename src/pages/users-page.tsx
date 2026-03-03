import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, API_BASE, getErrorMessage } from "@/lib/api";
import { type User, type Club, type ClubStatus, type Membership } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Filter, AlertCircle, Search, Users, Building2, Download } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UnifiedMember = {
    _key: string;
    _internal_type: 'user' | 'club';
    name: string;
    email?: string;
    initials: string;
    membership?: Membership;
};

export function UsersPage() {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const [members, setMembers] = useState<UnifiedMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<ClubStatus | "">("");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("");

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            setError(null);
            try {
                if (token) {
                    const [usersData, clubsData] = await Promise.all([
                        api.get<User[]>(`/users`, token).catch(() => [] as User[]),
                        api.get<Club[]>(`/clubs?limit=1000`, token).catch(() => [] as Club[])
                    ]);

                    const unified: UnifiedMember[] = [
                        ...usersData.map(u => ({
                            _key: u._key,
                            _internal_type: 'user' as const,
                            name: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
                            email: u.email,
                            initials: (u.firstname?.substring(0, 1) || '') + (u.lastname?.substring(0, 1) || ''),
                            membership: u.membership
                        })),
                        ...clubsData.map(c => ({
                            _key: c._key,
                            _internal_type: 'club' as const,
                            name: c.name,
                            email: c.email || '', // fallback
                            initials: c.name ? c.name.substring(0, 2).toUpperCase() : '??',
                            membership: c.membership
                        }))
                    ];

                    setMembers(unified);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch members", err);
                setError(getErrorMessage(err, t));
            } finally {
                setLoading(false);
            }
        };

        if (user?.roles?.includes('admin')) {
            fetchMembers();
        } else {
            setLoading(false);
        }
    }, [token, user, t]);

    const handleExport = async (type: 'users' | 'clubs') => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE}/${type}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Accept': 'text/csv'
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to export", err);
            setError("Fehler beim Exportieren der Daten");
        }
    };

    const filteredMembers = members.filter(m => {
        // Status filter
        if (statusFilter && m.membership?.status !== statusFilter) return false;

        // Type filter
        if (typeFilter) {
            const memType = m.membership?.type || 'active'; // active is default for users, ordinary for clubs usually
            if (typeFilter === 'ordinary' && (m._internal_type !== 'club' || (memType !== 'ordinary' && memType !== 'active'))) return false;
            if (typeFilter === 'extraordinary' && (m._internal_type !== 'club' || memType !== 'extraordinary')) return false;
            if (typeFilter === 'active' && (m._internal_type !== 'user' || memType !== 'active')) return false;
            if (typeFilter === 'supporting' && (m._internal_type !== 'user' || memType !== 'supporting')) return false;
            if (typeFilter === 'honorary' && (m._internal_type !== 'user' || memType !== 'honorary')) return false;
        }

        // Fulltext search
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (m.name || "").toLowerCase().includes(q) ||
            (m.email || "").toLowerCase().includes(q)
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
                        Liste der Plattform-Nutzer und Vereine
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('users')} size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Nutzer CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('clubs')} size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Clubs CSV
                    </Button>
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
                        {t('dashboard.filter.label')}
                    </div>

                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Volltextsuche..."
                            className="pl-8 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="h-10 w-full md:w-[220px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">Alle Mitgliedsformen</option>
                        <option value="ordinary">Ordentliches Mitglied (Stamm)</option>
                        <option value="extraordinary">Außerordentliches Mitglied</option>
                        <option value="active">Aktives Mitglied (Person)</option>
                        <option value="supporting">Förderndes Mitglied</option>
                        <option value="honorary">Ehrenmitglied</option>
                    </select>

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
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">{t('dashboard.loading')}</div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">{t('dashboard.empty.title', 'Keine Benutzer gefunden')}</h3>
                    <p className="text-muted-foreground mb-4">Passe deine Filter an oder suche neu.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers.map(m => (
                        <Link key={m._key} to={m._internal_type === 'user' ? `/users/${m._key}` : `/clubs/${m._key}`}>
                            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between space-x-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                {m._internal_type === 'club' ? (
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Users className="h-4 w-4 text-primary" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold truncate">
                                                    {m.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                                            </div>
                                        </div>
                                        {m.membership?.status && (
                                            <StatusBadge membership={m.membership} />
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
