import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGithubUser } from '../../hooks/useGithubUser';

// Generates a random GitHub-like contribution graph
const generateContributionData = () => {
    const weeks = 16;
    const days = 7;
    const data = [];
    for (let w = 0; w < weeks; w++) {
        const week = [];
        for (let d = 0; d < days; d++) {
            // Skew towards 0, with occasional high activity
            const rand = Math.random();
            let level = 0;
            if (rand > 0.85) level = 4;
            else if (rand > 0.7) level = 3;
            else if (rand > 0.5) level = 2;
            else if (rand > 0.35) level = 1;
            
            week.push(level);
        }
        data.push(week);
    }
    return data;
};

export default function DashboardScreen() {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const contributionData = useMemo(() => generateContributionData(), []);
    const { user, loading } = useGithubUser();
    const { logout } = useAuth();

    const getLevelColor = (level: number) => {
        if (colorScheme === 'dark') {
            switch(level) {
                case 4: return 'bg-[#39d353]'; // GitHub highest dark
                case 3: return 'bg-[#26a641]';
                case 2: return 'bg-[#006d32]';
                case 1: return 'bg-[#0e4429]';
                default: return 'bg-[#161b22] border border-white/5'; // GitHub empty dark
            }
        } else {
            switch(level) {
                case 4: return 'bg-[#216e39]'; // GitHub highest light
                case 3: return 'bg-[#30a14e]';
                case 2: return 'bg-[#40c463]';
                case 1: return 'bg-[#9be9a8]';
                default: return 'bg-[#ebedf0] border border-black/5'; // GitHub empty light
            }
        }
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-30 border-b border-slate-200/50 dark:border-slate-800/50">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={logout} className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-slate-200 dark:bg-slate-800">
                        {user?.avatar_url ? (
                            <Image
                                source={{ uri: user.avatar_url }}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center">
                                <MaterialIcons name="person" size={20} color="#94a3b8" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">Good morning,</Text>
                        <Text className="font-bold text-lg leading-none text-slate-900 dark:text-slate-100">
                            {loading ? 'Loading...' : (user?.name || user?.login || 'Developer')}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={toggleColorScheme}
                        className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95"
                    >
                        <MaterialIcons 
                            name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'} 
                            size={20} 
                            color={colorScheme === 'dark' ? '#fde047' : '#64748b'} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95">
                        <MaterialIcons name="notifications" size={20} color="#64748b" />
                        <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-sm shadow-primary/50"></View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerClassName="px-5 pb-32 pt-6" className="flex-1 relative overflow-hidden" showsVerticalScrollIndicator={false}>
                {/* Streak Hero Card */}
                <View className="relative overflow-hidden rounded-2xl p-6 bg-slate-900 border border-primary/30 shadow-2xl shadow-primary/10 mb-8">
                    <LinearGradient
                        colors={['rgba(19, 236, 19, 0.25)', '#0f172a', '#020617']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 16 }}
                    />
                    <View className="relative z-10 flex-row justify-between items-start">
                        <View>
                            <View className="flex-row items-center gap-2 mb-1">
                                <MaterialIcons name="local-fire-department" size={32} color="#13ec13" />
                                <Text className="text-5xl font-black text-white tracking-tighter">15</Text>
                            </View>
                            <Text className="text-primary font-bold text-sm uppercase tracking-widest pl-1">Days Streak</Text>
                        </View>
                        <View className="items-end bg-black/30 px-3 py-2 rounded-xl border border-white/5 backdrop-blur-sm">
                            <Text className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Ends In</Text>
                            <Text className="text-lg font-mono font-bold text-white tracking-wider">04:22:59</Text>
                        </View>
                    </View>

                    {/* Streak Status Message */}
                    <View className="mt-8 flex-row items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
                        <View className="flex-row items-center gap-2.5">
                            <View className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></View>
                            <Text className="text-sm font-medium text-slate-200">Today's commit missing</Text>
                        </View>
                        <TouchableOpacity className="px-4 py-2 bg-primary rounded-full shadow-lg shadow-primary/40 active:scale-95">
                            <Text className="text-black text-xs font-black tracking-wider uppercase">Commit Now</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Abstract background pattern */}
                    <View className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none transform rotate-12">
                        <FontAwesome5 name="github" size={180} color="#13ec13" />
                    </View>
                </View>

                {/* GitHub Style Heatmap */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Contributions</Text>
                        <View className="bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                            <MaterialIcons name="trending-up" size={14} color="#13ec13" />
                            <Text className="text-[11px] font-bold text-primary">84 in the last month</Text>
                        </View>
                    </View>
                    
                    <View className="bg-white dark:bg-[#0d1117] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-1">
                            {contributionData.map((week, weekIdx) => (
                                <View key={`week-${weekIdx}`} className="gap-1">
                                    {week.map((level, dayIdx) => (
                                        <View 
                                            key={`day-${weekIdx}-${dayIdx}`} 
                                            className={`w-[11px] h-[11px] rounded-[2px] ${getLevelColor(level)}`}
                                        />
                                    ))}
                                </View>
                            ))}
                        </ScrollView>
                        
                        <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <Text className="text-xs text-slate-500 font-medium">Learn how we count contributions</Text>
                            <View className="flex-row items-center gap-1.5">
                                <Text className="text-[10px] text-slate-500">Less</Text>
                                {[0, 1, 2, 3, 4].map(level => (
                                    <View key={`legend-${level}`} className={`w-3 h-3 rounded-[2px] ${getLevelColor(level)}`} />
                                ))}
                                <Text className="text-[10px] text-slate-500">More</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Productivity Stats Grid */}
                <View className="flex-row gap-4 mb-8">
                    <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 shadow-sm">
                        <View className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-full items-center justify-center mb-3">
                            <MaterialIcons name="folder" size={20} color="#3b82f6" />
                        </View>
                        <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {loading ? '-' : (user?.public_repos || 0)}
                        </Text>
                        <Text className="text-sm text-slate-500 font-medium mt-1">Public Repos</Text>
                    </View>
                    <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 shadow-sm">
                        <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mb-3">
                            <MaterialIcons name="people" size={20} color="#13ec13" />
                        </View>
                        <Text className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {loading ? '-' : (user?.followers || 0)}
                        </Text>
                        <Text className="text-sm text-slate-500 font-medium mt-1">Followers</Text>
                    </View>
                </View>

                {/* Developer Tip */}
                <View className="bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/5 dark:to-transparent border border-primary/20 rounded-2xl p-5 flex-row items-start gap-4">
                    <View className="p-2.5 bg-primary/20 dark:bg-primary/30 rounded-xl">
                        <MaterialIcons name="lightbulb" size={20} color="#0da00d" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs font-bold text-primary uppercase mb-1.5 tracking-widest">Developer Tip</Text>
                        <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            Small, atomic commits are better for your team (and your streak) than one giant end-of-day push. Commit early, commit often.
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}