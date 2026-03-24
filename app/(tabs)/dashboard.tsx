import { View, Text, ScrollView, Image, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGithubUser } from '../../hooks/useGithubUser';
import { useGithubContributions, ContributionDay } from '../../hooks/useGithubContributions';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import * as Haptics from 'expo-haptics';
import { MojaGazetkaBottomSheet, CategoryItem } from '../../components/MojaGazetkaBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export default function DashboardScreen() {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const { user } = useGithubUser();
    const { logout } = useAuth();
    
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const { calendar, streak, loading: calendarLoading, contributionYears } = useGithubContributions(user?.login, selectedYear);
    const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
    
    const scrollY = useRef(new Animated.Value(0)).current;

    const availableYears = useMemo(() => {
        return contributionYears.length > 0 ? contributionYears : [currentYear];
    }, [contributionYears, currentYear]);

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

    const handlePresentModalPress = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0.9],
        extrapolate: 'clamp',
    });

    return (
        <View className="flex-1 bg-background-dark font-sans">
            <SafeAreaView edges={['top']} className="bg-background-dark" />
            <Animated.View 
                className="absolute top-[50px] left-0 right-0 z-30 pt-4 pb-4 px-6 flex-row items-center justify-between"
                style={{ opacity: headerOpacity }}
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={logout} className="w-10 h-10 rounded-full border-2 border-border overflow-hidden bg-surface">
                        {user?.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} className="w-full h-full" />
                        ) : (
                            <MaterialIcons name="person" size={20} color="#8b949e" />
                        )}
                    </TouchableOpacity>
                    <View>
                        <Text className="text-[12px] text-text-secondary">Good morning, Jan</Text>
                        <Text className="font-bold text-[14px] text-text-primary">
                            {user?.login || 'Developer'}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={handlePresentModalPress}
                        className="relative p-2.5 rounded-full bg-surface shadow-sm border border-border active:scale-95"
                    >
                        <MaterialIcons name="grid-view" size={20} color="#8b949e" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={toggleColorScheme}
                        className="relative p-2.5 rounded-full bg-surface shadow-sm border border-border active:scale-95"
                    >
                        <MaterialIcons 
                            name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'} 
                            size={20} 
                            color={colorScheme === 'dark' ? '#fde047' : '#8b949e'} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity className="relative p-2.5 rounded-full bg-surface shadow-sm border border-border active:scale-95">
                        <MaterialIcons name="notifications" size={20} color="#8b949e" />
                        <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-sm shadow-primary/50"></View>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView 
                contentContainerClassName="px-6 pt-24 pb-32"
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                <View className="rounded-2xl p-6 bg-surface border border-border mb-8 overflow-hidden shadow-2xl">
                    <View className="absolute inset-0 bg-[#0d2b0d]" />
                    <View className="flex-row justify-between items-start z-10">
                        <View>
                            <View className="flex-row items-center gap-2 mb-1">
                                <Text className="text-3xl">🔥</Text>
                                <AnimatedNumber 
                                    value={calendarLoading ? 0 : streak.current} 
                                    style={{ fontSize: 52, fontWeight: 'bold', color: '#e6edf3', fontFamily: 'JetBrainsMono-Bold' }} 
                                />
                            </View>
                            <Text className="text-primary font-bold text-[11px] uppercase tracking-widest pl-1">day streak</Text>
                        </View>
                        <View className="bg-background-dark/30 px-3 py-1 rounded-full border border-white/5">
                            <Text className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Best: {streak.longest}</Text>
                        </View>
                    </View>
                    <View className="mt-6 pt-4 border-t border-white/10 flex-row items-center gap-2">
                        <View className={`w-2 h-2 rounded-full ${streak.today ? 'bg-[#3fb950]' : 'bg-warning'}`} />
                        <Text className="text-[12px] text-text-primary font-medium">
                            {streak.today ? "● Committed today · You're safe" : "⚠ Today's commit missing"}
                        </Text>
                    </View>
                </View>

                <View className="flex-row gap-3 mb-8">
                    {[
                        { label: 'commits', val: 4, icon: 'git-commit' },
                        { label: 'repos', val: user?.public_repos || 0, icon: 'repo' },
                        { label: 'followers', val: user?.followers || 0, icon: 'people' }
                    ].map((item, i) => (
                        <TouchableOpacity key={i} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} className="flex-1 bg-surface border border-border rounded-xl p-4 items-center">
                            <Octicons name={item.icon as any} size={16} color={item.val > 0 ? '#e6edf3' : '#6e7681'} />
                            <Text className={`font-mono text-xl font-bold mt-2 ${item.val > 0 ? 'text-text-primary' : 'text-broken'}`}>{item.val}</Text>
                            <Text className="text-[10px] text-text-secondary uppercase">{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="mb-8">
                     <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[11px] text-text-secondary font-bold uppercase tracking-widest">Contributions</Text>
                        <View className="flex-row gap-2">
                            {availableYears.map(yr => (
                                <TouchableOpacity 
                                    key={yr} 
                                    onPress={() => setSelectedYear(yr)}
                                    className={`px-3 py-1 rounded-full border ${selectedYear === yr ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}
                                >
                                    <Text className={`text-[10px] font-bold ${selectedYear === yr ? 'text-primary' : 'text-text-secondary'}`}>{yr}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="bg-surface border border-border p-5 rounded-2xl">
                        <View className="h-6 mb-2 flex-row items-center">
                            {selectedDay ? (
                                <Text className="text-xs font-bold text-text-primary">
                                    {selectedDay.contributionCount} contributions on {new Date(selectedDay.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            ) : (
                                <Text className="text-xs font-medium text-text-secondary">Tap a day to see details</Text>
                            )}
                        </View>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="pb-2">
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
                                                    className={`w-[11px] h-[11px] rounded-sm ${day.contributionCount === 0 ? 'bg-[#161b22] border border-border' : ''} ${selectedDay?.date === day.date ? 'border-2 border-primary scale-125' : ''}`}
                                                    style={day.contributionCount > 0 ? { backgroundColor: day.color } : {}}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        <View className="flex-row justify-between items-center mt-5 pt-4 border-t border-border">
                            <Text className="text-[10px] text-text-secondary font-medium">
                                {calendarLoading ? '...' : `${calendar?.totalContributions} total in ${selectedYear}`}
                            </Text>
                        </View>
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
        </View>
    );
}