import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import "../global.css";

function RootNavigator() {
    const { isAuthenticated, isLoaded } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'new-pr' || segments[0] === 'streak-assist';

        if (!isAuthenticated && inAuthGroup) {
            // Redirect to login screen
            router.replace('/');
        } else if (isAuthenticated && !inAuthGroup) {
            // Redirect to dashboard
            router.replace('/(tabs)/dashboard');
        }
    }, [isAuthenticated, isLoaded, segments]);

    if (!isLoaded) {
        return null;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="new-pr" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    const { colorScheme } = useColorScheme();
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <AuthProvider>
                    <BottomSheetModalProvider>
                        <RootNavigator />
                        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    </BottomSheetModalProvider>
                </AuthProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
