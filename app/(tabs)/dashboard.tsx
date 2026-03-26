import { View, Text, ScrollView, TouchableOpacity, Animated, Image, RefreshControl } from 'react-native';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGithubUser } from '../../hooks/useGithubUser';
import { useGithubContributions, ContributionDay } from '../../hooks/useGithubContributions';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import * as Haptics from 'expo-haptics';
import { useGithubEvents } from '../../hooks/useGithubEvents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from '../../components/NotificationDropdown';
import { LinearGradient } from 'expo-linear-gradient';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function DashboardScreen() {
    const { isDark, toggleTheme } = useTheme();
    const { unreadCount, toggleDropdown } = useNotifications();
    const { scheduleLocalNotification, isAvailable: notificationsAvailable } = usePushNotifications();
    const { user, error: userError } = useGithubUser();
    const { logout } = useAuth();
     
     const currentYear = new Date().getFullYear();
     const [selectedYear, setSelectedYear] = useState<number>(currentYear);
     const { calendar, streak, loading: calendarLoading, refreshing: calendarRefreshing, contributionYears, refresh: refreshContributions, error: calendarError } = useGithubContributions(user?.login, selectedYear);
     const { events, refreshing: eventsRefreshing, refresh: refreshEvents, error: eventsError } = useGithubEvents();
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

    if (userError || calendarError || eventsError) {
        const errorMessage = userError || calendarError || eventsError;
        return (
            <ErrorState 
                message={errorMessage || 'Failed to load dashboard data'} 
                onRetry={() => {
                    refreshContributions();
                    refreshEvents();
                }} 
            />
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-background-dark font-sans">
            <Animated.View 
                className="absolute left-0 right-0 z-30 pb-4 px-6 flex-row items-center justify-between bg-slate-50 dark:bg-background-dark border-b border-slate-200/50 dark:border-border/30"
                style={{ opacity: headerOpacity, paddingTop: Math.max(insets.top, 20) + 16, top: 0 }}
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={logout} className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-border overflow-hidden bg-white dark:bg-surface">
                        {user?.avatar_url ? (
                            <Image source={{ uri: `${user.avatar_url}&size=80` }} className="w-full h-full" />
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
                            name={isDark ? 'light-mode' : 'dark-mode'} 
                            size={20} 
                            color={isDark ? '#fde047' : '#8b949e'} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={toggleDropdown}
                        onLongPress={async () => {
                            if (notificationsAvailable) {
                                await scheduleLocalNotification({
                                    title: '🔥 Streak Alert!',
                                    body: "You haven't committed in 20 hours. Keep your streak alive!",
                                    data: { type: 'streak', screen: 'streak-assist' },
                                    type: 'streak',
                                });
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } else {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            }
                        }}
                        className="relative p-2.5 rounded-full bg-white dark:bg-surface shadow-sm border border-slate-200 dark:border-border active:scale-95"
                    >
                        <MaterialIcons name="notifications" size={20} color={unreadCount > 0 ? "#3fb950" : "#8b949e"} />
                        {unreadCount > 0 && (
                            <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary rounded-full items-center justify-center px-1 shadow-sm shadow-primary/50">
                                <Text className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
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
                        refreshing={calendarRefreshing || eventsRefreshing}
                        onRefresh={() => {
                            refreshContributions();
                            refreshEvents();
                        }}
                        tintColor={isDark ? '#3fb950' : '#3fb950'}
                    />
                }
            >
                {/* ── Vibrant Streak Card ── */}
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/streak-assist');
                    }}
                    className="mb-8 rounded-3xl overflow-hidden shadow-2xl"
                    style={{ shadowColor: '#3fb950', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } }}
                >
                    <LinearGradient
                        colors={isDark 
                            ? ['#0a3d1a', '#166534', '#15803d', '#0a3d1a'] 
                            : ['#16a34a', '#22c55e', '#4ade80', '#16a34a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-6 pb-5"
                    >
                        {/* Lightning Bolt Hero */}
                        <View className="items-center mb-1">
                            <View className="w-20 h-20 items-center justify-center mb-3">
                                <View className="absolute w-16 h-16 rounded-full bg-white/20" style={{ shadowColor: '#fff', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }} />
                                <MaterialIcons name="bolt" size={52} color="rgba(255,255,255,0.9)" />
                            </View>
                            
                            {/* Streak Count */}
                            <Text className="text-white text-4xl font-black tracking-tight mb-1" style={{ textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 8 }}>
                                {calendarLoading ? '...' : displayStreakCurrent} {displayStreakCurrent === 1 ? 'Day' : 'Days'} Streak
                            </Text>
                            <Text className="text-white/80 text-sm font-medium text-center mb-5">
                                {displayStreakCurrent === 0 
                                    ? "Start your streak today — make a commit!" 
                                    : displayStreakCurrent < 3 
                                        ? `Nice start, keep pushing, ${user?.login || 'dev'}!`
                                        : displayStreakCurrent < 7
                                            ? `You're doing great, on fire, ${user?.login || 'dev'}!`
                                            : `Unstoppable! ${displayStreakCurrent} days strong 💪`}
                            </Text>
                        </View>

                        {/* Weekly Day Tracker */}
                        <View className="bg-white/15 rounded-2xl px-4 py-3 mb-3" style={{ backdropFilter: 'blur(20px)' }}>
                            <View className="flex-row justify-between items-center">
                                {(() => {
                                    const today = new Date();
                                    const todayDow = today.getDay(); // 0=Sun
                                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                    
                                    // Build Mon–Sun of the current week
                                    // Monday offset: if today is Sunday (0), Monday was 6 days ago; otherwise (todayDow - 1) days ago
                                    const mondayOffset = todayDow === 0 ? 6 : todayDow - 1;
                                    const weekDays = [];
                                    for (let i = 0; i < 7; i++) {
                                        const d = new Date(today);
                                        d.setDate(today.getDate() - mondayOffset + i);
                                        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                        const dayName = days[i];
                                        const isToday = d.toDateString() === today.toDateString();
                                        const isFuture = d > today && !isToday;
                                        
                                        let hasContribution = false;
                                        if (!isFuture && calendar) {
                                            const found = calendar.weeks.flatMap(w => w.contributionDays).find(cd => cd.date === dateStr);
                                            if (found && found.contributionCount > 0) hasContribution = true;
                                        }
                                        if (isToday && todayContributions > 0) hasContribution = true;
                                        
                                        weekDays.push({ dayName, isToday, isFuture, hasContribution, dateStr });
                                    }
                                    
                                    return weekDays.map((day, idx) => (
                                        <View key={idx} className="items-center gap-1.5">
                                            <View className={`w-9 h-9 rounded-full items-center justify-center ${day.isToday ? 'bg-white/25 border-2 border-white/50' : ''}`}>
                                                {day.isToday ? (
                                                    <Text className="text-base">🔥</Text>
                                                ) : day.hasContribution ? (
                                                    <View className="w-7 h-7 rounded-full bg-white/30 items-center justify-center">
                                                        <MaterialIcons name="check" size={16} color="white" />
                                                    </View>
                                                ) : (
                                                    <View className={`w-7 h-7 rounded-full border-2 ${day.isFuture ? 'border-white/15' : 'border-white/25'}`} />
                                                )}
                                            </View>
                                            <Text className={`text-[10px] font-bold ${day.isToday ? 'text-white' : day.isFuture ? 'text-white/40' : 'text-green-100'}`}>{day.dayName}</Text>
                                        </View>
                                    ));
                                })()}
                            </View>
                        </View>

                        {/* See Details */}
                        <View className="items-center mt-1">
                            <View className="flex-row items-center gap-1">
                                <Text className="text-white/70 text-sm font-semibold">See Details</Text>
                                <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>


                <View className="flex-row gap-3 mb-8">
                    {[
                        { label: 'commits', val: calendar?.totalContributions || 0, icon: 'git-commit' },
                        { label: 'repos', val: user?.public_repos || 0, icon: 'repo' },
                        { label: 'followers', val: user?.followers || 0, icon: 'people' }
                    ].map((item, i) => (
                        <TouchableOpacity key={i} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} className="flex-1 bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl p-4 items-center">
                            <Octicons name={item.icon as any} size={16} color={item.val > 0 ? (isDark ? '#e6edf3' : '#0f172a') : '#6e7681'} />
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
                                        Array.from({ length: 52 }).map((_, weekIdx) => (
                                            <View key={weekIdx} className="gap-1">
                                                {Array.from({ length: 7 }).map((_, dayIdx) => (
                                                    <Skeleton key={dayIdx} className="w-[11px] h-[11px] rounded-sm" />
                                                ))}
                                            </View>
                                        ))
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

            <NotificationDropdown />
        </View>
    );
}
