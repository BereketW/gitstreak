import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark';

type ThemeContextType = {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        SecureStore.getItemAsync('app_theme').then(savedTheme => {
            if (savedTheme === 'light' || savedTheme === 'dark') {
                Appearance.setColorScheme(savedTheme);
                setThemeState(savedTheme);
            }
        });
    }, []);

    const setTheme = useCallback(async (newTheme: Theme) => {
        Appearance.setColorScheme(newTheme);
        setThemeState(newTheme);
        await SecureStore.setItemAsync('app_theme', newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        const nextTheme = Appearance.getColorScheme() === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    }, [setTheme]);

    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
