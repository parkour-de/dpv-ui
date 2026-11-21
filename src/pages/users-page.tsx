import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, API_BASE, getErrorMessage } from "@/lib/api";
import { type User, type Club, type ClubStatus, type Membership } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, AlertCircle, Search, Users, Building2, Download } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// "Aktiv" in the status filter also covers memberships that start later or are being cancelled
const ACTIVE_STATUSES = ['active', 'approved', 'cancelling'];

type UnifiedMember = {
    _key: string;
    _internal_type: 'user' | 'club';
    name: string;
    email?: string;
    initials: string;
    membership?: Membership;
    state?: string;
};

export function UsersPage() {
    const { t, i18n } = useTranslation();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [now] = useState(() => Math.floor(Date.now() / 1000));
    const [members, setMembers] = useState<UnifiedMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<ClubStatus | "">("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [kindFilter, setKindFilter] = useState<"" | "user" | "club">("");

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
                            membership: c.membership,
                            state: c.state
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
            const url = globalThis.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export.csv`;
            document.body.appendChild(a);
            a.click();
            globalThis.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error("Failed to export", err);
            setError(t('dashboard.admin.export_error'));
        }
    };

    const matchesFilter = (m: UnifiedMember) => {
        // Status filter
        if (statusFilter === 'active' ? !ACTIVE_STATUSES.includes(m.membership?.status || '') : statusFilter && m.membership?.status !== statusFilter) return false;

        // Person / Verein filter
        if (kindFilter && m._internal_type !== kindFilter) return false;

        // Type filter
        if (typeFilter) {
            const memType = m.membership?.type || 'active'; 
            const isMatch = (
                (typeFilter === 'ordinary' && m._internal_type === 'club' && (memType === 'ordinary' || memType === 'active')) ||
                (typeFilter === 'extraordinary' && m._internal_type === 'club' && memType === 'extraordinary') ||
                (typeFilter === 'active' && m._internal_type === 'user' && memType === 'active') ||
                (typeFilter === 'supporting' && m._internal_type === 'user' && memType === 'supporting') ||
                (typeFilter === 'honorary' && m._internal_type === 'user' && memType === 'honorary')
            );
            if (!isMatch) return false;
        }

        // Fulltext search
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (m.name || "").toLowerCase().includes(q) ||
            (m.email || "").toLowerCase().includes(q)
        );
    };

    const filteredMembers = members.filter(matchesFilter);

    // Start date for upcoming memberships, end date for pending cancellations (same conditions as StatusBadge)
    const statusDate = (ms?: Membership) => {
        if (!ms) return null;
        const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString(i18n.language);
        if (ms.begin_date && (ms.status === 'approved' || (ms.status === 'active' && ms.begin_date > now))) {
            return t('dashboard.admin.table.from_date', { date: formatDate(ms.begin_date) });
        }
        if (ms.end_date && (ms.status === 'cancelling' || (ms.status === 'cancelled' && ms.end_date > now))) {
            return t('dashboard.admin.table.until_date', { date: formatDate(ms.end_date) });
        }
        return null;
    };

    // Same categories as the "Mitgliedsform" filter above; no category without a membership
    const memberTypeLabel = (m: UnifiedMember) => {
        if (!m.membership?.status || m.membership.status === 'inactive') return '–';
        const memType = m.membership.type || 'active';
        if (m._internal_type === 'club') {
            if (memType === 'extraordinary') return t('dashboard.admin.member_types.extraordinary');
            if (memType === 'ordinary' || memType === 'active') return t('dashboard.admin.member_types.ordinary');
        } else if (['active', 'supporting', 'honorary'].includes(memType)) {
            return t(`dashboard.admin.member_types.${memType}`);
        }
        return memType;
    };

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
                        {t('dashboard.admin.export_users')}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('clubs')} size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {t('dashboard.admin.export_clubs')}
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
                        className="h-10 w-full md:w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={kindFilter}
                        onChange={(e) => setKindFilter(e.target.value as "" | "user" | "club")}
                    >
                        <option value="">{t('dashboard.admin.table.all_types')}</option>
                        <option value="user">{t('dashboard.admin.table.person')}</option>
                        <option value="club">{t('dashboard.admin.table.club')}</option>
                    </select>

                    <select
                        className="h-10 w-full md:w-[220px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">{t('dashboard.admin.member_types.all')}</option>
                        <option value="ordinary">{t('dashboard.admin.member_types.ordinary')}</option>
                        <option value="extraordinary">{t('dashboard.admin.member_types.extraordinary')}</option>
                        <option value="active">{t('dashboard.admin.member_types.active')}</option>
                        <option value="supporting">{t('dashboard.admin.member_types.supporting')}</option>
                        <option value="honorary">{t('dashboard.admin.member_types.honorary')}</option>
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

            {loading && <div className="text-center py-12 text-muted-foreground">{t('dashboard.loading')}</div>}
            
            {!loading && filteredMembers.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">{t('dashboard.empty.title', 'Keine Benutzer gefunden')}</h3>
                    <p className="text-muted-foreground mb-4">Passe deine Filter an oder suche neu.</p>
                </div>
            )}

            {!loading && filteredMembers.length > 0 && (
                <Card className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="py-3 px-4 font-medium">{t('dashboard.admin.table.type')}</th>
                                <th className="py-3 px-4 font-medium">{t('dashboard.admin.table.name')}</th>
                                <th className="py-3 px-4 font-medium hidden md:table-cell">{t('dashboard.admin.table.email')}</th>
                                <th className="py-3 px-4 font-medium hidden lg:table-cell">{t('club.details.labels.state')}</th>
                                <th className="py-3 px-4 font-medium hidden md:table-cell">{t('dashboard.admin.table.member_type')}</th>
                                <th className="py-3 px-4 font-medium">{t('dashboard.admin.table.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(m => {
                                const to = m._internal_type === 'user' ? `/user/${m._key}` : `/club/${m._key}`;
                                return (
                                    <tr key={`${m._internal_type}-${m._key}`} onClick={() => navigate(to)} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                {m._internal_type === 'club' ? <Building2 className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
                                                <span className="hidden sm:inline">{m._internal_type === 'club' ? t('dashboard.admin.table.club') : t('dashboard.admin.table.person')}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            <Link to={to} className="hover:underline underline-offset-4" onClick={(e) => e.stopPropagation()}>{m.name}</Link>
                                            <div className="md:hidden text-xs font-normal text-muted-foreground break-all">{m.email}</div>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground break-all hidden md:table-cell">{m.email}</td>
                                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{m.state || '–'}</td>
                                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{memberTypeLabel(m)}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {m.membership?.status && <StatusBadge membership={m.membership} />}
                                            {statusDate(m.membership) && <div className="text-xs text-muted-foreground mt-1">{statusDate(m.membership)}</div>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
