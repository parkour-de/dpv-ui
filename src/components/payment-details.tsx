import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export interface PaymentData {
    iban?: string;
    account_holder?: string;
    sepa_mandate_number?: string;
}

interface PaymentDetailsProps {
    token: string;
    fetchUrl: string; // e.g., '/club/123/payment-details'
    isAdmin?: boolean;

    // Controlled mode (For embedded forms like in profile-page or club-details edit mode)
    formData?: PaymentData;
    onChange?: (field: string, value: string) => void;

    // Presentation Options
    isReadOnly?: boolean;
    alwaysOpen?: boolean; // If true, skips the lazy-load toggle entirely.
}

export function PaymentDetails({
    token, fetchUrl, isAdmin, formData, onChange, isReadOnly, alwaysOpen
}: PaymentDetailsProps) {
    const { t } = useTranslation();
    const [fetchedData, setFetchedData] = useState<PaymentData | null>(null);
    const [show, setShow] = useState(alwaysOpen || false);
    const [loading, setLoading] = useState(false);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

    const handleFetch = async () => {
        if (!fetchedData && token) {
            setLoading(true);
            try {
                const data = await api.get<PaymentData>(fetchUrl, token);
                setFetchedData(data);
                if (!isReadOnly && onChange) {
                    onChange('iban', data.iban || '');
                    onChange('account_holder', data.account_holder || '');
                    onChange('sepa_mandate_number', data.sepa_mandate_number || '');
                }
            } catch (e) {
                console.error("Failed to fetch payment details", e);
            } finally {
                setLoading(false);
            }
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

    const dataToDisplay = (isReadOnly && !alwaysOpen) ? (fetchedData || {}) : (formData || {});

    const inputs = (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="iban">{t('club.payment.labels.iban', 'IBAN')}</Label>
                <Input
                    id="iban"
                    value={dataToDisplay.iban || ''}
                    onChange={(e) => onChange?.('iban', e.target.value)}
                    placeholder={isReadOnly ? t('club.payment.no_iban', 'Keine IBAN hinterlegt') : "DE..."}
                    disabled={isReadOnly}
                    className={isReadOnly ? "bg-muted font-mono" : ""}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="account_holder">{t('club.payment.labels.account_holder', 'Kontoinhaber')}</Label>
                <Input
                    id="account_holder"
                    value={dataToDisplay.account_holder || ''}
                    onChange={(e) => onChange?.('account_holder', e.target.value)}
                    placeholder={isReadOnly ? "" : t('club.payment.placeholders.account_holder', 'Name')}
                    disabled={isReadOnly}
                    className={isReadOnly ? "bg-muted" : ""}
                />
            </div>
            {isAdmin && (isReadOnly ? dataToDisplay.sepa_mandate_number : true) && (
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="sepa">{t('club.payment.labels.sepa', 'SEPA-Mandatsreferenz')}</Label>
                    <Input
                        id="sepa"
                        value={dataToDisplay.sepa_mandate_number || ''}
                        onChange={(e) => onChange?.('sepa_mandate_number', e.target.value)}
                        disabled={isReadOnly}
                        className={isReadOnly ? "bg-muted" : ""}
                    />
                    {!isReadOnly && <p className="text-xs text-muted-foreground">{t('club.payment.admin_only', 'Nur für Administratoren sichtbar.')}</p>}
                </div>
            )}
        </div>
    );

    if (alwaysOpen) {
        return inputs;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('club.payment.title', 'Zahlungsdaten')}</CardTitle>
                <CardDescription>{t('club.payment.description', 'Hinterlegte Zahlungsverbindung')}</CardDescription>
            </CardHeader>
            <CardContent>
                {!show ? (
                    <Button type="button" variant="outline" onClick={handleShowToggle} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('club.payment.show', 'Zahlungsdaten anzeigen')}
                    </Button>
                ) : (
                    <div className="space-y-4">
                        {inputs}
                        <Button type="button" variant="outline" size="sm" onClick={() => setShow(false)}>
                            {t('club.payment.hide', 'Ausblenden')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
