import { createHashRouter } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import { Layout } from "@/components/layout";
import { LandingPage } from "@/pages/landing-page";
import { LoginPage } from "@/pages/login-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ClubsPage } from "@/pages/clubs-page";
import { ClubDetailsPage } from "@/pages/club-details-page";
import { CreateClubPage } from "@/pages/create-club-page";
import { RegisterPage } from "@/pages/register-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { ImprintPage } from "@/pages/imprint-page";
import { HelpPage } from "@/pages/help-page";
import { UsersPage } from "@/pages/users-page";
import { UserDetailsPage } from "@/pages/user-details-page";
import { AuditPage } from "@/pages/audit-page";
import { ProtectedRoute } from "@/components/protected-route";


import { ErrorPage } from "@/pages/error-page";

export const router = createHashRouter([
    {
        path: "/",
        element: <LandingPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/login",
        element: <LoginPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/reset-password",
        element: <ResetPasswordPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/imprint",
        element: <ImprintPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/help",
        element: <HelpPage />,
        errorElement: <ErrorPage />,
    },
    {
        element: (
            <AuthProvider>
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            </AuthProvider>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/dashboard",
                element: <DashboardPage />,
            },
            {
                path: "/clubs",
                element: <ClubsPage />,
            },
            {
                path: "/clubs/new",
                element: <CreateClubPage />,
            },
            {
                path: "/club/:id",
                element: <ClubDetailsPage />,
            },
            {
                path: "/profile",
                element: <UserDetailsPage />,
            },
            {
                path: "/users",
                element: <UsersPage />,
            },
            {
                path: "/user/:id",
                element: <UserDetailsPage />,
            },
            {
                path: "/audit",
                element: <AuditPage />,
            },
        ],
    },
]);
