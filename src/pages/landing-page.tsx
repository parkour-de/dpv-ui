import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { Button } from "@/components/ui/button";
import logoBlack from "@/assets/logo-black.svg";
import logoWhite from "@/assets/logo-white.svg";
import loginBg from "@/assets/login.webp";

export function LandingPage() {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 bg-background"
            style={{
                backgroundImage: `url(${loginBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
            }}
        >
            <div className="w-full max-w-4xl space-y-8 text-center p-4">
                <div className="flex justify-center mb-8">
                    <img src={logoBlack} alt="Deutscher Parkourverband" className="dark:hidden h-20 w-auto" />
                    <img src={logoWhite} alt="Deutscher Parkourverband" className="hidden dark:block h-20 w-auto" />
                </div>

                <div className="space-y-6 max-w-2xl mx-auto rounded-xl p-8 bg-background/80 backdrop-blur-sm shadow-sm">
                    <h1 className="text-3xl font-bold tracking-tight">{t('landing.welcome')}</h1>

                    <div className="flex justify-center pt-4">
                        {user ? (
                            <Button asChild size="lg" className="bg-[var(--accent)] hover:opacity-90 text-white font-semibold">
                                <Link to="/dashboard">
                                    {t('layout.nav.dashboard')}
                                </Link>
                            </Button>
                        ) : (
                            <div className="flex gap-4">
                                <Button asChild size="lg" className="bg-[var(--accent)] hover:opacity-90 text-white font-semibold">
                                    <Link to="/login">
                                        {t('auth.login.submit')}
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg">
                                    <Link to="/register">
                                        {t('auth.register.submit')}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
