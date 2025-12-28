import { PageWrapper } from "@/components/page-wrapper";

export function ImprintPage() {
    return (
        <PageWrapper title="Impressum">
            <div className="prose dark:prose-invert">
                <p>Angaben gemäß § 5 TMG</p>

                <h3>Anschrift</h3>
                <p>
                    Deutscher Parkour Verband e.V.<br />
                    Musterstraße 123<br />
                    12345 Musterstadt
                </p>

                <h3>Vertreten durch</h3>
                <p>
                    Max Mustermann (Vorstandsvorsitzender)<br />
                    Erika Mustermann (Stellvertreterin)
                </p>

                <h3>Kontakt</h3>
                <p>
                    Telefon: +49 (0) 123 456789<br />
                    E-Mail: info@parkour-deutschland.de
                </p>

                <h3>Registereintrag</h3>
                <p>
                    Eintragung im Vereinsregister.<br />
                    Registergericht: Amtsgericht Musterstadt<br />
                    Registernummer: VR 12345
                </p>

                <h3>Haftungsausschluss</h3>
                <p className="text-sm text-muted-foreground">
                    Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.
                    Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
                </p>
            </div>
        </PageWrapper>
    );
}
