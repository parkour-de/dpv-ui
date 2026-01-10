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
    // Only depend on user.language to avoid infinite loop from i18n object reference changes
    const userLanguage = user?.language;
    useEffect(() => {
        if (userLanguage) {
            // User has a language preference set - use it
            i18n.changeLanguage(userLanguage);
        } else if (user && !userLanguage) {
            // User is logged in but chose "browser default" - detect from browser
            const browserLang = navigator.language.split('-')[0] || 'de';
            i18n.changeLanguage(browserLang);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLanguage]);

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
