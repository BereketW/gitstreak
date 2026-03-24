import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGithubPullRequests, GithubPR } from '../../hooks/useGithubPullRequests';
import { formatDistanceToNow } from 'date-fns';
import { ScreenHeader } from '../../components/ScreenHeader';

export default function PullRequestsScreen() {
    const router = useRouter();
    const { prs, loading } = useGithubPullRequests();

    const getRepoName = (url: string) => {
        const parts = url.split('/');
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-[#0a0f18] font-display">
            <ScreenHeader title="Pull Requests" subtitle={`${loading ? '...' : prs.length} Open`} />

            {/* Filters */}
            <View className="px-6 pt-4 pb-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3 pb-2">
                    <TouchableOpacity className="bg-slate-900 dark:bg-white px-5 py-2.5 rounded-full shadow-lg">
                        <Text className="text-white dark:text-slate-900 text-sm font-bold">Created by me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/5 px-5 py-2.5 rounded-full">
                        <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium">Needs Review</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView contentContainerClassName="px-5 pt-4 pb-32 space-y-5" showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View className="py-10 items-center">
                        <ActivityIndicator size="large" color="#13ec13" />
                    </View>
                ) : prs.length === 0 ? (
                    <View className="py-10 items-center">
                        <Text className="text-slate-500 font-medium">No open pull requests found.</Text>
                    </View>
                ) : prs.map((pr: GithubPR) => {
                    const repoName = getRepoName(pr.repository_url);
                    
                    return (
                        <TouchableOpacity key={pr.id} className={`bg-white dark:bg-[#111827] border ${pr.draft ? 'border-slate-200 border-dashed dark:border-white/10 opacity-90' : 'border-slate-200 dark:border-white/5'} rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-transform`}>
                            <View className="flex-row items-start gap-3 mb-3">
                                <View className="mt-1">
                                    <MaterialIcons name={pr.draft ? "merge-type" : "call-merge"} size={22} color={pr.draft ? "#94a3b8" : "#13ec13"} />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{repoName}</Text>
                                        <Text className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(pr.created_at))} ago</Text>
                                    </View>
                                    <Text className="text-lg font-bold mb-3 leading-tight text-slate-900 dark:text-white">{pr.title}</Text>
                                    
                                    {pr.labels && pr.labels.length > 0 && (
                                        <View className="flex-row flex-wrap items-center gap-2 mb-4">
                                            {pr.labels.slice(0,3).map(label => (
                                                <View key={label.name} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                                    <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{label.name}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-1">
                                        <View className="flex-row items-center gap-2">
                                            <View className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center overflow-hidden">
                                                {pr.user.avatar_url ? (
                                                    <Image source={{ uri: pr.user.avatar_url }} className="w-full h-full" />
                                                ) : (
                                                    <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{pr.user.login.substring(0,2).toUpperCase()}</Text>
                                                )}
                                            </View>
                                            <Text className="text-xs text-slate-600 dark:text-slate-400 font-medium">{pr.user.login}</Text>
                                        </View>
                                        {pr.draft ? (
                                            <View className="bg-slate-100 dark:bg-[#1f2937] px-3 py-1 rounded-md">
                                                <Text className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Draft</Text>
                                            </View>
                                        ) : (
                                            <View className="bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-md border border-primary/20">
                                                <Text className="text-[10px] font-bold tracking-widest uppercase text-primary">Open</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
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
