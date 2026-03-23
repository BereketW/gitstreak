import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ReposScreen() {
    const router = useRouter();

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-[#0a0f18] font-display">
            {/* Header & Search */}
            <View className="px-6 pt-6 pb-4 bg-background-light/90 dark:bg-[#0a0f18]/90 backdrop-blur-xl z-30 border-b border-slate-200/50 dark:border-white/5">
                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Repositories</Text>
                        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">14 Active Projects</Text>
                    </View>
                    <TouchableOpacity
                        className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                    >
                        <MaterialIcons name="add" size={26} color="#13ec13" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="relative">
                    <View className="absolute left-4 top-3.5 z-10">
                        <Feather name="search" size={20} color="#64748b" />
                    </View>
                    <TextInput
                        className="w-full bg-white dark:bg-[#161f2e] border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-base text-slate-900 dark:text-slate-100 shadow-sm font-medium"
                        placeholder="Find a repository..."
                        placeholderTextColor="#64748b"
                    />
                    <TouchableOpacity className="absolute right-4 top-3.5 p-1 bg-slate-100 dark:bg-white/10 rounded-md">
                        <MaterialIcons name="tune" size={16} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Repo List */}
            <ScrollView contentContainerClassName="px-5 pt-4 pb-32 space-y-4" showsVerticalScrollIndicator={false}>
                
                {/* Repo Item 1 */}
                <TouchableOpacity className="bg-white dark:bg-[#111827] rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm active:scale-[0.98] transition-transform">
                    <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-row items-center gap-3 flex-1">
                            <View className="w-12 h-12 flex items-center justify-center rounded-2xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200/50 dark:border-yellow-500/20">
                                <MaterialIcons name="javascript" size={32} color="#eab308" />
                            </View>
                            <View className="flex-1 pr-4">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>react-streak-tracker</Text>
                                <Text className="text-xs text-slate-500 font-medium mt-0.5">nixitio-labs</Text>
                            </View>
                        </View>
                        <View className="bg-slate-50 dark:bg-[#1f2937] px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                            <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Public</Text>
                        </View>
                    </View>

                    <Text className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4" numberOfLines={2}>
                        A beautiful React Native application to keep your GitHub contribution graph fully green, every single day.
                    </Text>

                    <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                        <View className="flex-row items-center gap-4">
                            <View className="flex-row items-center gap-1.5">
                                <MaterialIcons name="star-border" size={16} color="#fbbf24" />
                                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">1.2k</Text>
                            </View>
                            <View className="flex-row items-center gap-1.5">
                                <MaterialIcons name="call-split" size={16} color="#3b82f6" />
                                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">234</Text>
                            </View>
                        </View>
                        <Text className="text-[11px] text-slate-400 font-medium">Updated 14h ago</Text>
                    </View>
                </TouchableOpacity>

                {/* Repo Item 2 */}
                <TouchableOpacity className="bg-white dark:bg-[#111827] rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm active:scale-[0.98] transition-transform">
                    <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-row items-center gap-3 flex-1">
                            <View className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20">
                                <Text className="text-blue-500 font-bold text-lg tracking-tighter">TS</Text>
                            </View>
                            <View className="flex-1 pr-4">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>api-gateway-v2</Text>
                                <Text className="text-xs text-slate-500 font-medium mt-0.5">linear-dev</Text>
                            </View>
                        </View>
                        <View className="bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-full border border-primary/20">
                            <Text className="text-[10px] font-bold text-primary">Private</Text>
                        </View>
                    </View>

                    <Text className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4" numberOfLines={2}>
                        High performance, globally distributed API gateway written in TypeScript using Edge functions.
                    </Text>

                    <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                        <View className="flex-row items-center gap-4">
                            <View className="flex-row items-center gap-1.5">
                                <MaterialIcons name="star-border" size={16} color="#fbbf24" />
                                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">48</Text>
                            </View>
                            <View className="flex-row items-center gap-1.5">
                                <MaterialIcons name="call-split" size={16} color="#3b82f6" />
                                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">12</Text>
                            </View>
                        </View>
                        <Text className="text-[11px] text-slate-400 font-medium">Updated 2d ago</Text>
                    </View>
                </TouchableOpacity>

                {/* Repo Item 3 */}
                <TouchableOpacity className="bg-white dark:bg-[#111827] rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm active:scale-[0.98] transition-transform">
                    <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-row items-center gap-3 flex-1">
                            <View className="w-12 h-12 flex items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200/50 dark:border-purple-500/20">
                                <FontAwesome name="paint-brush" size={20} color="#a855f7" />
                            </View>
                            <View className="flex-1 pr-4">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>design-system-core</Text>
                                <Text className="text-xs text-slate-500 font-medium mt-0.5">nixitio-labs</Text>
                            </View>
                        </View>
                        <View className="bg-slate-50 dark:bg-[#1f2937] px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                            <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Public</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                        <View className="flex-row items-center gap-4">
                            <View className="flex-row items-center gap-1.5">
                                <MaterialIcons name="star-border" size={16} color="#fbbf24" />
                                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">892</Text>
                            </View>
                        </View>
                        <Text className="text-[11px] text-slate-400 font-medium">Updated 5d ago</Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}