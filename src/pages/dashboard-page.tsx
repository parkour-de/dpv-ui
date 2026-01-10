import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api } from "@/lib/api";
import { type Club, CLUB_STATUS_COLORS, type ClubStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPage() {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Admin filters
    const [statusFilter, setStatusFilter] = useState<ClubStatus | "">("");
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
            try {
                let query = `?limit=${LIMIT}&skip=${page * LIMIT}`;
                if (statusFilter) {
                    query += `&status=${statusFilter}`;
                }

                if (token) {
                    const data = await api.get<Club[]>(`/clubs${query}`, token);
                    setClubs(data || []);
                }
            } catch (err) {
                console.error("Failed to fetch clubs", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClubs();
    }, [token, statusFilter, page]);

    const clubsByStatus = clubs.reduce((acc, club) => {
        const status = club.membership.status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(club);
        return acc;
    }, {} as Record<string, Club[]>);

    const StatusBadge = ({ status }: { status: ClubStatus }) => (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CLUB_STATUS_COLORS[status])}>
            {t(`club.status.${status}`)}
        </span>
    );

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
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('dashboard.actions.new_club')}
                    </Button>
                </Link>
            </div>

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
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">{t('dashboard.loading')}</div>
            ) : clubs.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">{t('dashboard.empty.title')}</h3>
                    <p className="text-muted-foreground mb-4">{t('dashboard.empty.description')}</p>
                    <Link to="/clubs/new">
                        <Button variant="outline">{t('dashboard.actions.create_club')}</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {isAdmin ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {clubs.map(club => (
                                <Link key={club._key} to={`/clubs/${club._key}`}>
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
                                                <StatusBadge status={club.membership.status} />
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
                                        <StatusBadge status={status as ClubStatus} />
                                        <span>({groupClubs.length})</span>
                                    </h2>
                                    <div className="grid gap-4">
                                        {groupClubs.map((club) => (
                                            <Link key={club._key} to={`/clubs/${club._key}`}>
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
                                                            <StatusBadge status={club.membership.status} />
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
        </div>
    );
}
