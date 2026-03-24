import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
}

export const ScreenHeader = ({ title, subtitle }: ScreenHeaderProps) => {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    
    return (
        <View className="flex-row items-center justify-between px-6 py-4 bg-background-light/90 dark:bg-[#0a0f18]/90 backdrop-blur-xl z-30 border-b border-slate-200/50 dark:border-white/5">
            <View>
                <Text className="text-2xl font-black text-slate-900 dark:text-white">{title}</Text>
                {subtitle && <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text>}
            </View>
            <TouchableOpacity 
                onPress={toggleColorScheme}
                className="relative p-2.5 rounded-full bg-surface shadow-sm border border-border active:scale-95"
            >
                <MaterialIcons 
                    name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'} 
                    size={20} 
                    color={colorScheme === 'dark' ? '#fde047' : '#64748b'} 
                />
            </TouchableOpacity>
        </View>
    );
};
