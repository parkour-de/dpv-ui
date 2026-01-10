import { Outlet, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSelector } from "@/components/language-selector";

export function Layout() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <span className="text-primary">{t('app.title')}</span>
                        <span className="hidden sm:inline-block font-medium text-foreground/80">{t('app.portal_name')}</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                            {t('layout.nav.dashboard')}
                        </Link>
                        <Link to="/help" className="text-sm font-medium transition-colors hover:text-primary">{t('layout.nav.help')}</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <LanguageSelector />
                        <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors group flex items-center gap-2">
                            <span className="group-hover:underline">{user?.email}</span>
                        </Link>
                        <button onClick={handleLogout} className="text-sm font-medium text-destructive hover:underline">
                            {t('layout.nav.logout')}
                        </button>
                    </div>

                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-b border-border p-4 space-y-4 bg-background">
                    <Link to="/dashboard" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        {t('layout.nav.dashboard')}
                    </Link>
                    <Link to="/help" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        {t('layout.nav.help')}
                    </Link>
                    <div className="pt-2 border-t border-border space-y-3">
                        <div className="flex items-center justify-between">
                            <Link to="/profile" className="block text-xs text-muted-foreground hover:underline" onClick={() => setMobileMenuOpen(false)}>
                                {user?.email}
                            </Link>
                            <LanguageSelector />
                        </div>
                        <button onClick={handleLogout} className="text-sm font-medium text-destructive w-full text-left">
                            {t('layout.nav.logout')}
                        </button>
                    </div>
                </div>
            )}

            <main className="flex-1 container max-w-screen-xl py-6 px-4 md:px-6">
                <Outlet />
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
