import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageWrapper } from "@/components/page-wrapper";

export function HelpPage() {
    const { t } = useTranslation();
    return (
        <PageWrapper title={t('help.title')}>
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('help.faq.create_club.question')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>{t('help.faq.create_club.answer')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('help.faq.after_registration.question')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>{t('help.faq.after_registration.answer')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('help.faq.reset_password.question')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>{t('help.faq.reset_password.answer')}</p>
                    </CardContent>
                </Card>
            </div>
        </PageWrapper>
    );
}
