import { useState, type ReactNode } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { BreadcrumbLabelContext } from "@/context/breadcrumb-context";

interface Crumb {
    readonly label: string;
    readonly to: string;
}

/**
 * Shows "Übersicht › Vereinsverwaltung › <Club>" style navigation above every
 * logged-in page. The trail for each route is defined in one place below.
 */
export function Breadcrumbs({ children }: { readonly children: ReactNode }) {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const [label, setLabel] = useState<string | undefined>();

    const home: Crumb = { label: t('layout.nav.dashboard'), to: "/dashboard" };
    const clubs: Crumb = { label: t('breadcrumbs.clubs'), to: "/clubs" };
    const admin: Crumb = { label: t('dashboard.admin.title'), to: "/admin" };
    const users: Crumb = { label: t('dashboard.admin.users_button'), to: "/users" };

    const trails: Record<string, Crumb[]> = {
        "/dashboard": [home],
        "/clubs": [home, clubs],
        "/clubs/new": [home, clubs, { label: t('create_club.title'), to: "/clubs/new" }],
        "/club/:id": [home, clubs, { label: label || t('breadcrumbs.club'), to: pathname }],
        "/profile": [home, { label: t('profile.title'), to: "/profile" }],
        "/admin": [home, admin],
        "/users": [home, admin, users],
        "/user/:id": [home, admin, users, { label: label || t('breadcrumbs.user'), to: pathname }],
        "/audit": [home, admin, { label: t('dashboard.audit_page.title'), to: "/audit" }],
        "/settings": [home, { label: t('breadcrumbs.settings'), to: "/settings" }],
        "/status": [home, { label: t('breadcrumbs.status'), to: "/status" }],
    };
    const pattern = Object.keys(trails).find((path) => matchPath(path, pathname));
    const trail = pattern ? trails[pattern] : [];

    return (
        <BreadcrumbLabelContext.Provider value={setLabel}>
            {/* A single crumb (the dashboard itself) adds nothing, so hide it */}
            {trail.length > 1 && (
                <nav aria-label={t('breadcrumbs.aria_label')} className="mb-6">
                    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        {trail.map((crumb, i) => {
                            const isLast = i === trail.length - 1;
                            return (
                                <li key={crumb.to} className="flex items-center gap-1.5 min-w-0">
                                    {i > 0 && <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
                                    {isLast ? (
                                        <span aria-current="page" className="font-medium text-foreground truncate">{crumb.label}</span>
                                    ) : (
                                        <Link to={crumb.to} className="hover:text-foreground hover:underline underline-offset-4 transition-colors">
                                            {crumb.label}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            )}
            {children}
        </BreadcrumbLabelContext.Provider>
    );
}
