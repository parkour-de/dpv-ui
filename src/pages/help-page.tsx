import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageWrapper } from "@/components/page-wrapper";

export function HelpPage() {
    return (
        <PageWrapper title="Hilfe & Support">
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Wie gründe ich einen Verein?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>
                            Um einen neuen Verein beim DPV anzumelden, müssen Sie registriert und angemeldet sein.
                            Klicken Sie im Dashboard auf "Neuen Verein gründen" und füllen Sie das Formular aus.
                            Ihr Antrag wird anschließend von einem Administrator geprüft.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Was passiert nach der Registrierung?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>
                            Nach der Registrierung erhalten Sie eine E-Mail zur Bestätigung Ihrer Adresse.
                            Anschließend können Sie sich anmelden und Vereine verwalten oder gründen.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Wie kann ich mein Passwort ändern?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>
                            Wenn Sie Ihr Passwort vergessen haben, nutzen Sie die "Passwort vergessen"-Funktion auf der Anmeldeseite.
                            Sie erhalten dann einen Link zum Zurücksetzen.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PageWrapper>
    );
}
