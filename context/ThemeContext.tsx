import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

type ThemeContextType = {
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { colorScheme, setColorScheme } = useNativeWindColorScheme();
    const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

    useEffect(() => {
        SecureStore.getItemAsync('app_theme').then(savedTheme => {
            if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
                setThemeState(savedTheme);
                if (savedTheme !== 'system') {
                    setColorScheme(savedTheme);
                }
            }
        });
    }, [setColorScheme]);

    const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
        setThemeState(newTheme);
        await SecureStore.setItemAsync('app_theme', newTheme);
        if (newTheme !== 'system') {
            setColorScheme(newTheme);
        } else {
            setColorScheme('system');
        }
    };

    const toggleTheme = () => {
        const nextTheme = colorScheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
