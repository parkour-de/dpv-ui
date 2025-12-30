import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context-core";
import { api, ApiError } from "@/lib/api";
import { type Club, CLUB_STATUS_COLORS, CLUB_STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Trash2, AlertCircle, Save, FileText, Upload, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClubDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [documents, setDocuments] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Edit State - Flat structure for API
    const [formData, setFormData] = useState<{
        name?: string;
        legal_form?: string;
        email?: string;
        address?: string;
        contact_person?: string;
        iban?: string;
    }>({});

    useEffect(() => {
        if (user?.roles?.includes('admin') || user?.roles?.includes('global_admin')) {
            setIsAdmin(true);
        }
    }, [user]);

    useEffect(() => {
        const fetchClub = async () => {
            if (!id || !token) return;
            try {
                const data = await api.get<Club>(`/clubs/${id}`, token);
                setClub(data);
                // Initialize form data
                setFormData({
                    name: data.name,
                    legal_form: data.legal_form,
                    email: data.email,
                    address: data.membership.address,
                    contact_person: data.contact_person,
                    iban: data.membership.iban
                });
            } catch (err) {
                console.error("Failed to load club", err);
                setError("Verein konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };

        const fetchDocuments = async () => {
            if (!id || !token) return;
            try {
                const docs = await api.get<string[]>(`/clubs/${id}/documents`, token);
                setDocuments(docs);
            } catch (err) {
                console.error("Failed to load documents", err);
            }
        };

        fetchClub();
        fetchDocuments();
    }, [id, token]);

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
            const docs = await api.get<string[]>(`/clubs/${id}/documents`, token);
            setDocuments(docs);
            // Reset file input
            const fileInput = document.getElementById('document-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err) {
            console.error(err);
            setError("Dokument-Upload fehlgeschlagen.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (filename: string) => {
        if (!id || !token) return;
        try {
            // Determine API base URL from api.ts (exposed via vite env or default)
            // But we can just use the fetch with auth header directly
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
            setError("Download fehlgeschlagen.");
        }
    };

    const handleAction = async (action: 'approve' | 'deny' | 'apply' | 'cancel') => {
        if (!id || !token) return;
        setFormLoading(true);
        try {
            await api.post(`/clubs/${id}/${action}`, {}, token);
            // Refresh
            const updated = await api.get<Club>(`/clubs/${id}`, token);
            setClub(updated);
        } catch (err) {
            console.error(err);
            setError("Aktion fehlgeschlagen.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !token) return;
        if (!confirm("Sind Sie sicher, dass Sie diesen Verein löschen möchten?")) return;

        setFormLoading(true);
        try {
            await api.delete(`/clubs/${id}`, token);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            setError("Löschen fehlgeschlagen.");
            setFormLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !token) return;
        setFormLoading(true);
        try {
            // Send flat updates
            await api.patch<Club>(`/clubs/${id}`, formData, token);
            // Refresh data to be sure
            const updated = await api.get<Club>(`/clubs/${id}`, token);
            setClub(updated);
            setIsEditing(false);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError && err.data?.message) {
                setError(err.data.message);
            } else {
                setError("Speichern fehlgeschlagen.");
            }
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) return <div className="text-center py-12">Lade Details...</div>;
    if (!club) return <div className="text-center py-12">Verein nicht gefunden.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CLUB_STATUS_COLORS[club.membership.status])}>
                        {CLUB_STATUS_LABELS[club.membership.status]}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <>
                            {/* Membership Actions for Everyone */}
                            {club.membership.status === 'inactive' && (
                                <Button size="sm" onClick={() => handleAction('apply')} disabled={formLoading}>
                                    Mitgliedschaft beantragen
                                </Button>
                            )}
                            {(club.membership.status === 'requested' || club.membership.status === 'active') && !isAdmin && (
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleAction('cancel')} disabled={formLoading}>
                                    {club.membership.status === 'active' ? 'Mitgliedschaft kündigen' : 'Antrag zurückziehen'}
                                </Button>
                            )}

                            {/* Admin Actions */}
                            {isAdmin && club.membership.status === 'requested' && (
                                <>
                                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('approve')} disabled={formLoading}>
                                        <Check className="mr-2 h-4 w-4" /> Genehmigen
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleAction('deny')} disabled={formLoading}>
                                        <X className="mr-2 h-4 w-4" /> Ablehnen
                                    </Button>
                                </>
                            )}

                            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                Bearbeiten
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
                        <CardTitle>Stammdaten</CardTitle>
                        <CardDescription>Allgemeine Informationen zum Verein.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="legal_form">Rechtsform</Label>
                                <Input
                                    id="legal_form"
                                    value={formData.legal_form || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, legal_form: e.target.value }))}
                                    disabled={!isEditing}
                                    placeholder="e.g. e.V."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail</Label>
                                <Input
                                    id="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Adresse</Label>
                                <Input
                                    id="address"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_person">Ansprechpartner</Label>
                                <Input
                                    id="contact_person"
                                    value={formData.contact_person || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, contact_person: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iban">IBAN</Label>
                                <Input
                                    id="iban"
                                    value={formData.iban || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, iban: e.target.value }))}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </CardContent>
                    {isEditing && (
                        <CardFooter className="justify-end gap-2 bg-muted/20 py-4">
                            <Button type="button" variant="ghost" onClick={() => {
                                setIsEditing(false); setFormData({
                                    name: club.name,
                                    legal_form: club.legal_form,
                                    email: club.email,
                                    address: club.membership.address,
                                    contact_person: club.contact_person,
                                    iban: club.membership.iban
                                });
                            }}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                <Save className="mr-2 h-4 w-4" /> Speichern
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </form>

            <Card>
                <CardHeader>
                    <CardTitle>Dokumente</CardTitle>
                    <CardDescription>Laden Sie hier Vereinsdokumente hoch (Satzung, Registerauszug, etc.).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* List Documents */}
                    {documents.length > 0 ? (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div key={doc} className="flex items-center justify-between p-3 border rounded-md bg-muted/10 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        <span className="truncate text-sm font-medium">{doc}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Herunterladen">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                            Keine Dokumente vorhanden.
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="document-upload">Neues Dokument hochladen</Label>
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
        </div >
    );
}
