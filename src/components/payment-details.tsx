import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Glasses } from "lucide-react";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export interface PaymentData {
    iban?: string;
    account_holder?: string;
    sepa_mandate_number?: string;
}

interface PaymentDetailsProps {
    readonly token: string;
    readonly fetchUrl: string; // e.g., '/club/123/payment-details'
    readonly patchUrl?: string; // e.g., '/club/123'
    readonly isAdmin?: boolean;
    readonly canEdit?: boolean;
    readonly alwaysOpen?: boolean; // If true, skips the lazy-load toggle entirely.
}

export function PaymentDetails({
    token, fetchUrl, patchUrl, isAdmin, canEdit, alwaysOpen
}: PaymentDetailsProps) {
    const { t } = useTranslation();
    const [fetchedData, setFetchedData] = useState<PaymentData>({});
    const [editData, setEditData] = useState<PaymentData>({});
    const [show, setShow] = useState(alwaysOpen || false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetch = async () => {
        if (token) {
            setLoading(true);
            try {
                const data = await api.get<PaymentData>(fetchUrl, token);
                setFetchedData(data || {});
                setEditData(data || {});
            } catch (e) {
                console.error("Failed to fetch payment details", e);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!patchUrl || !token) return;
        setSaving(true);
        setError(null);
        try {
            const payload: Partial<PaymentData> = {
                iban: editData.iban,
                account_holder: editData.account_holder,
            };
            if (isAdmin) {
                payload.sepa_mandate_number = editData.sepa_mandate_number;
            }
            await api.patch(patchUrl, payload, token);
            setFetchedData(editData);
            setIsEditing(false);
        } catch (e) {
            const err = e as { data?: { message?: string } };
            setError(err?.data?.message || "Failed to save bank details");
        } finally {
            setSaving(false);
        }
    };

    const handleShowToggle = async () => {
        if (!show && !hasAttemptedFetch) {
            setHasAttemptedFetch(true);
            await handleFetch();
        }
        setShow(!show);
    };

    useEffect(() => {
        if (alwaysOpen && !hasAttemptedFetch) {
            setHasAttemptedFetch(true);
            handleFetch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alwaysOpen, hasAttemptedFetch]);

    const dataToDisplay = isEditing ? editData : fetchedData;

    const inputs = (
        <div className="space-y-4">
            {error && <div className="text-sm text-destructive font-medium">{error}</div>}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="iban">{t('club.payment.labels.iban', 'IBAN')}</Label>
                    <Input
                        id="iban"
                        value={dataToDisplay.iban || ''}
                        onChange={(e) => setEditData(p => ({ ...p, iban: e.target.value }))}
                        placeholder={!isEditing ? t('club.payment.no_iban', 'Keine IBAN hinterlegt') : "DE..."}
                        disabled={!isEditing || saving}
                        className={!isEditing ? "bg-muted font-mono" : ""}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account_holder">{t('club.payment.labels.account_holder', 'Kontoinhaber')}</Label>
                    <Input
                        id="account_holder"
                        value={dataToDisplay.account_holder || ''}
                        onChange={(e) => setEditData(p => ({ ...p, account_holder: e.target.value }))}
                        placeholder={!isEditing ? "" : t('club.payment.placeholders.account_holder', 'Name')}
                        disabled={!isEditing || saving}
                        className={!isEditing ? "bg-muted" : ""}
                    />
                </div>
                {isAdmin && (!isEditing ? dataToDisplay.sepa_mandate_number : true) && (
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="sepa">{t('club.payment.labels.sepa', 'SEPA-Mandatsreferenz')}</Label>
                        <Input
                            id="sepa"
                            value={dataToDisplay.sepa_mandate_number || ''}
                            onChange={(e) => setEditData(p => ({ ...p, sepa_mandate_number: e.target.value }))}
                            disabled={!isEditing || saving}
                            className={!isEditing ? "bg-muted" : ""}
                        />
                        {isEditing && <p className="text-xs text-muted-foreground">{t('club.payment.admin_only', 'Nur für Administratoren sichtbar/bearbeitbar.')}</p>}
                    </div>
                )}
            </div>
            {isEditing && patchUrl && (
                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setEditData(fetchedData); setError(null); }} disabled={saving}>
                        {t('club.details.actions.cancel', 'Abbrechen')}
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('club.details.actions.save', 'Speichern')}
                    </Button>
                </div>
            )}
        </div>
    );

    const renderHeaderButtons = () => {
        if (canEdit && patchUrl && !isEditing) {
            return (
                <Button variant="outline" size="sm" onClick={() => { setIsEditing(true); setEditData(fetchedData); }}>
                    {t('club.details.actions.edit', 'Bearbeiten')}
                </Button>
            );
        }
        return null;
    };

    if (alwaysOpen) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">{t('club.payment.title', 'Zahlungsdaten')}</CardTitle>
                    {renderHeaderButtons()}
                </CardHeader>
                <CardContent className="pt-4">
                    {inputs}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-lg">{t('club.payment.title', 'Zahlungsdaten')}</CardTitle>
                    <CardDescription>{t('club.payment.description', 'Hinterlegte Zahlungsverbindung')}</CardDescription>
                </div>
                {show && renderHeaderButtons()}
            </CardHeader>
            <CardContent>
                {show ? (
                    <div className="space-y-4">
                        {inputs}
                        {!isEditing && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setShow(false)}>
                                {t('club.payment.hide', 'Ausblenden')}
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button type="button" variant="outline" onClick={handleShowToggle} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Glasses className="mr-2 h-4 w-4" />}
                        {t('club.payment.show', 'Zahlungsdaten anzeigen')}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
