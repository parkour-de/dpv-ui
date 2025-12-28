import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
    email: string;
    firstname: string;
    lastname: string;
    roles?: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    apiUpdateUser: (user: User) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = 'dpv_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN);
        if (storedToken) {
            setToken(storedToken);
            // Verify token and get user
            api.get<User>('/users/me', storedToken)
                .then(setUser)
                .catch(() => {
                    // If failed, clear storage
                    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        setToken(null);
        setUser(null);
    };

    const apiUpdateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
        // Or just render nothing / splash
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, apiUpdateUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
