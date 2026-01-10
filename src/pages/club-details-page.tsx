import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { api, ApiError } from "@/lib/api";
import { type Club, CLUB_STATUS_COLORS, type VorstandUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Trash2, AlertCircle, Save, FileText, Upload, Download, Loader2, UserPlus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClubDetailsPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    // Payment details state
    // We merge these into formData when editing, but keep them for view mode
    const [viewPaymentDetails, setViewPaymentDetails] = useState<{ iban: string; sepa_mandate_number?: string } | null>(null);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

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
        iban?: string;
        sepa_mandate_number?: string;
    }>({});

    useEffect(() => {
        if (user?.roles?.includes('admin') || user?.roles?.includes('global_admin')) {
            setIsAdmin(true);
        }
    }, [user]);

    const fetchClub = useCallback(async () => {
        if (!id || !token) return;
        try {
            const data = await api.get<Club>(`/clubs/${id}`, token);
            setClub(data);
            // Initialize form data (without payment initially)
            setFormData(p => ({
                ...p,
                name: data.name,
                legal_form: data.legal_form,
                email: data.email,
                address: data.membership.address,
                contact_person: data.contact_person,
            }));
        } catch (err) {
            console.error("Failed to load club", err);
            setError(t('club.messages.load_error'));
        } finally {
            setLoading(false);
        }
    }, [id, token, t]);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!id || !token) return;
            try {
                const docs = await api.get<Document[]>(`/clubs/${id}/documents`, token);
                setDocuments(docs);
            } catch (err) {
                console.error("Failed to load documents", err);
            }
        };

        fetchClub();
        fetchDocuments();
    }, [id, token, fetchClub]);

    // Fetch payment details helper
    const fetchPayment = useCallback(async () => {
        if (!id || !token) return null;
        try {
            const details = await api.get<{ iban: string; sepa_mandate_number?: string }>(`/clubs/${id}/payment-details`, token);
            setViewPaymentDetails(details);
            return details;
        } catch (err) {
            console.error(err);
            // Ignore error if 403 or similar in some cases, but generally warn
            // actually invalid permission might occur if not admin/owner
            return null;
        }
    }, [id, token]);

    // When entering edit mode, ensure we have payment details
    useEffect(() => {
        if (isEditing && id && token) {
            setLoadingPayment(true);
            fetchPayment().then(details => {
                if (details) {
                    setFormData(prev => ({
                        ...prev,
                        iban: details.iban,
                        sepa_mandate_number: details.sepa_mandate_number
                    }));
                }
                setLoadingPayment(false);
            });
        }
    }, [isEditing, id, token, fetchPayment]);

    // Toggle view handler
    const handleShowPaymentDetails = async () => {
        if (!showPaymentDetails && !viewPaymentDetails) {
            setLoadingPayment(true);
            await fetchPayment();
            setLoadingPayment(false);
        }
        setShowPaymentDetails(!showPaymentDetails);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!id || !token || !selectedFile) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("document", selectedFile);

        try {
            await api.upload(`/clubs/${id}/documents`, formData, token);
            setSelectedFile(null);
            // Refresh documents
            const docs = await api.get<Document[]>(`/clubs/${id}/documents`, token);
            setDocuments(docs);
            const fileInput = document.getElementById('document-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err) {
            console.error(err);
            setError(t('club.messages.upload_error'));
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (filename: string) => {
        if (!id || !token) return;
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/dpv';
            const res = await fetch(`${API_BASE}/clubs/${id}/documents/${filename}`, {
                headers: { 'Authorization': `Basic ${token}` }
            });
            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            setError(t('club.messages.download_error'));
        }
    };

    const handleDownloadAll = async () => {
        if (!id || !token) return;
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/dpv';
            const res = await fetch(`${API_BASE}/clubs/${id}/download-documents`, {
                headers: { 'Authorization': `Basic ${token}` }
            });
            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${club?.name || 'club'}-documents.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            setError(t('club.messages.download_error'));
        }
    };

    const handleAction = async (action: 'approve' | 'deny' | 'apply' | 'cancel') => {
        if (!id || !token) return;
        setFormLoading(true);
        try {
            await api.post(`/clubs/${id}/${action}`, {}, token);
            await fetchClub(); // refresh
        } catch (err) {
            console.error(err);
            setError(t('club.messages.action_error'));
        } finally {
            setFormLoading(false);
        }
    };

    // Owner Actions
    const handleAddOwner = async () => {
        if (!id || !token || !newOwnerEmail) return;
        setOwnerLoading(true);
        try {
            await api.post(`/clubs/${id}/owners`, { email: newOwnerEmail }, token);
            setNewOwnerEmail("");
            await fetchClub();
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('club.messages.action_error'));
            }
        } finally {
            setOwnerLoading(false);
        }
    };

    const handleRemoveOwner = async (userKey: string) => {
        if (!id || !token) return;
        if (!confirm(t('club.messages.remove_owner_confirm'))) return;
        setOwnerLoading(true);
        try {
            await api.delete(`/clubs/${id}/owners/${userKey}`, token);
            await fetchClub();
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('club.messages.action_error'));
            }
        } finally {
            setOwnerLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !token) return;
        if (!confirm(t('club.messages.delete_confirm'))) return;

        setFormLoading(true);
        try {
            await api.delete(`/clubs/${id}`, token);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            setError(t('club.messages.action_error'));
            setFormLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !token) return;
        setFormLoading(true);
        try {
            await api.patch<Club>(`/clubs/${id}`, formData, token);
            await fetchClub();
            setIsEditing(false);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError(t('club.messages.save_error'));
            }
        } finally {
            setFormLoading(false);
        }
    };

    const formatDate = (unixSeconds: number) => {
        // Use i18n language for date formatting if possible, else default to de-DE or use i18next-browser-languagedetector
        return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="text-center py-12">{t('club.messages.loading')}</div>;
    if (!club) return <div className="text-center py-12">{t('club.messages.not_found')}</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CLUB_STATUS_COLORS[club.membership.status])}>
                        {t(`club.status.${club.membership.status}`)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <>
                            {(club.membership.status === 'inactive' || club.membership.status === 'cancelled') && (
                                <Button size="sm" onClick={() => handleAction('apply')} disabled={formLoading}>
                                    {club.membership.status === 'cancelled' ? t('club.details.membership.reapply') : t('club.details.membership.apply')}
                                </Button>
                            )}
                            {(club.membership.status === 'requested' || club.membership.status === 'active') && !isAdmin && (
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleAction('cancel')} disabled={formLoading}>
                                    {club.membership.status === 'active' ? t('club.details.membership.cancel') : t('club.details.membership.withdraw')}
                                </Button>
                            )}
                            {isAdmin && (
                                <>
                                    {(club.membership.status === 'inactive' || club.membership.status === 'cancelled') && (
                                        <Button size="sm" onClick={() => handleAction('apply')} disabled={formLoading}>
                                            {t('club.details.membership.apply')}
                                        </Button>
                                    )}
                                    {(club.membership.status === 'requested' || club.membership.status === 'active') && (
                                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleAction('cancel')} disabled={formLoading}>
                                            {club.membership.status === 'active' ? t('club.details.membership.cancel') : t('club.details.membership.withdraw')}
                                        </Button>
                                    )}
                                    {club.membership.status === 'requested' && (
                                        <>
                                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('approve')} disabled={formLoading}>
                                                <Check className="mr-2 h-4 w-4" /> {t('club.details.membership.approve')}
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleAction('deny')} disabled={formLoading}>
                                                <X className="mr-2 h-4 w-4" /> {t('club.details.membership.deny')}
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                {t('club.details.actions.edit')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={formLoading}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('club.details.title')}</CardTitle>
                        <CardDescription>{t('club.details.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('club.details.labels.name')}</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="legal_form">{t('club.details.labels.legal_form')}</Label>
                                <Input
                                    id="legal_form"
                                    value={formData.legal_form || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, legal_form: e.target.value }))}
                                    disabled={!isEditing}
                                    placeholder="e.g. e.V."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('club.details.labels.email')}</Label>
                                <Input
                                    id="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">{t('club.details.labels.address')}</Label>
                                <Input
                                    id="address"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_person">{t('club.details.labels.contact_person')}</Label>
                                <Input
                                    id="contact_person"
                                    value={formData.contact_person || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, contact_person: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </CardContent>

                </Card>

                {/* Payment Details in Form or Separate? If editing, we show fields here. */}
                {isEditing ? (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{t('club.payment.edit_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loadingPayment ? (
                                <div className="text-sm">{t('club.messages.loading_payment')}</div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="iban">{t('club.payment.labels.iban')}</Label>
                                        <Input
                                            id="iban"
                                            value={formData.iban || ''}
                                            onChange={(e) => setFormData(p => ({ ...p, iban: e.target.value }))}
                                            placeholder="DE..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sepa">{t('club.payment.labels.sepa')}</Label>
                                        <Input
                                            id="sepa"
                                            value={formData.sepa_mandate_number || ''}
                                            onChange={(e) => setFormData(p => ({ ...p, sepa_mandate_number: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-end gap-2 bg-muted/20 py-4">
                            <Button type="button" variant="ghost" onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    name: club.name,
                                    legal_form: club.legal_form,
                                    email: club.email,
                                    address: club.membership.address,
                                    contact_person: club.contact_person,
                                    // Reset payment fields
                                    iban: undefined,
                                    sepa_mandate_number: undefined
                                });
                            }}>
                                {t('club.details.actions.cancel')}
                            </Button>
                            <Button type="submit" disabled={formLoading || loadingPayment}>
                                <Save className="mr-2 h-4 w-4" /> {t('club.details.actions.save')}
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    /* View Mode: Documents & Payment & Owners Cards */
                    null
                )}
            </form>

            {/* If NOT editing, show these cards */}
            {!isEditing && (
                <>
                    {/* Documents */}
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
                                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.name)} title="Herunterladen">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                                    {t('club.documents.empty')}
                                </div>
                            )}

                            {/* Upload Section */}
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

                    {/* Payment Details (View Only) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('club.payment.title')}</CardTitle>
                            <CardDescription>{t('club.payment.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!showPaymentDetails ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleShowPaymentDetails}
                                    disabled={loadingPayment}
                                >
                                    {loadingPayment ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {t('club.payment.show')}
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>{t('club.payment.labels.iban')}</Label>
                                        <Input
                                            value={viewPaymentDetails?.iban || ''}
                                            disabled
                                            className="bg-muted font-mono"
                                            placeholder={t('club.payment.no_iban')}
                                        />
                                        {isAdmin && viewPaymentDetails?.sepa_mandate_number && (
                                            <div className="mt-2 space-y-2">
                                                <Label>{t('club.payment.labels.sepa')}</Label>
                                                <Input
                                                    value={viewPaymentDetails.sepa_mandate_number}
                                                    disabled
                                                    className="bg-muted"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPaymentDetails(false)}
                                    >
                                        {t('club.payment.hide')}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vorstand / Owners */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('club.owners.title')}</CardTitle>
                            <CardDescription>{t('club.owners.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {club.vorstand && club.vorstand.length > 0 ? (
                                <ul className="space-y-2">
                                    {club.vorstand.map((member: VorstandUser) => (
                                        <li key={member._key} className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 p-1.5 rounded-full">
                                                    <FileText className="h-4 w-4 text-primary" /> {/* User Icon better? */}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{member.firstname} {member.lastname}</p>
                                                    {/* Start: Removed ID display as it's not user friendly */}
                                                </div>
                                            </div>
                                            {/* Actions for owner */}
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
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('club.owners.empty')}</p>
                            )}

                            <div className="flex gap-2 pt-4 border-t">
                                <Input
                                    placeholder={t('club.owners.add_placeholder')}
                                    value={newOwnerEmail}
                                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOwner(); } }}
                                />
                                <Button onClick={handleAddOwner} disabled={!newOwnerEmail || ownerLoading}>
                                    {ownerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div >
    );
}
