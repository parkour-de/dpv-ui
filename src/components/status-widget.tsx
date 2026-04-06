import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Plus, Save, X, ExternalLink, Settings2 } from "lucide-react";
import { api } from "@/lib/api";
import { useConfig } from "@/hooks/use-config";
import { useAuth } from "@/context/auth-context-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StatusWidget() {
    const { t } = useTranslation();
    const { config, refreshConfig } = useConfig();
    const { user } = useAuth();
    const [backendVersion, setBackendVersion] = useState<string>("...");
    const [isEditing, setIsEditing] = useState(false);
    const [editedLinks, setEditedLinks] = useState<Record<string, string>>({});
    const [newKey, setNewKey] = useState("");
    const [newUrl, setNewUrl] = useState("");

    const frontendVersion = import.meta.env.VITE_APP_VERSION || "dev";
    const isAdmin = user?.roles?.includes('admin');

    useEffect(() => {
        api.getText("/version")
            .then(v => setBackendVersion(v))
            .catch(() => setBackendVersion("Error"));
    }, []);

    const [prevConfigLinks, setPrevConfigLinks] = useState(config?.links);
    if (config?.links !== prevConfigLinks) {
        setPrevConfigLinks(config?.links);
        if (config?.links) {
            setEditedLinks({ ...config.links });
        }
    }

    const handleSave = async () => {
        try {
            await api.patch("/config/links", { links: editedLinks });
            await refreshConfig();
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save links", err);
        }
    };

    const handleCancel = () => {
        if (config?.links) {
            setEditedLinks({ ...config.links });
        }
        setIsEditing(false);
    };

    const handleDelete = (key: string) => {
        const next = { ...editedLinks };
        delete next[key];
        setEditedLinks(next);
    };

    const handleUpdate = (key: string, value: string) => {
        setEditedLinks({ ...editedLinks, [key]: value });
    };

    const handleAdd = () => {
        if (newKey && newUrl) {
            setEditedLinks({ ...editedLinks, [newKey.trim()]: newUrl.trim() });
            setNewKey("");
            setNewUrl("");
        }
    };

    return (
        <Card className="bg-background/95 backdrop-blur shadow-md flex flex-col text-left">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1.5">
                    <CardTitle>{t('dashboard.status.title', 'System Status')}</CardTitle>
                    <CardDescription>{t('dashboard.status.description', 'Versions and configuration')}</CardDescription>
                </div>
                {isAdmin && !isEditing && (
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                        <Settings2 className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Versionen */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Frontend:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{frontendVersion}</span>
                            <a 
                                href="https://github.com/parkour-de/dpv-ui" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Backend:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{backendVersion}</span>
                            <a 
                                href="https://github.com/parkour-de/dpv" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Dokumente & Links */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">{t('dashboard.status.links_title', 'Important Documents')}</h4>
                    <div className="space-y-2">
                        {isEditing ? (
                            <div className="space-y-3">
                                {Object.entries(editedLinks).map(([key, url]) => (
                                    <div key={key} className="flex gap-2 items-center">
                                        <Input 
                                            value={key} 
                                            readOnly 
                                            className="w-1/3 bg-muted h-8 text-xs" 
                                        />
                                        <Input 
                                            value={url} 
                                            onChange={(e) => handleUpdate(key, e.target.value)}
                                            className="flex-1 h-8 text-xs font-mono"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => handleDelete(key)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-2 items-center border-t pt-2 mt-2">
                                    <Input 
                                        placeholder="Key" 
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                        className="w-1/3 h-8 text-xs"
                                    />
                                    <Input 
                                        placeholder="URL" 
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        className="flex-1 h-8 text-xs font-mono"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={handleAdd}
                                        disabled={!newKey || !newUrl}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button size="sm" variant="outline" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-1" /> {t('common.cancel', 'Cancel')}
                                    </Button>
                                    <Button size="sm" onClick={handleSave} className="bg-[var(--accent)] hover:opacity-90">
                                        <Save className="h-4 w-4 mr-1" /> {t('common.save', 'Save')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {((Object.entries(config?.links || {}) as [string, string][]).filter(([key]) => ['privacy', 'statutes', 'finances'].includes(key))).map(([key, url]) => (
                                    <a 
                                        key={key}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border group"
                                    >
                                        <span className="text-sm font-medium capitalize">{key}</span>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                    </a>
                                ))}
                                {((Object.entries(config?.links || {}) as [string, string][]).filter(([key]) => !['privacy', 'statutes', 'finances'].includes(key))).map(([key, url]) => (
                                    <a 
                                        key={key}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border group"
                                    >
                                        <span className="text-sm font-medium">{key}</span>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
