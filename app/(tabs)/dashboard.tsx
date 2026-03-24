import { View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useGithubUser } from '../../hooks/useGithubUser';
import { useGithubContributions, ContributionDay } from '../../hooks/useGithubContributions';
import { MojaGazetkaBottomSheet, CategoryItem } from '../../components/MojaGazetkaBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const AnimatedNumber = ({ value, className, suffix = '' }: { value: number | string, className?: string, suffix?: string }) => {
    const animatedValue = useSharedValue(0);

    useEffect(() => {
        if (typeof value === 'number') {
            animatedValue.value = 0;
            animatedValue.value = withTiming(value, {
                duration: 400,
                easing: Easing.out(Easing.cubic),
            });
        }
    }, [value, animatedValue]);

    const animatedProps = useAnimatedProps(() => {
        const textValue = typeof value === 'number' 
            ? Math.round(animatedValue.value).toString() + suffix 
            : String(value) + suffix;
            
        return {
            text: textValue,
            defaultValue: textValue,
        } as any;
    });

    if (typeof value === 'string' && isNaN(Number(value))) {
        return <Text className={className}>{value}{suffix}</Text>;
    }

    return (
        <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            animatedProps={animatedProps}
            className={className}
            style={{ padding: 0, margin: 0 }}
        />
    );
};

