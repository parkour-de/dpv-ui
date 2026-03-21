import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, ApiError } from "@/lib/api";
import { type Club, CLUB_STATUS_COLORS, type VorstandUser, type Census, type ActiveMembersResponse, type ActiveMemberMatch } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Trash2, AlertCircle, Save, FileText, Upload, Download, Loader2, UserPlus, UserMinus, User, UserKey, PenLine, PenOff } from "lucide-react";
import { cn, calculateCancellationDate } from "@/lib/utils";
import { PaymentDetails } from "@/components/payment-details";

export function ClubDetailsPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [ownerError, setOwnerError] = useState<string | null>(null);
    const [censusError, setCensusError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Document Interface
    interface Document {
        name: string;
        size: number;
        last_modified: number;
    }
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Owner management
    const [newOwnerEmail, setNewOwnerEmail] = useState("");
    const [ownerLoading, setOwnerLoading] = useState(false);

    // Edit State - Flat structure for API
    const [formData, setFormData] = useState<{
        name?: string;
        legal_form?: string;
        email?: string;
        address?: string;
        contact_person?: string;
        state?: string;
        registerNumber?: string;
        exemptionValidity?: string;
    }>({});

    // New Owner form
    const [newOwnerAuthRep, setNewOwnerAuthRep] = useState(false);
    const [editingOwner, setEditingOwner] = useState<Record<string, boolean>>({});

    // Modal state for Apply/Cancel/Approve with dates
    const [actionModal, setActionModal] = useState<'apply' | 'cancel' | 'approve' | null>(null);
    const [actionDate, setActionDate] = useState<string>('');
    const [consents, setConsents] = useState({
        privacy: false,
        accuracy: false,
        statutes: false,
        finances: false
    });

    // Census State
    const [censusDetails, setCensusDetails] = useState<Record<number, Census>>({});
    const [censusFetchErrors, setCensusFetchErrors] = useState<Record<number, string>>({});

    // Active Members State
    const [activeMembers, setActiveMembers] = useState<ActiveMembersResponse | null>(null);
    const [activeMembersLoading, setActiveMembersLoading] = useState(false);
    const [activeMembersError, setActiveMembersError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.roles?.includes('admin') || user?.roles?.includes('global_admin')) {
            setIsAdmin(true);
        }
    }, [user]);

    const fetchClub = useCallback(async () => {
        if (!id || !token) return;
        try {
            const data = await api.get<Club>(`/club/${id}`, token);
            setClub(data);
            // Initialize form data (without payment initially)
            setFormData(p => ({
                ...p,
                name: data.name,
                legal_form: data.legal_form,
                email: data.email,
                address: data.membership.address,
                contact_person: data.contact_person,
                state: data.state,
                registerNumber: data.registerNumber,
                exemptionValidity: data.exemptionValidity,
            }));
        } catch (err: unknown) {
            console.error("Failed to load club", err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('club.messages.load_error'));
            }
        } finally {
            setLoading(false);
        }
    }, [id, token, t]);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!id || !token) return;
            try {
                const docs = await api.get<Document[]>(`/club/${id}/documents`, token);
                setDocuments(docs);
            } catch (err) {
                console.error("Failed to load documents", err);
            }
        };

        fetchClub();
        fetchDocuments();
    }, [id, token, fetchClub]);

    const fetchActiveMembers = async () => {
        if (!id || !token) return;
        setActiveMembersLoading(true);
        setActiveMembersError(null);
        try {
            const data = await api.get<ActiveMembersResponse>(`/club/${id}/active-members`, token);
            setActiveMembers(data);
        } catch (err: unknown) {
            console.error("Failed to load active members", err);
            if (err instanceof ApiError && err.data?.message) {
                setActiveMembersError(err.data.message);
            } else {
                setActiveMembersError(t('club.messages.load_error'));
            }
        } finally {
            setActiveMembersLoading(false);
        }
    };

    // Toggle view handler

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!id || !token || !selectedFile) return;
        setUploading(true);
        setUploadError(null);
        const formData = new FormData();
        formData.append("document", selectedFile);

        try {
            await api.upload(`/club/${id}/documents`, formData, token);
            setSelectedFile(null);
            // Refresh documents
            const docs = await api.get<Document[]>(`/club/${id}/documents`, token);
            setDocuments(docs);
            const fileInput = document.getElementById('document-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setUploadError(err.data.message);
            } else {
                setUploadError(t('club.messages.upload_error'));
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (filename: string) => {
        if (!id || !token) return;
        setUploadError(null);
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || '/dpv';
            const res = await fetch(`${API_BASE}/club/${id}/documents/${filename}`, {
                headers: { 'Authorization': `Basic ${token}` }
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new ApiError(res.status, res.statusText, errorData);
            }

            const blob = await res.blob();
            const url = globalThis.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            globalThis.URL.revokeObjectURL(url);
            a.remove();
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setUploadError(err.data.message);
            } else {
                setUploadError(t('club.messages.download_error'));
            }
        }
    };

    const handleDownloadAll = async () => {
        if (!id || !token) return;
        setUploadError(null);
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || '/dpv';
            const res = await fetch(`${API_BASE}/club/${id}/download-documents`, {
                headers: { 'Authorization': `Basic ${token}` }
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new ApiError(res.status, res.statusText, errorData);
            }

            const blob = await res.blob();
            const url = globalThis.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${club?.name || 'club'}-documents.zip`;
            document.body.appendChild(a);
            a.click();
            globalThis.URL.revokeObjectURL(url);
            a.remove();
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setUploadError(err.data.message);
            } else {
                setUploadError(t('club.messages.download_error'));
            }
        }
    };

    const handleAction = async (action: 'approve' | 'deny' | 'apply' | 'cancel', extraData?: Record<string, unknown>) => {
        if (!id || !token) return;
        setFormLoading(true);
        setActionError(null);
        try {
            await api.post(`/club/${id}/${action}`, extraData || {}, token);
            await fetchClub(); // refresh
            setActionModal(null);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setActionError(err.data.message);
            } else {
                setActionError(t('club.messages.action_error'));
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleActionWithDate = () => {
        if (!actionModal) return;

        if (actionModal === 'apply') {
            handleAction('apply', {
                consent_privacy: consents.privacy,
                consent_accuracy: consents.accuracy,
                consent_statutes: consents.statutes,
                consent_finances: consents.finances
            });
        } else if (actionModal === 'cancel') {
            handleAction('cancel');
        } else if (actionModal === 'approve') {
            const extraData: Record<string, unknown> = {};
            if (actionDate) {
                const parts = actionDate.split('-');
                if (parts.length === 3) {
                    const date = new Date(Date.UTC(Number.parseInt(parts[0]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[2])));
                    extraData.begin_date = Math.floor(date.getTime() / 1000);
                }
            }
            handleAction('approve', extraData);
        }
    };

    const handleDeleteDocument = async (filename: string) => {
        if (!id || !token) return;
        if (!confirm(t('club.messages.delete_confirm'))) return;

        try {
            await api.delete(`/club/${id}/documents/${filename}`, token);
            // Refresh documents
            const docs = await api.get<Document[]>(`/club/${id}/documents`, token);
            setDocuments(docs);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setUploadError(err.data.message);
            } else {
                setUploadError(t('club.messages.action_error'));
            }
        }
    };

    // Owner Actions
    const handleAddOwner = async () => {
        if (!id || !token || !newOwnerEmail) return;
        setOwnerLoading(true);
        setOwnerError(null);
        try {
            await api.post(`/club/${id}/owners`, { email: newOwnerEmail, authorizedRepresentative: newOwnerAuthRep }, token);
            setNewOwnerEmail("");
            setNewOwnerAuthRep(false);
            await fetchClub();
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setOwnerError(err.data.message);
            } else {
                setOwnerError(t('club.messages.action_error'));
            }
        } finally {
            setOwnerLoading(false);
        }
    };

    const handleRemoveOwner = async (userKey: string) => {
        if (!id || !token) return;
        if (!confirm(t('club.messages.remove_owner_confirm'))) return;
        setOwnerLoading(true);
        setOwnerError(null);
        try {
            await api.delete(`/club/${id}/owners/${userKey}`, token);
            await fetchClub();
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setOwnerError(err.data.message);
            } else {
                setOwnerError(t('club.messages.action_error'));
            }
        } finally {
            setOwnerLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !token) return;
        if (!confirm(t('club.messages.delete_confirm'))) return;

        setFormLoading(true);
        setActionError(null);
        try {
            await api.delete(`/club/${id}`, token);
            navigate("/dashboard");
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setActionError(err.data.message);
            } else {
                setActionError(t('club.messages.action_error'));
            }
            setFormLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !token) return;
        setFormLoading(true);
        setFormError(null);
        try {
            await api.patch<Club>(`/club/${id}`, formData, token);
            await fetchClub();
            setIsEditing(false);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setFormError(err.data.message);
            } else {
                setFormError(t('club.messages.save_error'));
            }
        } finally {
            setFormLoading(false);
        }
    };

    const formatDate = (unixSeconds: number) => {
        return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderHeader = () => {
        if (!club) return null;

        const { status, begin_date, end_date } = club.membership;
        const now = Math.floor(Date.now() / 1000);
        let labelKey = `club.status.${status}`;
        if (status === 'active' && begin_date && begin_date > now) {
            labelKey = 'club.status.upcoming_membership';
        } else if (status === 'cancelled' && end_date && end_date > now) {
            labelKey = 'club.status.pending_cancellation';
        }

        return (
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", CLUB_STATUS_COLORS[club.membership.status])}>
                            {t(labelKey)}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 ml-6 font-mono">
                        {club.membership.begin_date ? (
                            <span>{t('club.status.active')} seit {new Date(club.membership.begin_date * 1000).toLocaleDateString()}</span>
                        ) : null}
                        {club.membership.end_date ? (
                            <span className="font-bold text-destructive">Gekündigt zum {new Date(club.membership.end_date * 1000).toLocaleDateString()}</span>
                        ) : null}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <>
                            {club.membership.status === 'active' || club.membership.status === 'requested' ? (
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => {
                                    if (club.membership.status === 'requested') {
                                        handleAction('cancel');
                                    } else {
                                        setActionModal('cancel');
                                    }
                                }} disabled={formLoading}>
                                    {club.membership.status === 'active' ? t('club.details.membership.cancel') : t('club.details.membership.withdraw')}
                                </Button>
                            ) : (
                                <Button size="sm" onClick={() => {
                                    if (!club.vorstand?.some(m => m.authorizedRepresentative)) {
                                        setActionError(t('club.messages.needs_authorized_rep', 'Mindestens ein Vorstandsmitglied muss nach §26 BGB vertretungsberechtigt sein.'));
                                        return;
                                    }
                                    setActionModal('apply');
                                }} disabled={formLoading}>
                                    {(club.membership.status === 'cancelled' || club.membership.status === 'denied')
                                        ? t('club.details.membership.reapply')
                                        : t('club.details.membership.apply')}
                                </Button>
                            )}
                            {isAdmin && club.membership.status === 'requested' && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => { setActionDate(''); setActionModal('approve'); }} disabled={formLoading}>
                                        <Check className="mr-2 h-4 w-4" /> {t('club.details.membership.approve')}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleAction('deny')} disabled={formLoading}>
                                        <X className="mr-2 h-4 w-4" /> {t('club.details.membership.deny')}
                                    </Button>
                                </div>
                            )}
                            <Button size="sm" variant="outline" onClick={() => {
                                setIsEditing(true);
                                setFormError(null);
                            }}>
                                {t('club.details.actions.edit')}
                            </Button>
                            {!(club.membership.status === 'active' || club.membership.status === 'requested' || club.membership.status === 'cancelling') && (
                                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={formLoading}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderDocuments = () => {
        if (!club) return null;
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('club.documents.title')}</CardTitle>
                        <CardDescription>{t('club.documents.description')}</CardDescription>
                    </div>
                    {documents.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                            <Download className="h-4 w-4 mr-2" /> {t('club.documents.download_all')}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {uploadError && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <p>{uploadError}</p>
                        </div>
                    )}
                    {documents.length > 0 ? (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div key={doc.name} className="flex items-center justify-between p-3 border rounded-md bg-muted/10 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">{doc.name}</div>
                                            <div className="text-xs text-muted-foreground flex gap-3">
                                                <span>{doc.size} KiB</span>
                                                <span className="text-muted-foreground/50">|</span>
                                                <span>{formatDate(doc.last_modified)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.name)} title="Herunterladen">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        {(isAdmin || (club.membership.status !== 'requested' && club.membership.status !== 'active')) && (
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteDocument(doc.name)} title="Löschen">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                            {t('club.documents.empty')}
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="document-upload">{t('club.documents.upload_label')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="document-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                    className="cursor-pointer"
                                />
                                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderVerbandData = () => {
        if (!club || !isAdmin) return null;
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verbandsdaten</CardTitle>
                    <CardDescription>Diese Informationen können nur von Administratoren eingesehen werden.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Landesverband</Label>
                            <Input value={club.state || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Registernummer</Label>
                            <Input value={club.registerNumber || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Gemeinnützigkeit gültig bis</Label>
                            <Input value={club.exemptionValidity || ''} disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderVorstandManagement = () => {
        if (!club) return null;
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('club.owners.title')}</CardTitle>
                    <CardDescription>{t('club.owners.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {ownerError && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <p>{ownerError}</p>
                        </div>
                    )}
                    {club.vorstand && club.vorstand.length > 0 ? (
                        <ul className="space-y-2">
                            {club.vorstand.map((member: VorstandUser) => (
                                <li key={member._key} className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 p-1.5 rounded-full">
                                            {member.authorizedRepresentative ? <UserKey className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{member.firstname} {member.lastname}</p>
                                            {member.email && (
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            )}
                                            {member.authorizedRepresentative && (
                                                <span className="text-xs text-muted-foreground">{t('club.owners.labels.authorizedRepresentative')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.email && editingOwner[member._key] && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn("h-8 text-xs", member.authorizedRepresentative && "bg-primary/10")}
                                                onClick={async () => {
                                                    setOwnerLoading(true);
                                                    try {
                                                        await api.post(`/club/${id}/owners`, { email: member.email, authorizedRepresentative: !member.authorizedRepresentative }, token || "");
                                                        await fetchClub();
                                                    } catch (err) {
                                                        console.error(err);
                                                        setOwnerError(t('club.messages.action_error'));
                                                    } finally {
                                                        setOwnerLoading(false);
                                                    }
                                                }}
                                                disabled={ownerLoading}
                                                title="Toggle §26 BGB"
                                            >
                                                {t('club.owners.labels.authorizedRepresentative')}
                                            </Button>
                                        )}

                                        {member.email && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-primary"
                                                onClick={() => setEditingOwner(prev => ({ ...prev, [member._key]: !prev[member._key] }))}
                                                title="Bearbeiten"
                                            >
                                                {editingOwner[member._key] ? <PenOff className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveOwner(member._key)}
                                            disabled={ownerLoading}
                                            title="Entfernen"
                                        >
                                            <UserMinus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('club.owners.empty')}</p>
                    )}

                    <div className="flex gap-2 pt-4 border-t flex-wrap items-center">
                        <Input
                            placeholder={t('club.owners.add_placeholder')}
                            className="max-w-xs"
                            value={newOwnerEmail}
                            onChange={(e) => setNewOwnerEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOwner(); } }}
                        />
                        <label className="flex items-center gap-2 text-sm cursor-pointer ml-2">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={newOwnerAuthRep}
                                onChange={(e) => setNewOwnerAuthRep(e.target.checked)}
                            />
                            {t('club.owners.labels.authorizedRepresentative')}
                        </label>
                        <Button onClick={handleAddOwner} disabled={!newOwnerEmail || ownerLoading}>
                            {ownerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderCensusSection = () => {
        if (!club) return null;
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('club.census.title')}</CardTitle>
                        <CardDescription>{t('club.census.description')}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                        const API_BASE = globalThis.window?.location?.origin || '';
                        globalThis.location.href = `${API_BASE}/dpv/census/sample`;
                    }}>
                        <Download className="h-4 w-4 mr-2" /> {t('club.census.download_sample')}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {censusError && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <p>{censusError}</p>
                        </div>
                    )}
                    <div className="space-y-4 border-b pb-4">
                        <div className="flex items-end gap-2">
                            <div className="space-y-2 flex-grow">
                                <Label htmlFor="census-year">{t('club.census.upload_year_label')}</Label>
                                <Input
                                    id="census-year"
                                    type="number"
                                    placeholder="YYYY"
                                    defaultValue={new Date().getFullYear()}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2 flex-grow-[2]">
                                <Label htmlFor="census-file">{t('club.census.upload_file_label')}</Label>
                                <Input id="census-file" type="file" />
                            </div>
                            <Button
                                onClick={async () => {
                                    const yearInput = document.getElementById('census-year') as HTMLInputElement;
                                    const fileInput = document.getElementById('census-file') as HTMLInputElement;
                                    if (!yearInput.value || !fileInput.files?.[0]) return;

                                    const yearValue = Number.parseInt(yearInput.value);

                                    if (club?.census?.some(c => c.year === yearValue)) {
                                        const confirmMessage = t('club.census.confirm_overwrite', { year: yearValue });
                                        if (!globalThis.confirm(confirmMessage)) {
                                            return;
                                        }
                                    }

                                    setUploading(true);
                                    setCensusError(null);
                                    const formData = new FormData();
                                    formData.append("file", fileInput.files[0]);
                                    try {
                                        await api.uploadPut(`/club/${id}/census/${yearInput.value}`, formData, token || "");
                                        fileInput.value = '';
                                        await fetchClub();
                                    } catch (err: unknown) {
                                        console.error(err);
                                        if (err instanceof ApiError && err.data?.message) {
                                            setCensusError(err.data.message);
                                        } else {
                                            setCensusError(t('club.messages.upload_error'));
                                        }
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                                disabled={uploading}
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {club.census && club.census.length > 0 ? (
                        <div className="space-y-2">
                            {club.census.sort((a, b) => b.year - a.year).map((c) => (
                                <div key={c.year} className="border rounded-md">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-between h-auto p-3 font-normal hover:bg-muted/10"
                                        onClick={async () => {
                                            const content = document.getElementById(`census-content-${c.year}`);
                                            if (content) {
                                                const isHidden = content.classList.contains('hidden');
                                                if (isHidden) {
                                                    content.classList.remove('hidden');
                                                    if (!censusDetails[c.year] && !censusFetchErrors[c.year]) {
                                                        try {
                                                            const data = await api.get<Census>(`/club/${id}/census/${c.year}`, token || "");
                                                            setCensusDetails(prev => ({ ...prev, [c.year]: data }));
                                                            setCensusFetchErrors(prev => {
                                                                const updated = { ...prev };
                                                                delete updated[c.year];
                                                                return updated;
                                                            });
                                                        } catch (err: unknown) {
                                                            console.error(err);
                                                            if (err instanceof ApiError && err.data?.message) {
                                                                setCensusFetchErrors(prev => ({ ...prev, [c.year]: err.data?.message || t('club.messages.load_error') }));
                                                            } else {
                                                                setCensusFetchErrors(prev => ({ ...prev, [c.year]: t('club.messages.load_error') }));
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    content.classList.add('hidden');
                                                }
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="font-semibold">{c.year}</div>
                                            <div className="text-sm text-muted-foreground">{c.count} {t('club.census.members_count')}</div>
                                        </div>
                                    </Button>
                                    <div id={`census-content-${c.year}`} className="hidden p-3 border-t bg-muted/5">
                                        {censusFetchErrors[c.year] ? (
                                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                                <AlertCircle className="h-4 w-4" />
                                                <p>{censusFetchErrors[c.year]}</p>
                                            </div>
                                        ) : censusDetails[c.year] ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b text-left">
                                                            <th className="py-2 px-1">{t('club.census.header.firstname')}</th>
                                                            <th className="py-2 px-1">{t('club.census.header.lastname')}</th>
                                                            <th className="py-2 px-1">{t('club.census.header.birthdate')}</th>
                                                            <th className="py-2 px-1">{t('club.census.header.gender')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {censusDetails[c.year].members.map((m, idx) => (
                                                            <tr key={`${c.year}-${idx}`} className="border-b last:border-0 hover:bg-muted/10">
                                                                <td className="py-1 px-1">{m.firstname}</td>
                                                                <td className="py-1 px-1">{m.lastname}</td>
                                                                <td className="py-1 px-1">{m.birthDate}</td>
                                                                <td className="py-1 px-1">{m.gender}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            {t('club.census.empty')}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderActiveMembersReview = () => {
        if (!isAdmin || !club) return null;
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('club.active_members.title')}</CardTitle>
                        <CardDescription>{t('club.active_members.description')}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchActiveMembers} disabled={activeMembersLoading}>
                        {activeMembersLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {t('club.active_members.refresh')}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {activeMembersError && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <p>{activeMembersError}</p>
                        </div>
                    )}
                    {!activeMembers && !activeMembersLoading && !activeMembersError && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            {t('club.active_members.click_to_load')}
                        </div>
                    )}
                    {activeMembers && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm flex items-center justify-between">
                                    <span>{t('club.active_members.exact_matches')}</span>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{activeMembers.exact_matches.length}</span>
                                </h3>
                                {activeMembers.exact_matches.length > 0 ? (
                                    <div className="rounded-md border divide-y">
                                        {activeMembers.exact_matches.map((match: ActiveMemberMatch, idx: number) => (
                                            <div key={`${match.user?._key}-${idx}`} className="p-3 flex items-center justify-between hover:bg-muted/10">
                                                <div>
                                                    <div className="font-medium">{match.user?.firstname} {match.user?.lastname}</div>
                                                    <div className="text-xs text-muted-foreground flex gap-2">
                                                        <span>{match.user?.email}</span>
                                                        <span>•</span>
                                                        <span>{match.user?.dateOfBirth && new Date(match.user.dateOfBirth).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link to={`/user/${match.user?._key}`}>
                                                        <Button variant="outline" size="sm" title="Profil anzeigen">
                                                            <User className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground pl-2">{t('club.active_members.none')}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm flex items-center justify-between">
                                    <span>{t('club.active_members.partial_matches')}</span>
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{activeMembers.partial_matches.length}</span>
                                </h3>
                                {activeMembers.partial_matches.length > 0 ? (
                                    <div className="rounded-md border divide-y">
                                        {activeMembers.partial_matches.map((match: ActiveMemberMatch, idx: number) => (
                                            <div key={`${match.user?._key}-${idx}`} className="p-3 flex items-center justify-between hover:bg-muted/10">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                        {match.user?.firstname} {match.user?.lastname}
                                                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">{match.match_type}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex gap-2">
                                                        <span>{match.user?.email}</span>
                                                        {match.user?.dateOfBirth && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Portal DOB: {new Date(match.user.dateOfBirth).toLocaleDateString()}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {match.census_name && (
                                                        <div className="text-xs text-amber-600/80">
                                                            Bestandserhebung: {match.census_name} {match.census_dob && `(${match.census_dob})`}
                                                        </div>
                                                    )}
                                                    {match.portal_your_club && !match.census_name && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Angegeben in Dein Verein: "{match.portal_your_club}"
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link to={`/user/${match.user?._key}`}>
                                                        <Button variant="outline" size="sm" title="Profil anzeigen">
                                                            <User className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground pl-2">{t('club.active_members.none')}</p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderActionModal = () => {
        if (!actionModal) return null;
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader>
                        <CardTitle>
                            {actionModal === 'apply' ? t('club.details.membership.apply') : actionModal === 'cancel' ? t('club.details.membership.cancel') : t('club.details.membership.approve')}
                        </CardTitle>
                        <CardDescription>
                            {actionModal === 'apply'
                                ? t('club.details.membership.apply_description', { defaultValue: "Please select if you want to become a member." })
                                : actionModal === 'cancel'
                                    ? t('profile.actions.cancel_info_prefix', { defaultValue: "Cancel membership:" })
                                    : t('club.details.membership.approve_description', { defaultValue: "Specify the start date (optional):" })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {actionModal === 'approve' ? (
                            <div className="space-y-2">
                                <Label htmlFor="actionDate">{t('club.details.membership.date_label', { defaultValue: "Date (Optional)" })}</Label>
                                <Input
                                    id="actionDate"
                                    type="date"
                                    value={actionDate}
                                    onChange={(e) => setActionDate(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground pt-1">
                                    {(() => {
                                        const mDate = club?.membership?.application_date;
                                        const dateStr = mDate ? new Date(mDate * 1000).toLocaleDateString() : "";
                                        return `Falls leer, wird das Datum ${mDate ? ` aus dem Antrag übernommen (${dateStr})` : ` von heute verwendet`} .`;
                                    })()}
                                </p>
                            </div>
                        ) : actionModal === 'cancel' ? (
                            <div className="space-y-2 p-4 border rounded-md bg-muted/20">
                                <p className="text-sm">
                                    {t('club.details.membership.cancel_info_prefix', { defaultValue: "Wenn Sie jetzt kündigen, endet die Mitgliedschaft zum" })}
                                    {" "}
                                    <strong>{calculateCancellationDate().toLocaleDateString('de-DE')}</strong>.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2">
                                {[
                                    { id: 'privacy', key: 'club.details.membership.consent_privacy', def: 'Ich stimme der Datenschutzerklärung zu.' },
                                    { id: 'accuracy', key: 'club.details.membership.consent_accuracy', def: 'Ich versichere, dass meine Angaben der Wahrheit entsprechen.' },
                                    { id: 'statutes', href: '/satzung', label: 'Ich habe die Satzung gelesen und erkenne sie an.' },
                                    { id: 'finances', href: '/beitragsordnung', label: 'Ich habe die Beitragsordnung gelesen und erkenne sie an.' }
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
                                            {item.key ? t(item.key, { defaultValue: item.def }) : (
                                                <>
                                                    {item.label?.split(item.id === 'statutes' ? 'Satzung' : 'Beitragsordnung')[0]}
                                                    <Link to={item.href!} target="_blank" className="underline text-blue-600">
                                                        {item.id === 'statutes' ? 'Satzung' : 'Beitragsordnung'}
                                                    </Link>
                                                    {item.label?.split(item.id === 'statutes' ? 'Satzung' : 'Beitragsordnung')[1]}
                                                </>
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => setActionModal(null)}>
                            {t('club.details.actions.cancel')}
                        </Button>
                        <Button
                            onClick={handleActionWithDate}
                            disabled={formLoading || (actionModal === 'apply' && (!consents.privacy || !consents.accuracy || !consents.statutes || !consents.finances))}
                        >
                            {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {actionModal === 'apply' ? t('club.details.membership.apply_button', { defaultValue: 'Antrag stellen' }) : t('club.details.membership.confirm', { defaultValue: "Confirm" })}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    };

    if (loading) return <div className="text-center py-12">{t('club.messages.loading')}</div>;
    if (!club) return <div className="text-center py-12">{t('club.messages.not_found')}</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {renderHeader()}

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            {actionError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <p>{actionError}</p>
                </div>
            )}

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('club.details.title')}</CardTitle>
                        <CardDescription>{t('club.details.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {formError && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <p>{formError}</p>
                            </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { id: 'name', label: 'club.details.labels.name', locked: club.membership.status !== 'inactive' && !isAdmin },
                                { id: 'legal_form', label: 'club.details.labels.legal_form', locked: club.membership.status !== 'inactive' && !isAdmin },
                                { id: 'email', label: 'club.details.labels.email' },
                                { id: 'address', label: 'club.details.labels.address' },
                                { id: 'contact_person', label: 'club.details.labels.contact_person' },
                                { id: 'state', label: 'club.details.labels.state' },
                                { id: 'registerNumber', label: 'club.details.labels.registerNumber', locked: club.membership.status !== 'inactive' && !isAdmin },
                                { id: 'exemptionValidity', label: 'club.details.labels.exemptionValidity', placeholder: 'e.g. 31.05.2027' }
                            ].map(field => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id} className={field.locked ? 'text-muted-foreground' : ''}>
                                        {t(field.label)}
                                        {field.locked && <span className="ml-2 text-xs">(Gesperrt)</span>}
                                    </Label>
                                    <Input
                                        id={field.id}
                                        value={formData[field.id as keyof typeof formData] || ''}
                                        onChange={(e) => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                                        disabled={!isEditing || field.locked}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {isEditing && (
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => {
                            setIsEditing(false);
                            setFormError(null);
                            setFormData({
                                name: club.name,
                                legal_form: club.legal_form,
                                email: club.email,
                                address: club.membership.address,
                                contact_person: club.contact_person,
                                state: club.state,
                                registerNumber: club.registerNumber,
                                exemptionValidity: club.exemptionValidity
                            });
                        }}>
                            {t('club.details.actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                            <Save className="mr-2 h-4 w-4" /> {t('club.details.actions.save')}
                        </Button>
                    </div>
                )}
            </form>

            {!isEditing && (
                <>
                    {renderDocuments()}
                    <div className="mt-6 mb-6">
                        <PaymentDetails
                            token={token || ""}
                            fetchUrl={`/club/${id}/payment-details`}
                            patchUrl={`/club/${id}`}
                            isAdmin={isAdmin}
                            canEdit={true}
                            alwaysOpen={false}
                        />
                    </div>
                    {renderVerbandData()}
                    {renderVorstandManagement()}
                    {renderCensusSection()}
                    {renderActiveMembersReview()}
                </>
            )}

            {renderActionModal()}
        </div>
    );
}
