import { PageWrapper } from "@/components/page-wrapper";

export function ImprintPage() {
    return (
        <PageWrapper title="Impressum">
            <div className="prose dark:prose-invert max-w-none">
                <section className="mb-8">
                    <h1 className="text-2xl font-bold mb-4">Impressum</h1>
                    <p className="font-semibold mb-2">Angaben gemäß § 5 TMG:</p>
                    <p>
                        Deutscher Parkourverband e.V.<br />
                        c/o betahaus<br />
                        Haus des Engagements<br />
                        Eifflerstraße 43<br />
                        22769 Hamburg
                    </p>
                </section>

                <section className="mb-8">
                    <p>
                        Telefon: +49 177 211 93 22<br />
                        E-Mail.: <a href="mailto:info@parkour-deutschland.de" className="text-primary hover:underline">info@parkour-deutschland.de</a>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">Kontoverbindung</h2>
                    <p>
                        GLS Gemeinschaftsbank eG<br />
                        DE56 4306 0967 1374 7488 00<br />
                        GENODEM1GLS
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">Vertretungsberechtigter Vorstand</h2>
                    <p>
                        Maren Baufeld<br />
                        Max Heckl<br />
                        Eike Plenter
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">Beisitzer</h2>
                    <p>
                        Merlin Szymanski<br />
                        Jewgeni Eisenberg
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">Verantwortlich für redaktionelle Inhalte</h2>
                    <p>
                        Jewgeni Eisenberg<br />
                        c/o betahaus<br />
                        Haus des Engagements<br />
                        Eifflerstraße 43<br />
                        22769 Hamburg
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">Registereintrag</h2>
                    <p>
                        Eingetragen im Vereinsregister<br />
                        Amtsgericht Hamburg<br />
                        VR 25860
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">Haftungsausschluss</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzten verantwortlich. Nach §§ 8 bis 10 TMG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.<br /><br />
                        Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzten bleiben hiervon unberührt. Eine diesbezügliche Haftung is jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtverletzungen werden wir diese Inhalte umgehend entfernen.
                    </p>
                </section>
            </div>
        </PageWrapper>
    );
}
