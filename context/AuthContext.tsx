import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type AuthContextType = {
    isAuthenticated: boolean;
    isLoaded: boolean;
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load token on startup
        SecureStore.getItemAsync('github_token').then(storedToken => {
            if (storedToken) {
                setToken(storedToken);
                setIsAuthenticated(true);
            }
        }).finally(() => {
            setIsLoaded(true);
        });
    }, []);

    const login = async (newToken: string) => {
        await SecureStore.setItemAsync('github_token', newToken);
        setToken(newToken);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('github_token');
        setToken(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoaded, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
