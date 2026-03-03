import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardPage() {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                <p className="text-muted-foreground">
                    {t('dashboard.welcome', { firstname: user?.firstname })}
                </p>
                <p className="text-xl font-medium mt-4">{t('landing.what_do_you_want_to_do')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
                {/* Aktivmitgliedschaft */}
                <Card className="bg-background/95 backdrop-blur shadow-md flex flex-col text-left">
                    <CardHeader>
                        <CardTitle>{t('landing.active_membership.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-6">
                        <CardDescription className="text-base text-foreground/80">
                            {t('landing.active_membership.description')}
                        </CardDescription>
                        <Button asChild className="w-full bg-[var(--accent)] hover:opacity-90 text-white font-semibold">
                            <Link to="/profile">
                                {t('landing.active_membership.button')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Ordentliche Mitgliedschaft */}
                <Card className="bg-background/95 backdrop-blur shadow-md flex flex-col text-left">
                    <CardHeader>
                        <CardTitle>{t('landing.ordinary_membership.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-6">
                        <CardDescription className="text-base text-foreground/80">
                            {t('landing.ordinary_membership.description')}
                        </CardDescription>
                        <Button asChild className="w-full bg-[var(--accent)] hover:opacity-90 text-white font-semibold">
                            <Link to="/clubs">
                                {t('landing.ordinary_membership.button')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Fördernde Mitgliedschaft */}
                <Card className="bg-background/95 backdrop-blur shadow-md flex flex-col text-left">
                    <CardHeader>
                        <CardTitle>{t('landing.supporting_membership.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-6">
                        <CardDescription className="text-base text-foreground/80">
                            {t('landing.supporting_membership.description')}
                        </CardDescription>
                        <Button asChild className="w-full bg-[var(--accent)] hover:opacity-90 text-white font-semibold">
                            <Link to="/profile?type=supporting">
                                {t('landing.supporting_membership.button')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Außerordentliche Mitgliedschaft */}
                <Card className="bg-background/95 backdrop-blur shadow-md flex flex-col opacity-80 text-left">
                    <CardHeader>
                        <CardTitle>{t('landing.extraordinary_membership.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-6">
                        <CardDescription className="text-base text-foreground/80">
                            {t('landing.extraordinary_membership.description')}
                        </CardDescription>
                        <Button disabled className="w-full select-none cursor-not-allowed" variant="secondary">
                            {t('landing.extraordinary_membership.button')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {user?.roles?.includes('admin') && (
                <div className="mt-12 space-y-6">
                    <div className="border-t pt-8">
                        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.admin.title')}</h2>
                        <p className="text-muted-foreground">
                            {t('dashboard.admin.description')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
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
            )}
        </div>
    );
}
