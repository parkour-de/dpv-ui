import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { type User } from '@/types';
import { AuthContext } from './auth-context-core';

const STORAGE_KEY_TOKEN = 'dpv_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const { i18n } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY_TOKEN));
    const [isVerifying, setIsVerifying] = useState(!!token);

    useEffect(() => {
        if (token && !user && isVerifying) {
            // Verify token and get user
            api.get<User>('/users/me', token)
                .then(setUser)
                .catch(() => {
                    // If failed, clear storage
                    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
                    setToken(null);
                })
                .finally(() => setIsVerifying(false));
        }
    }, [token, user, isVerifying]);

    // Sync user language preference with i18n
    useEffect(() => {
        if (user?.language && user.language !== i18n.language) {
            i18n.changeLanguage(user.language);
        }
    }, [user, i18n]);

    const login = (newToken: string, newUser: User) => {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, newToken);
        setToken(newToken);
        setUser(newUser);
        setIsVerifying(false); // No need to verify if we just logged in
    };

    const logout = () => {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        setToken(null);
        setUser(null);
        setIsVerifying(false);
    };

    const apiUpdateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    if (isVerifying) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, apiUpdateUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}
