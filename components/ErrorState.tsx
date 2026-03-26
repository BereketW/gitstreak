import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export const ErrorState = ({ message = 'Something went wrong', onRetry }: ErrorStateProps) => {
    const { colorScheme } = useColorScheme();

    // Check for rate limit
    const isRateLimited = message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('429');

    const displayMessage = isRateLimited
        ? "You've hit GitHub's API rate limit. Please try again later."
        : message;

    return (
        <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-background-dark">
            <View className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full items-center justify-center mb-6 border-4 border-red-200 dark:border-red-500/20">
                <MaterialIcons 
                    name={isRateLimited ? "hourglass-empty" : "error-outline"} 
                    size={36} 
                    color={colorScheme === 'dark' ? '#ef4444' : '#ef4444'} 
                />
            </View>
            <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">
                {isRateLimited ? 'Take a breather' : 'Oops!'}
            </Text>
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center mb-8 px-4 leading-relaxed">
                {displayMessage}
            </Text>
            
            {onRetry && (
                <TouchableOpacity 
                    onPress={onRetry}
                    className="bg-slate-900 dark:bg-white px-6 py-3.5 rounded-full shadow-lg active:scale-95 transition-transform flex-row items-center gap-2"
                >
                    <MaterialIcons name="refresh" size={18} color={colorScheme === 'dark' ? '#0f172a' : '#ffffff'} />
                    <Text className="text-white dark:text-slate-900 font-bold text-sm">Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
