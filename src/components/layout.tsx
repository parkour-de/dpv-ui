import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context-core";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Layout() {
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
                        <span className="text-primary">DPV</span>
                        <span className="hidden sm:inline-block font-medium text-foreground/80">Mitgliederportal</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                            Übersicht
                        </Link>
                        {user?.roles?.includes('admin') && (
                            <Link to="/admin/clubs" className="text-sm font-medium transition-colors hover:text-primary">
                                Unconfirmed Clubs
                            </Link>
                        )}
                        <Link to="/help" className="text-sm font-medium transition-colors hover:text-primary">Hilfe</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors group flex items-center gap-2">
                            <span className="group-hover:underline">{user?.email}</span>
                        </Link>
                        <button onClick={handleLogout} className="text-sm font-medium text-destructive hover:underline">
                            Abmelden
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
                        Übersicht
                    </Link>
                    <Link to="/help" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        Hilfe
                    </Link>
                    <div className="pt-2 border-t border-border">
                        <Link to="/profile" className="block text-xs text-muted-foreground mb-2 hover:underline" onClick={() => setMobileMenuOpen(false)}>
                            {user?.email}
                        </Link>
                        <button onClick={handleLogout} className="text-sm font-medium text-destructive w-full text-left">
                            Abmelden
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
                        &copy; {new Date().getFullYear()} Deutscher Parkour Verband e.V.
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <Link to="/imprint" className="hover:underline">Impressum</Link>
                        <Link to="/help" className="hover:underline">Hilfe</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
