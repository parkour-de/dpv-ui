import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, getErrorMessage } from "@/lib/api";
import { type User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { MembershipStatus } from "@/components/membership-status";
import { PaymentDetails } from "@/components/payment-details";

export function UserDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user: currentUser, token } = useAuth();

    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Membership action state
    const [actionModal, setActionModal] = useState<'approve' | 'deny' | 'cancel' | null>(null);
    const [actionDate, setActionDate] = useState<string>("");

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            setError(null);
            try {
                if (token && id) {
                    const data = await api.get<User>(`/user/${id}`, token);
                    setTargetUser(data);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch user", err);
                setError(getErrorMessage(err, t));
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.roles?.includes('admin')) {
            fetchUser();
        } else {
            setLoading(false);
            setError("Sie haben keine Berechtigung, diese Seite anzuzeigen.");
        }
    }, [id, token, currentUser]);

    const handleMembershipAction = async (action: 'approve' | 'deny' | 'cancel') => {
        if (!token || !targetUser) return;
        setActionLoading(true);
        setError(null);
        try {
            let body = {};
            if ((action === 'approve' || action === 'cancel') && actionDate) {
                const parts = actionDate.split('-');
                if (parts.length === 3) {
                    const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
                    const timestamp = Math.floor(date.getTime() / 1000);
                    if (action === 'approve') {
                        body = { begin_date: timestamp };
                    } else {
                        body = { end_date: timestamp };
                    }
                }
            }

            await api.post(`/user/${targetUser._key}/${action}`, body, token);

            // Refetch
            const data = await api.get<User>(`/user/${id}`, token);
            setTargetUser(data);
            setActionModal(null);
            setActionDate("");
        } catch (err: unknown) {
            console.error(`Failed to ${action} membership`, err);
            setError(getErrorMessage(err, t));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground">{t('dashboard.loading')}</div>;
    }

    if (error || !targetUser) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <Button variant="ghost" className="mb-4" onClick={() => navigate('/users')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Übersicht
                </Button>
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error || "Benutzer nicht gefunden"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/users')} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Benutzerverwaltung
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {targetUser.firstname} {targetUser.lastname}
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm mt-1">ID: {targetUser._key}</p>
                </div>
                {targetUser.membership?.status && (
                    <StatusBadge membership={targetUser.membership} />
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Persönliche Daten</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Vorname</Label>
                                <p className="font-medium">{targetUser.firstname}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Nachname</Label>
                                <p className="font-medium">{targetUser.lastname}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">E-Mail</Label>
                            <p className="font-medium">{targetUser.email}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Bevorzugte Sprache</Label>
                            <p className="font-medium">{targetUser.language?.toUpperCase() || 'DE'}</p>
                        </div>
                        {targetUser.your_club && (
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">Verein (Dein Verein)</Label>
                                <p className="font-medium">{targetUser.your_club}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Rollen</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {targetUser.roles?.map(role => (
                                    <span key={role} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mitgliedschaftsstatus</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MembershipStatus membership={targetUser.membership} />
                        </CardContent>
                        {targetUser.membership?.status === 'requested' && (
                            <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setActionModal('approve')} disabled={actionLoading}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Genehmigen
                                </Button>
                                <Button variant="destructive" className="w-full" onClick={() => setActionModal('deny')} disabled={actionLoading}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Ablehnen
                                </Button>
                            </CardFooter>
                        )}
                        {targetUser.membership?.status === 'active' && (
                            <CardFooter className="border-t pt-4">
                                <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setActionModal('cancel')} disabled={actionLoading}>
                                    Kündigen (Admin)
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    <PaymentDetails
                        token={token!}
                        fetchUrl={`/user/${targetUser._key}/payment-details`}
                        isAdmin={true}
                        formData={{}} // Wir benötigen das bearbeitbare Formular hier nicht, readOnly reicht
                        onChange={() => { }}
                        isReadOnly={true}
                        alwaysOpen={false}
                    />
                </div>
            </div>

            {/* Admin Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-lg border">
                        <CardHeader>
                            <CardTitle>
                                {actionModal === 'approve' && 'Mitgliedschaft genehmigen'}
                                {actionModal === 'deny' && 'Mitgliedschaft ablehnen'}
                                {actionModal === 'cancel' && 'Mitgliedschaft kündigen'}
                            </CardTitle>
                            <CardDescription>
                                {actionModal === 'approve' && 'Bestätige das Eintrittsdatum. Falls die Person Zahlungsdetails hinterlegt hat, überprüfe diese bitte zuvor.'}
                                {actionModal === 'deny' && 'Möchtest du diesen Antrag wirklich ablehnen?'}
                                {actionModal === 'cancel' && 'Bitte wähle das Kündigungsdatum (Ende der aktiven Zeit).'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(actionModal === 'approve' || actionModal === 'cancel') && (
                                <div className="space-y-2">
                                    <Label htmlFor="actionDate">Datum (Optional)</Label>
                                    <Input
                                        id="actionDate"
                                        type="date"
                                        value={actionDate}
                                        onChange={(e) => setActionDate(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Falls leer, wird das Datum
                                        {actionModal === 'approve' && targetUser?.membership?.begin_date
                                            ? ` aus dem Antrag übernommen (${new Date(targetUser.membership.begin_date * 1000).toLocaleDateString()})`
                                            : " von heute verwendet"}.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => {
                                setActionModal(null);
                                setActionDate("");
                            }} disabled={actionLoading}>
                                Abbrechen
                            </Button>
                            <Button
                                variant={actionModal === 'deny' || actionModal === 'cancel' ? 'destructive' : 'default'}
                                onClick={() => handleMembershipAction(actionModal)}
                                disabled={actionLoading}
                            >
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Bestätigen
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
