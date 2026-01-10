import { useTranslation, Trans } from "react-i18next";
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
                        <Trans i18nKey="imprint.address" />
                    </p>
                </section>

                <section className="mb-8">
                    <p>
                        <Trans i18nKey="imprint.contact" />
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.bank.title')}</h2>
                    <p>
                        <Trans i18nKey="imprint.bank.content" />
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.board.title')}</h2>
                    <p>
                        <Trans i18nKey="imprint.board.content" />
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.assessors.title')}</h2>
                    <p>
                        <Trans i18nKey="imprint.assessors.content" />
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.editorial.title')}</h2>
                    <p>
                        <Trans i18nKey="imprint.editorial.content" />
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.register.title')}</h2>
                    <p>
                        <Trans i18nKey="imprint.register.content" />
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-2">{t('imprint.disclaimer.title')}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        <Trans i18nKey="imprint.disclaimer.content" />
                    </p>
                </section>
            </div>
        </PageWrapper>
    );
}
