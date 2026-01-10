import { createHashRouter } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import { Layout } from "@/components/layout";
import { LandingPage } from "@/pages/landing-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ClubDetailsPage } from "@/pages/club-details-page";
import { CreateClubPage } from "@/pages/create-club-page";
import { RegisterPage } from "@/pages/register-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { ImprintPage } from "@/pages/imprint-page";
import { HelpPage } from "@/pages/help-page";
import { ProfilePage } from "@/pages/profile-page";
import { ProtectedRoute } from "@/components/protected-route";


import { ErrorPage } from "@/pages/error-page";

export const router = createHashRouter([
    {
        path: "/",
        element: <LandingPage />,
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
                path: "/clubs/new",
                element: <CreateClubPage />,
            },
            {
                path: "/clubs/:id",
                element: <ClubDetailsPage />,
            },
            {
                path: "/profile",
                element: <ProfilePage />,
            },
        ],
    },
]);
