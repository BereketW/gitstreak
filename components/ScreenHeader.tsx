import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
}

export const ScreenHeader = ({ title, subtitle }: ScreenHeaderProps) => {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    
    return (
        <View 
            style={{ paddingTop: Math.max(insets.top, 20) + 16 }}
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-6 pb-4 bg-background-light/90 dark:bg-[#0a0f18]/90 backdrop-blur-xl z-30 border-b border-slate-200/50 dark:border-white/5"
        >
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
