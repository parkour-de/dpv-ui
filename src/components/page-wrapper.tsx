import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context-core";

interface LayoutWrapperProps {
    children: React.ReactNode;
    title: string;
}

export function PageWrapper({ children, title }: LayoutWrapperProps) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleBack = () => {
        if (isAuthenticated) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center gap-4 px-4">
                    <button onClick={handleBack} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-bold">{title}</h1>
                </div>
            </header>
            <main className="flex-1 container max-w-screen-md py-6 px-4 md:px-8">
                {children}
            </main>
        </div>
    );
}
