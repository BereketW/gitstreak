import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Octicons } from '@expo/vector-icons';

export default function TimelineScreen() {
    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-[#0a0f18] font-display text-slate-900 dark:text-slate-100">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-8 pt-8 px-6">
                    <View>
                        <Text className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Pulse</Text>
                        <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Your recent developer activity</Text>
                    </View>
                </View>

                {/* Filters */}
                <View className="mb-6">
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-3 px-6 pb-2" className="flex-none">
                        <View className="bg-slate-900 dark:bg-white px-5 py-2.5 rounded-full shadow-lg">
                            <Text className="text-white dark:text-slate-900 text-sm font-bold">Everything</Text>
                        </View>
                        <View className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/5 px-5 py-2.5 rounded-full shadow-sm">
                            <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium">Commits</Text>
                        </View>
                        <View className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/5 px-5 py-2.5 rounded-full shadow-sm">
                            <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium">Reviews</Text>
                        </View>
                    </ScrollView>
                </View>

                <ScrollView contentContainerClassName="px-6 pb-32" showsVerticalScrollIndicator={false}>
                    
                    {/* Date Header */}
                    <View className="mb-6 mt-2">
                        <Text className="text-sm font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Today</Text>
                    </View>

                    {/* Timeline Container */}
                    <View className="relative">
                        {/* The continuous vertical line */}
                        <View className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-slate-200 dark:bg-white/10 rounded-full" />

                        {/* Timeline Item 1: Commit */}
                        <View className="relative pl-12 mb-8">
                            <View className="absolute left-0 top-0 w-10 h-10 rounded-full bg-primary/20 dark:bg-primary/20 border-2 border-primary/50 items-center justify-center z-10">
                                <MaterialIcons name="commit" size={20} color="#13ec13" />
                            </View>
                            
                            <View className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm mt-1">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-row items-center gap-1.5">
                                        <Text className="text-sm font-bold text-slate-900 dark:text-white">Pushed 3 commits</Text>
                                        <Text className="text-sm text-slate-500">to</Text>
                                        <Text className="text-sm font-bold text-slate-900 dark:text-white">main</Text>
                                    </View>
                                    <Text className="text-[10px] text-slate-400 font-medium">2h ago</Text>
                                </View>
                                
                                <View className="bg-slate-50 dark:bg-[#161f2e] rounded-xl p-3 border border-slate-100 dark:border-white/5 mt-2">
                                    <View className="flex-row items-center gap-3 mb-2">
                                        <Text className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">f4a2e81</Text>
                                        <Text className="text-sm text-slate-600 dark:text-slate-300" numberOfLines={1}>Refactor auth middleware logic</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3 mb-2">
                                        <Text className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">a8b9c0d</Text>
                                        <Text className="text-sm text-slate-600 dark:text-slate-300" numberOfLines={1}>Update dependencies</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">e1f2g3h</Text>
                                        <Text className="text-sm text-slate-600 dark:text-slate-300" numberOfLines={1}>Fix typo in README</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Timeline Item 2: Merged PR */}
                        <View className="relative pl-12 mb-8">
                            <View className="absolute left-0 top-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 border-2 border-purple-400 dark:border-purple-500 items-center justify-center z-10">
                                <MaterialIcons name="call-merge" size={20} color="#a855f7" />
                            </View>
                            
                            <View className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm mt-1">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-row items-center gap-1.5 flex-wrap flex-1 pr-2">
                                        <Text className="text-sm font-bold text-slate-900 dark:text-white">Merged pull request</Text>
                                        <Text className="text-sm font-mono text-purple-600 dark:text-purple-400">#42</Text>
                                    </View>
                                    <Text className="text-[10px] text-slate-400 font-medium mt-1">5h ago</Text>
                                </View>
                                <Text className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Add Dark Mode Support</Text>
                                <View className="flex-row items-center gap-2">
                                    <MaterialIcons name="folder-open" size={14} color="#64748b" />
                                    <Text className="text-xs text-slate-500 font-medium">personal/portfolio-v3</Text>
                                </View>
                            </View>
                        </View>

                        {/* Timeline Item 3: Review */}
                        <View className="relative pl-12 mb-2">
                            <View className="absolute left-0 top-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 border-2 border-blue-400 dark:border-blue-500 items-center justify-center z-10">
                                <MaterialIcons name="visibility" size={20} color="#3b82f6" />
                            </View>
                            
                            <View className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm mt-1">
                                <View className="flex-row justify-between items-start mb-2">
                                    <Text className="text-sm font-bold text-slate-900 dark:text-white">Reviewed pull request</Text>
                                    <Text className="text-[10px] text-slate-400 font-medium">Yesterday</Text>
                                </View>
                                <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Fix navigation bug on Android</Text>
                                <View className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                    <Text className="text-sm text-blue-800 dark:text-blue-300 italic">"Looks solid! The gesture handler logic is much cleaner now. Approved."</Text>
                                </View>
                            </View>
                        </View>
                        
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}