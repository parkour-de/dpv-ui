import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.admin.title')}</h1>
                <p className="text-muted-foreground">
                    {t('dashboard.admin.description')}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
                <Card className="bg-muted/30 border-dashed hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle>{t('dashboard.admin.users_button')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <CardDescription>
                            Verwalte Benutzerkonten, Rollen und Aktivmitgliedschaftsanträge.
                        </CardDescription>
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/users">
                                Anzeigen
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30 border-dashed hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle>{t('dashboard.admin.audit_button')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <CardDescription>
                            Sieh dir die letzten Änderungen an der Datenbank an.
                        </CardDescription>
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/audit">
                                Anzeigen
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
