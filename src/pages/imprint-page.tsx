import { useTranslation } from "react-i18next";
import { PageWrapper } from "@/components/page-wrapper";

export function ImprintPage() {
    const { t } = useTranslation();
    return (
        <PageWrapper title={t('imprint.title')}>
            <div className="prose dark:prose-invert max-w-none">
                <section className="mb-8">
                    <h1 className="text-2xl font-bold mb-4">{t('imprint.title')}</h1>
                    <p className="font-semibold mb-2">{t('imprint.legal_info')}</p>
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
                        {t('imprint.phone')}: +49 177 211 93 22<br />
                        {t('imprint.email')}: <a href="mailto:info@parkour-deutschland.de" className="text-primary hover:underline">info@parkour-deutschland.de</a>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.bank.title')}</h2>
                    <p>
                        GLS Gemeinschaftsbank eG<br />
                        DE56 4306 0967 1374 7488 00<br />
                        GENODEM1GLS
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.board.title')}</h2>
                    <p>
                        Maren Baufeld<br />
                        Max Heckl<br />
                        Eike Plenter
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.assessors.title')}</h2>
                    <p>
                        Merlin Szymanski<br />
                        Jewgeni Eisenberg
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.editorial.title')}</h2>
                    <p>
                        Jewgeni Eisenberg<br />
                        c/o betahaus<br />
                        Haus des Engagements<br />
                        Eifflerstraße 43<br />
                        22769 Hamburg
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.register.title')}</h2>
                    <p>
                        {t('imprint.register.content')}<br />
                        Amtsgericht Hamburg<br />
                        VR 25860
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.disclaimer.title')}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('imprint.disclaimer.content1')}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('imprint.disclaimer.content2')}
                    </p>
                </section>
            </div>
        </PageWrapper>
    );
}
