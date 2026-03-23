import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PullRequestsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-[#0a0f18] font-display">
            {/* Header */}
            <View className="px-6 pt-6 pb-2">
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-sm">
                        <MaterialIcons name="local-fire-department" size={16} color="#13ec13" />
                        <Text className="text-xs font-black text-primary ml-1.5 uppercase tracking-wider">15 Day Streak</Text>
                    </View>
                    <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#1f2937] border-2 border-primary/30 items-center justify-center overflow-hidden">
                        <MaterialIcons name="person" size={24} color="#64748b" />
                    </View>
                </View>
                
                <View className="flex-row items-end justify-between mb-6">
                    <Text className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Review</Text>
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">12 Open</Text>
                </View>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3 pb-2">
                    <TouchableOpacity className="bg-slate-900 dark:bg-white px-5 py-2.5 rounded-full shadow-lg">
                        <Text className="text-white dark:text-slate-900 text-sm font-bold">Needs Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/5 px-5 py-2.5 rounded-full">
                        <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium">Created by me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/5 px-5 py-2.5 rounded-full">
                        <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium">Drafts</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView contentContainerClassName="px-5 pt-4 pb-32 space-y-5" showsVerticalScrollIndicator={false}>
                
                {/* PR Item: Open/Review Requested */}
                <TouchableOpacity className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-transform">
                    <View className="flex-row items-start gap-3 mb-3">
                        <View className="mt-1">
                            <MaterialIcons name="call-merge" size={22} color="#13ec13" />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-start mb-1">
                                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">nixitio-labs / frontend</Text>
                                <Text className="text-[10px] text-slate-400">2h ago</Text>
                            </View>
                            <Text className="text-lg font-bold mb-3 leading-tight text-slate-900 dark:text-white">feat: Implement dark mode toggle with system preference</Text>
                            
                            <View className="flex-row flex-wrap items-center gap-2 mb-4">
                                <View className="bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-500/20">
                                    <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-400">enhancement</Text>
                                </View>
                                <View className="bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-500/20">
                                    <Text className="text-[10px] font-bold text-purple-600 dark:text-purple-400">ui/ux</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-1">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                                        <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">AD</Text>
                                    </View>
                                    <Text className="text-xs text-slate-600 dark:text-slate-400 font-medium">alex_dev</Text>
                                </View>
                                <View className="flex-row items-center gap-1.5 bg-slate-50 dark:bg-[#161f2e] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
                                    <MaterialIcons name="call-split" size={14} color="#64748b" />
                                    <Text className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 max-w-[100px]" numberOfLines={1}>feature/ui-dark</Text>
                                    <MaterialIcons name="arrow-right-alt" size={14} color="#64748b" />
                                    <Text className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">main</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* PR Item: Draft */}
                <TouchableOpacity className="bg-white/60 dark:bg-[#111827]/60 border border-slate-200 border-dashed dark:border-white/10 rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-transform opacity-90">
                    <View className="flex-row items-start gap-3 mb-3">
                        <View className="mt-1">
                            <MaterialIcons name="merge-type" size={22} color="#94a3b8" />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-start mb-1">
                                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">linear-dev / backend</Text>
                                <Text className="text-[10px] text-slate-400">5h ago</Text>
                            </View>
                            <Text className="text-lg font-bold mb-3 leading-tight text-slate-700 dark:text-slate-300">refactor: optimize database query caching layer</Text>
                            
                            <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-1">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                                        <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">YOU</Text>
                                    </View>
                                    <Text className="text-xs text-slate-600 dark:text-slate-400 font-medium">You</Text>
                                </View>
                                <View className="bg-slate-100 dark:bg-[#1f2937] px-3 py-1 rounded-md">
                                    <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Draft</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* PR Item: Approved */}
                <TouchableOpacity className="bg-white dark:bg-[#111827] border border-primary/30 dark:border-primary/20 rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-transform">
                    <View className="flex-row items-start gap-3 mb-3">
                        <View className="mt-1 bg-primary/20 rounded-full p-1">
                            <MaterialIcons name="check" size={16} color="#13ec13" />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-start mb-1">
                                <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">nixitio-labs / design</Text>
                                <Text className="text-[10px] text-slate-400">1d ago</Text>
                            </View>
                            <Text className="text-lg font-bold mb-3 leading-tight text-slate-900 dark:text-white">fix: Button component padding inconsistencies on mobile</Text>
                            
                            <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-1">
                                <View className="flex-row items-center gap-2">
                                    <View className="flex-row -space-x-2">
                                        <View className="w-6 h-6 rounded-full bg-blue-200 border border-white dark:border-[#111827] z-20" />
                                        <View className="w-6 h-6 rounded-full bg-purple-200 border border-white dark:border-[#111827] z-10" />
                                    </View>
                                    <Text className="text-xs text-slate-500 font-medium ml-1">2 approvals</Text>
                                </View>
                                <View className="bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
                                    <Text className="text-[10px] font-bold tracking-widest uppercase text-primary">Approved</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

            </ScrollView>

            {/* Floating Action Button */}
            <View className="absolute bottom-6 right-6 z-50 shadow-2xl shadow-primary/40">
                <TouchableOpacity
                    className="w-16 h-16 bg-primary rounded-full items-center justify-center active:scale-95 transition-transform border-4 border-background-light dark:border-[#0a0f18]"
                    onPress={() => router.push('/new-pr')}
                >
                    <MaterialIcons name="add" size={32} color="#000" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}