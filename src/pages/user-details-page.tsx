import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { type TFunction } from "i18next";
import { useAuth } from "@/context/auth-context-core";
import { useConfig } from "@/hooks/use-config";
import { api, getErrorMessage } from "@/lib/api";
import { type PaymentData } from "@/components/payment-details";
import { type User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { MembershipStatus } from "@/components/membership-status";
import { UserProfileForm } from "@/components/user-profile-form";
import { calculateCancellationDate, cn } from "@/lib/utils";
import { useBreadcrumbLabel } from "@/context/breadcrumb-context";

type MembershipAction = 'approve' | 'deny' | 'cancel' | 'apply';
// Dialogs: the membership actions plus "withdraw", which confirms withdrawing an application (server action: cancel)
type ModalType = MembershipAction | 'withdraw';

export function UserDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const { user: currentUser, token, apiUpdateUser, login } = useAuth();
    const { config } = useConfig();

    // Determine if we are looking at our own profile via /profile or /user/:my_id
    const isSelfView = !id || id === currentUser?._key;
    const targetUserId = id || currentUser?._key;

    const [targetUser, setTargetUser] = useState<User | null>(null);
    useBreadcrumbLabel(targetUser ? `${targetUser.firstname} ${targetUser.lastname}` : undefined);
    // Personal applications need bank details (IBAN + account holder) before the apply button is enabled
    const [hasBankDetails, setHasBankDetails] = useState(false);
    useEffect(() => {
        if (!token || !targetUser?._key) return;
        api.get<PaymentData>(`/user/${targetUser._key}/payment-details`, token)
            .then(data => setHasBankDetails(!!(data?.iban && data?.account_holder)))
            .catch(() => setHasBankDetails(false));
    }, [token, targetUser?._key]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Membership action state
    const [actionModal, setActionModal] = useState<ModalType | null>(null);
    const [actionDate, setActionDate] = useState<string>(isSelfView ? new Date().toISOString().split('T')[0] : "");

    // Self-apply specific states
    const [searchParams] = useSearchParams();
    const typeQuery = searchParams.get("type");
    const [applyType, setApplyType] = useState<'active' | 'supporting'>(typeQuery === "supporting" ? "supporting" : "active");
    const [applyFee, setApplyFee] = useState<number>(30);
    const [consents, setConsents] = useState({
        privacy: false,
        accuracy: false,
        statutes: false,
        finances: false
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!token || !targetUserId) return;
            setLoading(true);
            setError(null);

            try {
                // Determine if we should just use currentUser directly or fetch
                if (isSelfView && currentUser) {
                    setTargetUser(currentUser);
                    setLoading(false);
                } else if (currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('aktivadmin')) {
                    const data = await api.get<User>(`/user/${targetUserId}`, token);
                    setTargetUser(data);
                    setLoading(false);
                } else {
                    setLoading(false);
                    setError(t('dashboard.audit_page.unauthorized'));
                }
            } catch (err: unknown) {
                console.error("Failed to fetch user", err);
                setError(getErrorMessage(err, t));
                setLoading(false);
            }
        };

        void fetchUser();
    }, [isSelfView, targetUserId, token, currentUser, t]);

    const handleSelfMembershipAction = async (action: MembershipAction) => {
        if (!token || !targetUser) return;
        let body: Record<string, unknown> = {};

        if (action === 'apply') {
            body = {
                consent_privacy: consents.privacy,
                consent_accuracy: consents.accuracy,
                consent_statutes: consents.statutes,
                consent_finances: consents.finances,
                type: applyType,
                fee: applyType === 'supporting' ? applyFee : 10
            };
        } else if (action === 'cancel') {
            body = {};
        }

        await api.post(`/users/me/${action}`, body, token);
        const updatedUser = await api.get<User>('/users/me', token);
        if (apiUpdateUser) apiUpdateUser(updatedUser);
        setTargetUser(updatedUser);
    };

    const handleAdminMembershipAction = async (action: MembershipAction) => {
        if (!token || !targetUser) return;
        let body: Record<string, unknown> = {};

        if (action === 'approve' && actionDate) {
            const parts = actionDate.split('-');
            if (parts.length === 3) {
                const date = new Date(Date.UTC(Number.parseInt(parts[0]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[2])));
                const timestamp = Math.floor(date.getTime() / 1000);
                body = { begin_date: timestamp };
            }
        } else if (action === 'approve' && targetUser.membership?.application_date) {
            // No date chosen: the membership begins on the application date (the server would otherwise use today)
            body = { begin_date: targetUser.membership.application_date };
        }

        await api.post(`/user/${targetUser._key}/${action}`, body, token);
        const data = await api.get<User>(`/user/${targetUserId}`, token);
        setTargetUser(data);
    };

    const handleMembershipAction = async (action: 'approve' | 'deny' | 'cancel' | 'apply') => {
        if (!token || !targetUser) return;
        setActionLoading(true);
        setError(null);

        try {
            if (isSelfView && (action === 'apply' || (action === 'cancel' && !currentUser?.roles?.includes('admin')))) {
                await handleSelfMembershipAction(action);
            } else {
                await handleAdminMembershipAction(action);
            }

            setActionModal(null);
            setActionDate(isSelfView ? new Date().toISOString().split('T')[0] : "");
        } catch (err: unknown) {
            console.error(`Failed to ${action} membership`, err);
            setError(getErrorMessage(err, t));
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveSuccess = (updatedUser: User) => {
        if (isSelfView) {
            if (apiUpdateUser) {
                apiUpdateUser(updatedUser);
            } else if (login && token) {
                login(token, updatedUser);
            }
        }
        setTargetUser(updatedUser);
    };

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground">{t('dashboard.loading')}</div>;
    }

    if (error || !targetUser) {
        return (
            <div className="space-y-6">
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error || t('dashboard.admin.user_not_found')}</p>
                </div>
            </div>
        );
    }

    const renderHeader = () => {
        if (isSelfView) {
            return <h1 className="text-2xl font-bold">{t('profile.title')}</h1>;
        }

        return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {targetUser?.firstname} {targetUser?.lastname}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm mt-1">ID: {targetUser?._key}</p>
                    </div>
                </div>
        );
    };

    // Members (active, accepted but starting later, or in their notice period) see one "Mitgliedschaft" card
    // with status, dates and association data; everyone else only sees the status card with apply/withdraw.
    const isMember = ['active', 'approved', 'cancelling'].includes(targetUser.membership?.status || '');
    const formatDate = (ts?: number) => (ts ? new Date(ts * 1000).toLocaleDateString(i18n.language) : '');

    const renderVerbandCard = () => (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                    <CardTitle>{t('profile.membership.title_self')}</CardTitle>
                    {isSelfView && <CardDescription>{t('profile.membership.description')}</CardDescription>}
                </div>
                <StatusBadge membership={targetUser.membership} />
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Pending cancellation: entry and cancellation date in the status box (the chip is in the header) */}
                {targetUser.membership?.status === 'cancelling' && (
                    <div className="p-4 border rounded-md bg-muted/20">
                        <MembershipStatus membership={targetUser.membership} datesOnly />
                    </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                    {targetUser.membership?.status !== 'cancelling' && (
                        <div className="space-y-2">
                            <Label>{t('profile.verband.begin_date')}</Label>
                            <Input value={formatDate(targetUser.membership?.begin_date)} disabled />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>{t('profile.verband.membership_number', { defaultValue: 'Mitgliedsnummer' })}</Label>
                        <Input value={targetUser.membership?.membership_number || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('profile.verband.fee', { defaultValue: 'Aktueller Beitrag' })}</Label>
                        <Input value={targetUser?.membership?.current_fee !== undefined ? `${targetUser.membership.current_fee.toFixed(2)} €` : ''} disabled />
                        {isSelfView && (
                            <p className="text-xs text-muted-foreground mt-1">
                                <Trans i18nKey="profile.verband.see_documents" components={{ statutes: <a href={config?.links?.statutes || "https://parkour-deutschland.de/wp-content/uploads/2026/03/Satzung_DPV_Stand_2025.pdf"} target="_blank" rel="noopener noreferrer" className="underline text-[#00b8b0]">Satzung</a>, finances: <a href={config?.links?.finances || "https://parkour-deutschland.de/wp-content/uploads/2025/11/Beitragsordnung_DPV.pdf"} target="_blank" rel="noopener noreferrer" className="underline text-[#00b8b0]">Beitragsordnung</a> }} />
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>{t('profile.verband.membership_type')}</Label>
                        <Input value={(() => {
                            const mType = targetUser.membership?.type;
                            if (mType === 'active') return t('landing.active_membership.title');
                            if (mType === 'supporting') return t('landing.supporting_membership.title');
                            if (mType === 'ordinary') return t('landing.ordinary_membership.title');
                            return mType || '';
                        })()} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('profile.verband.votes')}</Label>
                        <Input value={targetUser.membership?.current_votes?.toString() ?? '0'} disabled />
                    </div>
                </div>

                {isSelfView && (
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setActionModal('cancel')}
                            disabled={actionLoading || targetUser.membership?.status === 'cancelling'}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {targetUser.membership?.status === 'cancelling' ? t('profile.actions.cancelling') : t('profile.actions.cancel_membership')}
                        </Button>
                    </div>
                )}
            </CardContent>
            {(!isSelfView || currentUser?.roles?.includes('admin')) && targetUser.membership?.status === 'active' && (
                <CardFooter className="border-t pt-4">
                    <Button variant="destructive" className="w-full" onClick={() => setActionModal('cancel')} disabled={actionLoading}>
                        {t('profile.actions.cancel_admin')}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );


    return (
        <div className="space-y-6 pb-12">
            {renderHeader()}

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <UserProfileForm
                        user={targetUser!}
                        token={token || ""}
                        isAdminView={!isSelfView}
                        endpointOverride={`/user/${targetUser?._key}`}
                        onSaveSuccess={handleSaveSuccess}
                        onPaymentSaved={(data) => setHasBankDetails(!!(data.iban && data.account_holder))}
                    />

                    {currentUser?.roles?.includes('admin') && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profile.roles.title')}</CardTitle>
                                <CardDescription>{t('profile.roles.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {targetUser.roles?.map(role => (
                                            <span key={role} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-3 pt-2 border-t">
                                        <Label className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                                            <input
                                                type="checkbox"
                                                checked={targetUser.roles?.includes('admin') || false}
                                                onChange={async (e) => {
                                                    const checked = e.target.checked;
                                                    const currentRoles = targetUser.roles || [];
                                                    const newRoles = checked
                                                        ? [...currentRoles, 'admin']
                                                        : currentRoles.filter(r => r !== 'admin');

                                                    try {
                                                        await api.patch(`/user/${targetUser?._key}/roles`, { roles: newRoles }, token || "");
                                                        setTargetUser(targetUser ? { ...targetUser, roles: newRoles } : null);
                                                    } catch (err: unknown) {
                                                        setError(getErrorMessage(err, t));
                                                    }
                                                }}
                                                disabled={actionLoading}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span>{t('profile.roles.admin')}</span>
                                        </Label>
                                        {(() => {
                                            const isAktivAdmin = targetUser.roles?.includes('aktivadmin') || false;
                                            const hasActiveMembership = targetUser.membership?.type === 'active' && 
                                                (targetUser.membership?.status === 'active' || targetUser.membership?.status === 'cancelling');
                                            const aktivAdminDisabled = !isAktivAdmin && !hasActiveMembership;
                                            
                                            return (
                                                <Label className={cn("flex items-center gap-2 cursor-pointer text-sm font-normal", aktivAdminDisabled && "text-muted-foreground opacity-60 cursor-not-allowed")}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isAktivAdmin}
                                                        onChange={async (e) => {
                                                            const checked = e.target.checked;
                                                            const currentRoles = targetUser.roles || [];
                                                            const newRoles = checked
                                                                ? [...currentRoles, 'aktivadmin']
                                                                : currentRoles.filter(r => r !== 'aktivadmin');

                                                            try {
                                                                await api.patch(`/user/${targetUser?._key}/roles`, { roles: newRoles }, token || "");
                                                                setTargetUser(targetUser ? { ...targetUser, roles: newRoles } : null);
                                                            } catch (err: unknown) {
                                                                setError(getErrorMessage(err, t));
                                                            }
                                                        }}
                                                        disabled={actionLoading || aktivAdminDisabled}
                                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <span>{t('profile.roles.aktivadmin')}</span>
                                                </Label>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    {!isMember && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{isSelfView ? t('profile.membership.title_self') : t('profile.membership.title_other')}</CardTitle>
                            {isSelfView && <CardDescription>{t('profile.membership.description')}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isSelfView ? (
                                <div className="p-4 border rounded-md bg-muted/20">
                                    <MembershipStatus membership={targetUser.membership} />
                                </div>
                            ) : (
                                <MembershipStatus membership={targetUser.membership} />
                            )}

                            {isSelfView && (
                                <div className="flex justify-end mt-4">
                                    {targetUser?.membership?.status === 'requested' ? (
                                        <Button size="sm" variant="destructive" onClick={() => setActionModal('withdraw')} disabled={actionLoading}>
                                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t('profile.actions.withdraw_application')}
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={() => setActionModal('apply')} disabled={actionLoading || !hasBankDetails}>
                                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {targetUser?.membership?.status === 'denied'
                                                ? t('profile.actions.reapply')
                                                : t('profile.actions.apply_membership')}
                                        </Button>
                                    )}
                                </div>
                            )}
                            {isSelfView && targetUser?.membership?.status !== 'requested' && !hasBankDetails && (
                                <p className="text-xs text-muted-foreground text-right">{t('profile.actions.apply_needs_bank')}</p>
                            )}
                        </CardContent>

                        {(!isSelfView || currentUser?.roles?.includes('admin')) && targetUser.membership?.status === 'requested' && (
                            <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setActionModal('approve')} disabled={actionLoading}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t('club.details.membership.approve')}
                                </Button>
                                <Button variant="destructive" className="w-full" onClick={() => setActionModal('deny')} disabled={actionLoading}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {t('club.details.membership.deny')}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                    )}

                    {isMember && renderVerbandCard()}
                </div>
            </div>

            {actionModal && (
                <ActionModal
                    actionModal={actionModal}
                    setActionModal={setActionModal}
                    isSelfView={isSelfView}
                    targetUser={targetUser}
                    actionDate={actionDate}
                    setActionDate={setActionDate}
                    handleMembershipAction={handleMembershipAction} // Pass the combined handler
                    consents={consents}
                    setConsents={setConsents}
                    applyType={applyType}
                    setApplyType={setApplyType}
                    applyFee={applyFee}
                    setApplyFee={setApplyFee}
                    t={t}
                    actionLoading={actionLoading} // Pass actionLoading
                    configLinks={config?.links}
                />
            )}
        </div>
    );
}

interface ApplyFormProps {
    applyType: 'active' | 'supporting';
    setApplyType: (val: 'active' | 'supporting') => void;
    applyFee: number;
    setApplyFee: (val: number) => void;
    consents: { privacy: boolean; accuracy: boolean; statutes: boolean; finances: boolean };
    setConsents: React.Dispatch<React.SetStateAction<{ privacy: boolean; accuracy: boolean; statutes: boolean; finances: boolean }>>;
    t: TFunction; 
    configLinks: Record<string, string> | undefined;
}

function ApplyForm({ applyType, setApplyType, applyFee, setApplyFee, consents, setConsents, t, configLinks }: ApplyFormProps) {
    return (
        <div className="space-y-4 pt-2">
            <div className="space-y-2 border-b pb-4">
                <Label>{t('profile.verband.membership_type')}</Label>
                <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2 cursor-pointer font-normal">
                        <input type="radio" value="active" checked={applyType === 'active'} onChange={() => setApplyType('active')} />
                        <span>{t('profile.apply.active_option')}</span>
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer font-normal">
                        <input type="radio" value="supporting" checked={applyType === 'supporting'} onChange={() => setApplyType('supporting')} />
                        <span>{t('landing.supporting_membership.title')}</span>
                    </Label>
                </div>
            </div>
            {applyType === 'supporting' && (
                <div className="space-y-2 animate-in fade-in pb-2">
                    <Label htmlFor="customFee">{t('profile.apply.custom_fee')}</Label>
                    <Input
                        id="customFee"
                        type="number"
                        min="1"
                        step="1"
                        value={applyFee}
                        onChange={(e) => setApplyFee(Number.parseInt(e.target.value))}
                    />
                </div>
            )}
            <div className="space-y-3">
                {[
                    { id: 'privacy', key: 'club.details.membership.consent_privacy', def: 'Ich stimme der <1>Datenschutzerklärung</1> zu.', href: configLinks?.privacy || 'https://parkour-deutschland.de/datenschutzerklaerung/' },
                    { id: 'accuracy', key: 'club.details.membership.consent_accuracy', def: 'Ich versichere, dass meine Angaben der Wahrheit entsprechen.' },
                    { id: 'statutes', key: 'club.details.membership.consent_statutes', def: 'Ich habe die <1>Satzung</1> gelesen und erkenne sie an.', href: configLinks?.statutes || 'https://parkour-deutschland.de/wp-content/uploads/2026/03/Satzung_DPV_Stand_2025.pdf' },
                    { id: 'finances', key: 'club.details.membership.consent_finances', def: 'Ich habe die <1>Beitragsordnung</1> gelesen und erkenne sie an.', href: configLinks?.finances || 'https://parkour-deutschland.de/wp-content/uploads/2025/11/Beitragsordnung_DPV.pdf' }
                ].map(item => (
                    <div key={item.id} className="flex items-start space-x-2">
                        <input
                            type="checkbox"
                            id={`consent-${item.id}`}
                            className="mt-1"
                            checked={consents[item.id as keyof typeof consents]}
                            onChange={(e) => setConsents(p => ({ ...p, [item.id]: e.target.checked }))}
                        />
                        <Label htmlFor={`consent-${item.id}`} className="text-sm font-normal leading-snug">
                            {item.href ? (
                                <Trans
                                    i18nKey={item.key!}
                                    defaults={item.def}
                                    components={{ 1: <a href={item.href} target="_blank" rel="noopener noreferrer" className="underline text-[#00b8b0]" /> }}
                                />
                            ) : (
                                t(item.key!, { defaultValue: item.def })
                            )}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface ActionModalProps {
    actionModal: ModalType | null;
    setActionModal: (val: ModalType | null) => void;
    isSelfView: boolean;
    targetUser: User | null;
    actionDate: string;
    setActionDate: (val: string) => void;
    handleMembershipAction: (action: MembershipAction) => Promise<void>;
    consents: { privacy: boolean; accuracy: boolean; statutes: boolean; finances: boolean };
    setConsents: React.Dispatch<React.SetStateAction<{ privacy: boolean; accuracy: boolean; statutes: boolean; finances: boolean }>>;
    applyType: 'active' | 'supporting';
    setApplyType: (val: 'active' | 'supporting') => void;
    applyFee: number;
    setApplyFee: (val: number) => void;
    t: TFunction;
    actionLoading: boolean;
    configLinks: Record<string, string> | undefined;
}

function ActionModal({
    actionModal,
    setActionModal,
    isSelfView,
    targetUser,
    actionDate,
    setActionDate,
    handleMembershipAction,
    consents,
    setConsents,
    applyType,
    setApplyType,
    applyFee,
    setApplyFee,
    t,
    actionLoading,
    configLinks
}: ActionModalProps) {
    const { i18n } = useTranslation();
    if (!actionModal) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border">
                <CardHeader>
                    <CardTitle>
                        {actionModal === 'approve' && t('dashboard.admin.approve_membership')}
                        {actionModal === 'deny' && t('dashboard.admin.deny_membership')}
                        {(actionModal === 'cancel' && !isSelfView) && t('dashboard.admin.cancel_membership')}
                        {(actionModal === 'cancel' && isSelfView) && t('profile.actions.cancel_membership')}
                        {actionModal === 'apply' && t('profile.actions.apply_membership')}
                        {actionModal === 'withdraw' && t('profile.actions.withdraw_application')}
                    </CardTitle>
                    <CardDescription>
                        {actionModal === 'approve' && t('dashboard.admin.approve_membership_desc')}
                        {actionModal === 'deny' && t('dashboard.admin.deny_membership_desc')}
                        {(actionModal === 'cancel' && !isSelfView) && t('profile.actions.cancel_dialog_description_other')}
                        {(actionModal === 'cancel' && isSelfView) && t('profile.actions.cancel_dialog_description_self')}
                        {actionModal === 'apply' && t('profile.actions.apply_description_self')}
                        {actionModal === 'withdraw' && t('profile.actions.withdraw_dialog_description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className={actionModal === 'withdraw' ? "hidden" : "space-y-4"}>
                    {actionModal === 'apply' && (
                        <ApplyForm
                            applyType={applyType}
                            setApplyType={setApplyType}
                            applyFee={applyFee}
                            setApplyFee={setApplyFee}
                            consents={consents}
                            setConsents={setConsents}
                            t={t}
                            configLinks={configLinks}
                        />
                    )}
                    {actionModal === 'cancel' && (
                        <div className="space-y-2 p-4 border rounded-md bg-muted/20">
                            <p className="text-sm">
                                <Trans
                                    i18nKey="profile.actions.cancel_dialog_info"
                                    values={{ date: calculateCancellationDate().toLocaleDateString(i18n.language) }}
                                    components={{ strong: <strong /> }}
                                />
                            </p>
                        </div>
                    )}
                    {actionModal === 'approve' && (
                        <div className="space-y-2">
                            <Label htmlFor="actionDate">{t('profile.actions.date_optional')}</Label>
                            <Input
                                id="actionDate"
                                type="date"
                                value={actionDate}
                                onChange={(e) => setActionDate(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground pt-1">
                                {(() => {
                                    const mDate = targetUser?.membership?.application_date;
                                    const dateStr = mDate ? new Date(mDate * 1000).toLocaleDateString(i18n.language) : "";
                                    return mDate ? t('profile.actions.date_hint_application', { date: dateStr }) : t('profile.actions.date_hint_today');
                                })()}
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-muted/20 py-4">
                    <Button variant="ghost" onClick={() => {
                        setActionModal(null);
                        setActionDate(isSelfView ? new Date().toISOString().split('T')[0] : "");
                    }} disabled={actionLoading}>
                        {t('club.details.actions.cancel')}
                    </Button>
                    <Button
                        variant={actionModal === 'deny' || actionModal === 'cancel' || actionModal === 'withdraw' ? 'destructive' : 'default'}
                        onClick={() => actionModal && handleMembershipAction(actionModal === 'withdraw' ? 'cancel' : actionModal)}
                        disabled={actionLoading || (actionModal === 'apply' && (!consents.privacy || !consents.accuracy || !consents.statutes || !consents.finances))}
                    >
                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {(() => {
                            if (actionModal === 'apply') return t('club.details.membership.apply_button', { defaultValue: 'Antrag stellen' });
                            if (actionModal === 'cancel') return t('profile.actions.cancel_membership');
                            if (actionModal === 'withdraw') return t('profile.actions.withdraw_application');
                            return t('club.details.membership.confirm');
                        })()}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
