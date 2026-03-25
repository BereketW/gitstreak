import { View, Text, ScrollView, TouchableOpacity, Animated, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGithubUser } from '../../hooks/useGithubUser';
import { useGithubContributions, ContributionDay } from '../../hooks/useGithubContributions';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import * as Haptics from 'expo-haptics';
import { useGithubEvents } from '../../hooks/useGithubEvents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardScreen() {
    const { colorScheme } = useColorScheme();
    const { toggleTheme } = useTheme();
     const { user } = useGithubUser();
    const { logout } = useAuth();
     
     const currentYear = new Date().getFullYear();
     const [selectedYear, setSelectedYear] = useState<number>(currentYear);
     const { calendar, streak, loading: calendarLoading, contributionYears, refresh: refreshContributions } = useGithubContributions(user?.login, selectedYear);
     const { events, refresh: refreshEvents } = useGithubEvents();
     const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
     const insets = useSafeAreaInsets();
     const router = useRouter();
     
     useFocusEffect(
         useCallback(() => {
             refreshContributions();
             refreshEvents();
         }, [refreshContributions, refreshEvents])
     );
     
     const maxDailyContributions = useMemo(() => {
         if (!calendar) return 0;
         let max = 0;
         calendar.weeks.forEach(week => {
             week.contributionDays.forEach(day => {
                 if (day.contributionCount > max) {
                     max = day.contributionCount;
                 }
             });
         });
         return max;
     }, [calendar]);
     
     const todayContributions = useMemo(() => {
         if (!calendar) return 0;
         const now = new Date();
         const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
         let todayCount = 0;
         const todayDay = calendar.weeks.flatMap(w => w.contributionDays).find(d => d.date === today);
         if (todayDay) todayCount = todayDay.contributionCount;
         
         // Fallback: If Github's calendar graph API hasn't updated yet, check realtime events
         if (todayCount === 0 && events && events.length > 0) {
             const hasRealtimePushEventToday = events.some(e => {
                 if (e.type !== "PushEvent") return false;
                 // Event was in last 24hrs
                 const diffHours = (now.getTime() - new Date(e.created_at).getTime()) / (1000 * 60 * 60);
                 return diffHours < 24;
             });
             if (hasRealtimePushEventToday) todayCount = 1;
         }
         return todayCount;
     }, [calendar, events]);

     const latestCommitToday = useMemo(() => {
        if (!events || events.length === 0) return null;
        
        // Find the most recent push event that happened in the last 24 hours
        const recentPushes = events.filter(e => e.type === "PushEvent");
        
        for (const push of recentPushes) {
            const eventDate = new Date(push.created_at);
            const now = new Date();
            const diffHours = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
            
            // If it was less than 24 hours ago, consider it today's latest commit
            if (diffHours < 24 && push.payload?.commits?.length > 0) {
                const commits = push.payload.commits;
                // Usually the last commit in the array is the most recent
                return commits[commits.length - 1].message;
            }
        }
        return null;
     }, [events]);
    
    const scrollY = useRef(new Animated.Value(0)).current;

    const availableYears = useMemo(() => {
        return contributionYears.length > 0 ? contributionYears : [currentYear];
    }, [contributionYears, currentYear]);

    const monthLabels = useMemo(() => {
        if (!calendar) return [];
        const labels: { month: string, weekIdx: number }[] = [];
        let currentMonth = -1;
        calendar.weeks.forEach((week, weekIdx) => {
            if (week.contributionDays.length > 0) {
                const date = new Date(week.contributionDays[0].date);
                const month = date.getMonth();
                if (month !== currentMonth) {
                    labels.push({ month: date.toLocaleString('default', { month: 'short' }), weekIdx });
                    currentMonth = month;
                }
            }
        });
        return labels;
    }, [calendar]);

    const displayStreakToday = (!streak.today && todayContributions > 0) ? true : streak.today;
    const displayStreakCurrent = (!streak.today && todayContributions > 0) ? streak.current + 1 : streak.current;
    const displayStreakLongest = Math.max(streak.longest, displayStreakCurrent);
    
    const isRecordStreak = displayStreakCurrent >= displayStreakLongest && displayStreakCurrent > 0;
    const isRecordDay = maxDailyContributions > 0 && todayContributions >= maxDailyContributions;
    const isGamified = isRecordStreak || isRecordDay;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0.9],
        extrapolate: 'clamp',
    });

    return (
        <View className="flex-1 bg-slate-50 dark:bg-background-dark font-sans">
            <Animated.View 
                className="absolute left-0 right-0 z-30 pb-4 px-6 flex-row items-center justify-between bg-slate-50 dark:bg-background-dark border-b border-slate-200/50 dark:border-border/30"
                style={{ opacity: headerOpacity, paddingTop: Math.max(insets.top, 20) + 16, top: 0 }}
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={logout} className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-border overflow-hidden bg-white dark:bg-surface">
                        {user?.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} className="w-full h-full" />
                        ) : (
                            <MaterialIcons name="person" size={20} color="#8b949e" />
                        )}
                    </TouchableOpacity>
                    <View>
                        <Text className="text-[12px] text-slate-500 dark:text-text-secondary">Good morning, Jan</Text>
                        <Text className="font-bold text-[14px] text-slate-900 dark:text-text-primary">
                            {user?.login || 'Developer'}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push('/streak-assist');
                        }}
                        className="relative p-2.5 rounded-full bg-white dark:bg-surface shadow-sm border border-slate-200 dark:border-border active:scale-95 overflow-hidden"
                    >
                        <View className="absolute inset-0 bg-primary/10 dark:bg-primary/20" />
                        <MaterialIcons name="auto-awesome" size={20} color="#3fb950" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={toggleTheme}
                        className="relative p-2.5 rounded-full bg-white dark:bg-surface shadow-sm border border-slate-200 dark:border-border active:scale-95"
                    >
                        <MaterialIcons 
                            name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'} 
                            size={20} 
                            color={colorScheme === 'dark' ? '#fde047' : '#8b949e'} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity className="relative p-2.5 rounded-full bg-white dark:bg-surface shadow-sm border border-slate-200 dark:border-border active:scale-95">
                        <MaterialIcons name="notifications" size={20} color="#8b949e" />
                        <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-sm shadow-primary/50"></View>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView 
                contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 90, paddingBottom: 120, paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={false} // Prevent default indicator to avoid overlapping custom logic or just use boolean from hooks
                        onRefresh={() => {
                            refreshContributions();
                            refreshEvents();
                        }}
                        tintColor={colorScheme === 'dark' ? '#3fb950' : '#3fb950'}
                    />
                }
            >
                <View className={`p-6 mb-8 overflow-hidden shadow-2xl relative ${isGamified ? 'rounded-tl-[32px] rounded-br-[32px] rounded-tr-xl rounded-bl-xl border-2 border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-yellow-500/30' : 'rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border'}`}>
                    <View className={`absolute inset-0 ${isGamified ? 'bg-yellow-400/10 dark:bg-yellow-500/10' : 'bg-green-50 dark:bg-[#0d2b0d]'}`} />
                    <View className="flex-row justify-between items-start z-10">
                        <View>
                            <View className="flex-row items-center gap-2 mb-1">
                                <Text className="text-3xl">🔥</Text>
                                <AnimatedNumber 
                                    value={calendarLoading ? 0 : displayStreakCurrent} 
                                    style={{ fontSize: 52, fontWeight: 'bold', color: colorScheme === 'dark' ? '#e6edf3' : '#0f172a', fontFamily: 'JetBrainsMono-Bold' }} 
                                />
                            </View>
                            <Text className="text-primary font-bold text-[11px] uppercase tracking-widest pl-1">day streak</Text>
                        </View>
                        <View className="items-end gap-1.5 mt-1">
                            <View className="bg-slate-100 dark:bg-background-dark/30 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
                                <Text className="text-[10px] text-slate-500 dark:text-text-secondary uppercase tracking-widest font-bold">Best: {displayStreakLongest}</Text>
                            </View>
                            <View className="bg-slate-100 dark:bg-background-dark/30 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
                                <Text className="text-[10px] text-slate-500 dark:text-text-secondary uppercase tracking-widest font-bold text-center">
                                    Today: <Text className="text-slate-700 dark:text-white">{todayContributions}</Text>  /  High: <Text className="text-slate-700 dark:text-white">{maxDailyContributions}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex-col gap-3">
                        <View className="flex-row items-center gap-2">
                            <View className={`w-2 h-2 rounded-full ${displayStreakToday ? 'bg-[#3fb950]' : 'bg-warning'}`} />
                            <Text className="text-[12px] text-slate-800 dark:text-text-primary font-medium">
                                {displayStreakToday ? "● Committed today · You're safe" : "⚠ Today's commit missing"}
                            </Text>
                        </View>
                        {latestCommitToday && (
                            <View className="flex-row items-start gap-2 bg-white/50 dark:bg-black/20 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                                <Octicons name="git-commit" size={14} color={colorScheme === 'dark' ? '#8b949e' : '#64748b'} className="mt-0.5" />
                                <Text className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex-1" numberOfLines={2}>
                                    Latest: {latestCommitToday}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="flex-row gap-3 mb-8">
                    {[
                        { label: 'commits', val: calendar?.totalContributions || 0, icon: 'git-commit' },
                        { label: 'repos', val: user?.public_repos || 0, icon: 'repo' },
                        { label: 'followers', val: user?.followers || 0, icon: 'people' }
                    ].map((item, i) => (
                        <TouchableOpacity key={i} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} className="flex-1 bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl p-4 items-center">
                            <Octicons name={item.icon as any} size={16} color={item.val > 0 ? (colorScheme === 'dark' ? '#e6edf3' : '#0f172a') : '#6e7681'} />
                            <Text className={`font-mono text-xl font-bold mt-2 ${item.val > 0 ? 'text-slate-900 dark:text-text-primary' : 'text-slate-400 dark:text-broken'}`}>{item.val}</Text>
                            <Text className="text-[10px] text-slate-500 dark:text-text-secondary uppercase">{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="mb-8">
                     <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[11px] text-slate-500 dark:text-text-secondary font-bold uppercase tracking-widest">Contributions</Text>
                        <View className="flex-row gap-2">
                            {availableYears.map(yr => (
                                <TouchableOpacity 
                                    key={yr} 
                                    onPress={() => setSelectedYear(yr)}
                                    className={`px-3 py-1 rounded-full border ${selectedYear === yr ? 'bg-primary/10 dark:bg-primary/20 border-primary' : 'bg-white dark:bg-surface border-slate-200 dark:border-border'}`}
                                >
                                    <Text className={`text-[10px] font-bold ${selectedYear === yr ? 'text-primary' : 'text-slate-500 dark:text-text-secondary'}`}>{yr}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="bg-white dark:bg-surface border border-slate-200 dark:border-border p-5 rounded-2xl">
                        <View className="h-6 mb-2 flex-row items-center">
                            {selectedDay ? (
                                <Text className="text-xs font-bold text-slate-900 dark:text-text-primary">
                                    {selectedDay.contributionCount} contributions on {new Date(selectedDay.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            ) : (
                                <Text className="text-xs font-medium text-slate-500 dark:text-text-secondary">Tap a day to see details</Text>
                            )}
                        </View>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="pb-2">
                             <View className="flex-col">
                                <View className="flex-row h-5 relative mb-1">
                                    {monthLabels.map((lbl, idx) => (
                                        <Text 
                                            key={idx} 
                                            className="absolute text-[10px] text-slate-500 font-medium" 
                                            style={{ left: lbl.weekIdx * 15 }}
                                        >
                                            {lbl.month}
                                        </Text>
                                    ))}
                                </View>
                                <View className="flex-row gap-1">
                                    {calendarLoading ? (
                                        <ActivityIndicator size="small" color="#3fb950" />
                                    ) : calendar?.weeks.map((week, weekIdx) => (
                                    <View key={weekIdx} className="gap-1">
                                        {week.contributionDays.map((day, dayIdx) => (
                                            <TouchableOpacity 
                                                key={dayIdx} 
                                                onPress={() => setSelectedDay(day)}
                                                activeOpacity={0.7}
                                            >
                                                <View 
                                                    className={`w-[11px] h-[11px] rounded-sm ${day.contributionCount === 0 ? 'bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-border' : ''} ${selectedDay?.date === day.date ? 'border-2 border-primary scale-125' : ''}`}
                                                    style={day.contributionCount > 0 ? { backgroundColor: day.color } : {}}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
