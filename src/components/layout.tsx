import { Outlet, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-core";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoBlack from "@/assets/logo-black.svg";
import logoWhite from "@/assets/logo-white.svg";

export function Layout() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isTestEnv = import.meta.env.VITE_TEST_ENVIRONMENT === 'true';

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div
                    className={cn("absolute top-0 left-0 w-full h-[3px]", !isTestEnv && "bg-primary")}
                    style={isTestEnv ? { backgroundColor: "color(display-p3 1 0 0)" } : undefined}
                ></div>
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="relative flex items-center h-14 w-[280px] sm:w-[310px] group translate-y-[8px]">
                            <img
                                src={logoBlack}
                                alt="Deutscher Parkourverband"
                                className="dark:hidden h-[58px] sm:h-[62px] max-w-none absolute left-0 top-1/2 -translate-y-1/2 transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                            <img
                                src={logoWhite}
                                alt="Deutscher Parkourverband"
                                className="hidden dark:block h-[58px] sm:h-[62px] max-w-none absolute left-0 top-1/2 -translate-y-1/2 transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                        </Link>
                        {isTestEnv ? (
                            <span
                                className="hidden lg:inline-flex font-bold self-center border-l border-border pl-4 h-6 items-center uppercase tracking-widest text-[12px]"
                                style={{ color: "color(display-p3 1 0 0)" }}
                            >
                                TESTSYSTEM
                            </span>
                        ) : (
                            <span className="hidden lg:inline-flex font-medium text-primary self-center border-l border-border pl-4 h-6 items-center uppercase tracking-widest text-[10px]">
                                {t('app.portal_name')}
                            </span>
                        )}
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/dashboard" className="text-sm font-semibold transition-colors hover:text-primary text-foreground/80 hover:underline underline-offset-8 decoration-2">
                            {t('layout.nav.dashboard')}
                        </Link>
                        {user?.roles?.includes('admin') && (
                            <Link to="/admin" className="text-sm font-semibold transition-colors hover:text-primary text-foreground/80 hover:underline underline-offset-8 decoration-2">
                                Admin
                            </Link>
                        )}
                        <Link to="/status" className="text-sm font-semibold transition-colors hover:text-primary text-foreground/80 hover:underline underline-offset-8 decoration-2">
                            Status
                        </Link>
                        <Link to="/help" className="text-sm font-semibold transition-colors hover:text-primary text-foreground/80 hover:underline underline-offset-8 decoration-2">
                            {t('layout.nav.help')}
                        </Link>
                        {user?.roles?.includes('global_admin') && (
                            <Link to="/settings" className="text-sm font-semibold transition-colors hover:text-primary text-foreground/80 hover:underline underline-offset-8 decoration-2">
                                Einstellungen
                            </Link>
                        )}
                    </nav>

                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/profile" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group flex items-center gap-2">
                            <span className="group-hover:underline">{user?.email}</span>
                        </Link>
                        <button onClick={handleLogout} className="text-sm font-bold text-destructive hover:text-destructive/80 transition-colors uppercase tracking-wider">
                            {t('layout.nav.logout')}
                        </button>
                    </div>

                    <button className="md:hidden p-2 text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full border-b border-border/40 p-4 space-y-2 bg-background/95 backdrop-blur-md shadow-xl animate-in slide-in-from-top-2 duration-200">
                        <Link to="/dashboard" className="flex items-center w-full px-4 py-3 rounded-md text-base font-semibold text-foreground/80 hover:text-primary hover:bg-muted/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                            {t('layout.nav.dashboard')}
                        </Link>
                        {user?.roles?.includes('admin') && (
                            <Link to="/admin" className="flex items-center w-full px-4 py-3 rounded-md text-base font-semibold text-foreground/80 hover:text-primary hover:bg-muted/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                                Admin
                            </Link>
                        )}
                        <Link to="/status" className="flex items-center w-full px-4 py-3 rounded-md text-base font-semibold text-foreground/80 hover:text-primary hover:bg-muted/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                            Status
                        </Link>
                        <Link to="/help" className="flex items-center w-full px-4 py-3 rounded-md text-base font-semibold text-foreground/80 hover:text-primary hover:bg-muted/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                            {t('layout.nav.help')}
                        </Link>
                        {user?.roles?.includes('global_admin') && (
                            <Link to="/settings" className="flex items-center w-full px-4 py-3 rounded-md text-base font-semibold text-foreground/80 hover:text-primary hover:bg-muted/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                                Einstellungen
                            </Link>
                        )}
                        <div className="pt-4 mt-2 border-t border-border/40 space-y-2">
                            <Link to="/profile" className="flex items-center w-full px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors break-all" onClick={() => setMobileMenuOpen(false)}>
                                {user?.email}
                            </Link>
                            <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded-md text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors uppercase tracking-wider">
                                {t('layout.nav.logout')}
                            </button>
                        </div>
                    </div>
                )}
            </header>

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