export default function DashboardScreen() {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const { user, loading } = useGithubUser();
    const { logout } = useAuth();
    
    // Bottom Sheet state
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const { calendar, streak, loading: calendarLoading, contributionYears } = useGithubContributions(user?.login, selectedYear);
    const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);

    const bestDay = useMemo<ContributionDay | null>(() => {
        if (!calendar) return null;
        let max = 0;
        let best: ContributionDay | null = null;
        calendar.weeks.forEach(week => {
            week.contributionDays.forEach(day => {
                if (day.contributionCount > max) {
                    max = day.contributionCount;
                    best = day;
                }
            });
        });
        return best;
    }, [calendar]);

    const handlePresentModalPress = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const availableYears = useMemo(() => {
        return contributionYears.length > 0 ? contributionYears : [currentYear];
    }, [contributionYears, currentYear]);

    const months = [
        { label: 'All', value: null },
        { label: 'Jan', value: 0 },
        { label: 'Feb', value: 1 },
        { label: 'Mar', value: 2 },
        { label: 'Apr', value: 3 },
        { label: 'May', value: 4 },
        { label: 'Jun', value: 5 },
        { label: 'Jul', value: 6 },
        { label: 'Aug', value: 7 },
        { label: 'Sep', value: 8 },
        { label: 'Oct', value: 9 },
        { label: 'Nov', value: 10 },
        { label: 'Dec', value: 11 }
    ];

    const processedWeeks = useMemo(() => {
        if (!calendar) return [];
        let weeks = calendar.weeks;
        
        if (selectedMonth !== null) {
            // Only keep weeks that have at least one day in the selected month
            weeks = weeks.filter(week => 
                week.contributionDays.some(day => new Date(day.date).getMonth() === selectedMonth)
            );
        }

        return weeks.map(week => {
            // Ensure 7 days, padded with nulls for correct weekday alignment
            const paddedDays: (ContributionDay | null)[] = Array(7).fill(null);
            week.contributionDays.forEach(day => {
                const date = new Date(day.date);
                const dayOfWeek = date.getDay(); // 0 is Sunday
                
                // If filtering by month, only include days of the selected month
                if (selectedMonth === null || date.getMonth() === selectedMonth) {
                    paddedDays[dayOfWeek] = day;
                }
            });
            return { paddedDays };
        });
    }, [calendar, selectedMonth]);

    const monthLabels = useMemo(() => {
        if (!calendar || selectedMonth !== null) return [];
        const labels: { label: string, weekIndex: number }[] = [];
        let currentM = -1;
        
        processedWeeks.forEach((week, index) => {
            // Find first valid day in the week to check its month
            const firstDay = week.paddedDays.find(d => d !== null);
            if (firstDay) {
                const date = new Date(firstDay.date);
                if (date.getMonth() !== currentM) {
                    labels.push({ label: date.toLocaleString('default', { month: 'short' }), weekIndex: index });
                    currentM = date.getMonth();
                }
            }
        });
        return labels;
    }, [calendar, processedWeeks, selectedMonth]);

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
                        onPress={handlePresentModalPress}
                        className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95"
                    >
                        <MaterialIcons name="grid-view" size={20} color="#64748b" />
                    </TouchableOpacity>
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

            <ScrollView contentContainerClassName="px-5 pb-32 pt-6" className="flex-1 relative" showsVerticalScrollIndicator={false}>
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
                                <AnimatedNumber 
                                    value={calendarLoading ? '-' : streak.current} 
                                    className="text-5xl font-black text-white tracking-tighter" 
                                />
                            </View>
                            <Text className="text-primary font-bold text-sm uppercase tracking-widest pl-1">Days Streak</Text>
                        </View>
                        <View className="items-end bg-black/30 px-3 py-2 rounded-xl border border-white/5 backdrop-blur-sm">
                            <Text className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Longest Streak</Text>
                            <AnimatedNumber 
                                value={calendarLoading ? '-' : streak.longest} 
                                suffix=" Days"
                                className="text-lg font-mono font-bold text-white tracking-wider" 
                            />
                        </View>
                    </View>

                    {/* Streak Status Message */}
                    <View className="mt-8 flex-row items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
                        <View className="flex-row items-center gap-2.5">
                            <View className={`w-2.5 h-2.5 rounded-full ${streak.today ? 'bg-[#39d353] shadow-[0_0_8px_rgba(57,211,83,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'}`}></View>
                            <Text className="text-sm font-medium text-slate-200">
                                {calendarLoading ? 'Checking streak...' : streak.today ? "Today's commit secured!" : "Today's commit missing"}
                            </Text>
                        </View>
                        {!streak.today && (
                            <TouchableOpacity className="px-4 py-2 bg-primary rounded-full shadow-lg shadow-primary/40 active:scale-95">
                                <Text className="text-black text-xs font-black tracking-wider uppercase">Commit Now</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Abstract background pattern */}
                    <View className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none transform rotate-12">
                        <FontAwesome5 name="github" size={180} color="#13ec13" />
                    </View>
                </View>

                {/* GitHub Style Heatmap */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Contributions</Text>
                            <Text className="text-xs font-medium text-slate-400 mt-0.5">
                                {calendarLoading ? 'Loading...' : `${calendar?.totalContributions} total in ${selectedYear}`}
                            </Text>
                        </View>
                    </View>

                    {/* Pro Filters: Years & Months */}
                    <View className="mb-4">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                            <View className="flex-row gap-2 px-1">
                                {availableYears.map(yr => (
                                    <TouchableOpacity 
                                        key={yr} 
                                        onPress={() => setSelectedYear(yr)}
                                        className={`px-3 py-1.5 rounded-full border ${selectedYear === yr ? 'bg-primary/20 border-primary/40' : 'bg-transparent border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Text className={`text-[10px] font-bold ${selectedYear === yr ? 'text-primary' : 'text-slate-500'}`}>{yr}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2 px-1">
                                {months.map(m => (
                                    <TouchableOpacity 
                                        key={m.label} 
                                        onPress={() => setSelectedMonth(m.value)}
                                        className={`px-3 py-1.5 rounded-full border ${selectedMonth === m.value ? 'bg-blue-500/20 border-blue-500/40' : 'bg-transparent border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Text className={`text-[10px] font-bold ${selectedMonth === m.value ? 'text-blue-500' : 'text-slate-500'}`}>{m.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                    
                    <View className="bg-white dark:bg-[#0d1117] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm z-10">
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            className="flex-1 relative"
                            contentContainerClassName="pb-2 pt-10"
                            ref={(ref) => {
                                // Auto-scroll to the end (most recent days) when loaded
                                if (!calendarLoading && selectedMonth === null) {
                                    setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
                                }
                            }}
                        >
                            <View>
                                {/* Month Labels */}
                                {selectedMonth === null && (
                                    <View className="flex-row mb-2 relative h-4">
                                        {monthLabels.map((m, i) => (
                                            <Text 
                                                key={`${m.label}-${i}`} 
                                                className="absolute text-[10px] font-medium text-slate-500"
                                                style={{ left: m.weekIndex * 15 }} // 11px width + 4px gap = 15px
                                            >
                                                {m.label}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                                
                                {/* Grid */}
                                <View className="flex-row gap-1">
                                    {calendarLoading ? (
                                        <View className="h-[101px] w-[300px] flex-1 items-center justify-center">
                                            <Text className="text-slate-400 text-xs">Fetching graph...</Text>
                                        </View>
                                    ) : processedWeeks.map((week, weekIdx) => (
                                        <View 
                                            key={`week-${weekIdx}`} 
                                            className="gap-1"
                                            style={{ zIndex: week.paddedDays.some(d => d && selectedDay && d.date === selectedDay.date) ? 50 : 1 }}
                                        >
                                            {week.paddedDays.map((day, dayIdx) => {
                                                if (!day) {
                                                    return <View key={`empty-${weekIdx}-${dayIdx}`} className="w-[11px] h-[11px]" />;
                                                }
                                                return (
                                                    <View 
                                                        key={`day-${weekIdx}-${dayIdx}`} 
                                                        className="relative"
                                                        style={{ zIndex: selectedDay?.date === day.date ? 50 : 1 }}
                                                    >
                                                        <TouchableOpacity 
                                                            onPress={() => setSelectedDay(day)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <View 
                                                                className={`w-[11px] h-[11px] rounded-[2px] ${day.contributionCount === 0 ? (colorScheme === 'dark' ? 'bg-[#161b22] border border-white/5' : 'bg-[#ebedf0] border border-black/5') : ''} ${selectedDay?.date === day.date ? 'border-[1.5px] border-primary scale-125 z-20 shadow-sm shadow-primary/50' : ''}`}
                                                                style={day.contributionCount > 0 ? { backgroundColor: day.color } : {}}
                                                            />
                                                        </TouchableOpacity>
                                                        
                                                        {selectedDay?.date === day.date && (
                                                            <View 
                                                                style={{ left: 5.5, transform: [{ translateX: -65 }] }}
                                                                className="absolute bottom-full mb-2 bg-slate-800 dark:bg-slate-200 px-3 py-2 rounded-lg shadow-xl w-[130px] items-center z-50 pointer-events-none"
                                                            >
                                                                <Text className="text-white dark:text-black text-[11px] font-bold mb-0.5">
                                                                    {day.contributionCount} contribution{day.contributionCount !== 1 ? 's' : ''}
                                                                </Text>
                                                                <Text className="text-slate-400 dark:text-slate-600 text-[9px] font-medium">
                                                                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </Text>
                                                                <View className="absolute top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-slate-200" />
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                        
                        <View className="flex-row justify-between items-center mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                            <Text className="text-[11px] text-slate-500 font-medium">
                                {calendarLoading ? 'Loading...' : `Total ${selectedYear}: ${calendar?.totalContributions || 0} contributions${bestDay ? ` · Best day: ${bestDay.contributionCount} (${new Date(bestDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})` : ''}`}
                            </Text>
                            <View className="flex-row items-center gap-1.5">
                                <Text className="text-[10px] text-slate-500">Less</Text>
                                <View className={`w-3 h-3 rounded-[2px] ${colorScheme === 'dark' ? 'bg-[#161b22] border border-white/5' : 'bg-[#ebedf0] border border-black/5'}`} />
                                <View className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#9be9a8' }} />
                                <View className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#40c463' }} />
                                <View className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#30a14e' }} />
                                <View className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#216e39' }} />
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

            <MojaGazetkaBottomSheet 
                ref={bottomSheetModalRef}
                selectedId={selectedCategory}
                onSelect={(item: CategoryItem) => {
                    setSelectedCategory(item.id);
                }}
            />
        </SafeAreaView>
    );
}