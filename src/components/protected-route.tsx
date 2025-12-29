import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context-core";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, token } = useAuth();

    if (!isAuthenticated && !token) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
