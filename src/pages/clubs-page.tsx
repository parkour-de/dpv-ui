import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, getErrorMessage } from "@/lib/api";
import { type Club, CLUB_STATUS_COLORS, type ClubStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Filter, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export function ClubsPage() {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Admin filters
    const [statusFilter, setStatusFilter] = useState<ClubStatus | "">("");
    const [missingCensusYear, setMissingCensusYear] = useState<number>(0);
    const [page, setPage] = useState(0);
    const LIMIT = 50;

    useEffect(() => {
        if (user?.roles?.includes('admin')) {
            setIsAdmin(true);
        }
    }, [user]);

    useEffect(() => {
        const fetchClubs = async () => {
            setLoading(true);
            setError(null);
            try {
                let query = `?limit=${LIMIT}&skip=${page * LIMIT}`;
                if (statusFilter) {
                    query += `&status=${statusFilter}`;
                }
                if (missingCensusYear > 0) {
                    query += `&missing_census_year=${missingCensusYear}`;
                }

                if (token) {
                    const data = await api.get<Club[]>(`/clubs${query}`, token);
                    setClubs(data || []);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch clubs", err);
                setError(getErrorMessage(err, t));
            } finally {
                setLoading(false);
            }
        };

        fetchClubs();
    }, [token, statusFilter, missingCensusYear, page, t]);

    const clubsByStatus = clubs.reduce((acc, club) => {
        const status = club.membership.status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(club);
        return acc;
    }, {} as Record<string, Club[]>);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('dashboard.welcome', { firstname: user?.firstname })}
                    </p>
                </div>
                <Link to="/clubs/new">
                    <Button variant="accent">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('dashboard.actions.new_club')}
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            {isAdmin && (
                <Card className="bg-muted/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Filter className="h-4 w-4" />
                            {t('dashboard.filter.label')}
                        </div>
                        <select
                            className="h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ClubStatus | "")}
                        >
                            <option value="">{t('dashboard.filter.all_status')}</option>
                            {['active', 'inactive', 'requested', 'denied', 'cancelled'].map((key) => (
                                <option key={key} value={key}>{t(`club.status.${key}`)}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2 ml-auto border-l pl-4 border-input">
                            <input 
                                type="checkbox" 
                                id="missing-census"
                                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                checked={missingCensusYear > 0}
                                onChange={(e) => setMissingCensusYear(e.target.checked ? new Date().getFullYear() : 0)}
                            />
                            <label htmlFor="missing-census" className="text-sm font-medium cursor-pointer">
                                {t('dashboard.filter.missing_census', { defaultValue: 'Fehlende Bestandsmeldung', year: new Date().getFullYear() })} ({new Date().getFullYear()})
                            </label>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">{t('dashboard.loading')}</div>
            ) : (
                <>
                    {clubs.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                            <h3 className="text-lg font-medium">{t('dashboard.empty.title')}</h3>
                            <p className="text-muted-foreground">{t('dashboard.empty.description')}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {isAdmin ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {clubs.map(club => (
                                        <Link key={club._key} to={`/club/${club._key}`}>
                                            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between space-x-4">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <span className="font-semibold text-primary">{club.name.substring(0, 2).toUpperCase()}</span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold">{club.name}</h3>
                                                                <p className="text-sm text-muted-foreground">{club.legal_form}</p>
                                                            </div>
                                                        </div>
                                                        <StatusBadge membership={club.membership} />
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-sm text-muted-foreground">
                                                        {club.membership.address || t('dashboard.club_card.no_address')}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(clubsByStatus).map(([status, groupClubs]) => (
                                        <div key={status} className="space-y-4">
                                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CLUB_STATUS_COLORS[status as ClubStatus])}>
                                                    {t(`club.status.${status}`)}
                                                </span>
                                                <span>({groupClubs.length})</span>
                                            </h2>
                                            <div className="grid gap-4">
                                                {groupClubs.map((club) => (
                                                    <Link key={club._key} to={`/club/${club._key}`}>
                                                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                                                            <CardHeader className="pb-2">
                                                                <div className="flex items-center justify-between space-x-4">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                            <span className="font-semibold text-primary">{club.name.substring(0, 2).toUpperCase()}</span>
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="font-semibold">{club.name}</h3>
                                                                            <p className="text-sm text-muted-foreground">{club.legal_form}</p>
                                                                        </div>
                                                                    </div>
                                                                    <StatusBadge membership={club.membership} />
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {club.membership.address || t('dashboard.club_card.no_address')}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isAdmin && clubs.length >= LIMIT && (
                                <div className="flex justify-center pt-4">
                                    <Button variant="outline" onClick={() => setPage(p => p + 1)}>{t('dashboard.actions.load_more')}</Button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
