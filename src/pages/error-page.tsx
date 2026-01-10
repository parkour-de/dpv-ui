import { useRouteError, isRouteErrorResponse, Link, useNavigate } from "react-router-dom";
import { Menu, X, Home, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function ErrorPage() {
    const { t } = useTranslation();
    const error = useRouteError();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    let title = t('error.title');
    let message = t('error.message');

    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            title = t('error.not_found.title');
            message = t('error.not_found.message');
        } else {
            title = `Fehler ${error.status}`; // Keeping this dynamic
            message = error.statusText;
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={() => navigate("/")}>
                        <span className="text-primary">{t('app.title')}</span>
                        <span className="hidden sm:inline-block font-medium text-foreground/80">{t('app.portal_name')}</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
                            {t('layout.nav.dashboard')}
                        </Link>
                        <Link to="/help" className="text-sm font-medium transition-colors hover:text-primary">{t('layout.nav.help')}</Link>
                    </nav>

                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-b border-border p-4 space-y-4 bg-background">
                    <Link to="/" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        {t('layout.nav.dashboard')}
                    </Link>
                    <Link to="/help" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        {t('layout.nav.help')}
                    </Link>
                </div>
            )}

            <main className="flex-1 container max-w-screen-xl py-12 px-4 md:px-6 flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-destructive/10 p-6 rounded-full">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{title}</h1>
                <p className="text-xl text-muted-foreground max-w-lg mx-auto">{message}</p>
                <div className="flex gap-4 pt-4">
                    <Button onClick={() => navigate(-1)} variant="outline">{t('error.actions.back')}</Button>
                    <Button onClick={() => navigate("/")}><Home className="mr-2 h-4 w-4" /> {t('error.actions.home')}</Button>
                </div>
            </main>

            <footer className="border-t border-border/40 py-6 md:px-8 bg-muted/20">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground text-center md:text-left">
                        &copy; {new Date().getFullYear()} {t('app.copyright')}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <Link to="/imprint" className="hover:underline">{t('footer.imprint')}</Link>
                        <Link to="/help" className="hover:underline">{t('footer.help')}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
