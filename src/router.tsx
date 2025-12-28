import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "@/context/auth-context";
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, token } = useAuth();

    // If loading is handled in AuthProvider, isAuthenticated will be false initially but we might want a loading state there.
    // AuthProvider handles the initial load and renders children only after checking token.
    // But if token check fails or no token, isAuthenticated is false.

    if (!isAuthenticated && !token) { // Double check token presence in context
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LandingPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
    },
    {
        path: "/reset-password",
        element: <ResetPasswordPage />,
    },
    {
        path: "/imprint",
        element: <ImprintPage />,
    },
    {
        path: "/help",
        element: <HelpPage />,
    },
    {
        element: (
            <AuthProvider>
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            </AuthProvider>
        ),
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
