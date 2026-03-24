import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGithubRepos, GithubRepo } from '../../hooks/useGithubRepos';
import { formatDistanceToNow } from 'date-fns';
import { ScreenHeader } from '../../components/ScreenHeader';

export default function ReposScreen() {
    const router = useRouter();
    const { repos, loading } = useGithubRepos();

    const getLanguageIcon = (lang: string | null) => {
        if (!lang) return { icon: <Feather name="code" size={24} color="#64748b" />, bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" };
        
        switch(lang.toLowerCase()) {
            case 'javascript':
                return { icon: <MaterialIcons name="javascript" size={32} color="#eab308" />, bg: "bg-yellow-50 dark:bg-yellow-500/10", border: "border-yellow-200/50 dark:border-yellow-500/20" };
            case 'typescript':
                return { icon: <Text className="text-blue-500 font-bold text-lg tracking-tighter">TS</Text>, bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200/50 dark:border-blue-500/20" };
            case 'python':
                return { icon: <FontAwesome name="code" size={20} color="#3b82f6" />, bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200/50 dark:border-blue-500/20" };
            default:
                return { icon: <FontAwesome name="code" size={20} color="#a855f7" />, bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200/50 dark:border-purple-500/20" };
        }
    }

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-[#0a0f18] font-display">
            <ScreenHeader title="Repositories" subtitle={`${loading ? '...' : repos.length} Active Projects`} />
            
            {/* Search Bar */}
            <View className="px-6 pt-4 pb-4">
                <View className="relative">
                    <View className="absolute left-4 top-3.5 z-10">
                        <Feather name="search" size={20} color="#64748b" />
                    </View>
                    <TextInput
                        className="w-full bg-white dark:bg-[#161f2e] border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-base text-slate-900 dark:text-slate-100 shadow-sm font-medium"
                        placeholder="Find a repository..."
                        placeholderTextColor="#64748b"
                    />
                </View>
            </View>

            {/* Repo List */}
            <ScrollView contentContainerClassName="px-5 pt-4 pb-32 space-y-4" showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View className="py-10 items-center">
                        <ActivityIndicator size="large" color="#13ec13" />
                    </View>
                ) : repos.map((repo: GithubRepo) => {
                    const styling = getLanguageIcon(repo.language);
                    
                    return (
                        <TouchableOpacity key={repo.id} className="bg-white dark:bg-[#111827] rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-sm active:scale-[0.98] transition-transform">
                            <View className="flex-row items-start justify-between mb-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className={`w-12 h-12 flex items-center justify-center rounded-2xl ${styling.bg} border ${styling.border}`}>
                                        {styling.icon}
                                    </View>
                                    <View className="flex-1 pr-4">
                                        <Text className="text-lg font-bold text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>{repo.name}</Text>
                                        <Text className="text-xs text-slate-500 font-medium mt-0.5">{repo.owner.login}</Text>
                                    </View>
                                </View>
                                <View className={`${repo.private ? 'bg-primary/10 dark:bg-primary/20 border-primary/20' : 'bg-slate-50 dark:bg-[#1f2937] border-slate-200 dark:border-white/5'} px-3 py-1.5 rounded-full border`}>
                                    <Text className={`text-[10px] font-bold ${repo.private ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {repo.private ? 'Private' : 'Public'}
                                    </Text>
                                </View>
                            </View>

                            {repo.description && (
                                <Text className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4" numberOfLines={2}>
                                    {repo.description}
                                </Text>
                            )}

                            <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                                <View className="flex-row items-center gap-4">
                                    <View className="flex-row items-center gap-1.5">
                                        <MaterialIcons name="star-border" size={16} color="#fbbf24" />
                                        <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">{repo.stargazers_count}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1.5">
                                        <MaterialIcons name="call-split" size={16} color="#3b82f6" />
                                        <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">{repo.forks_count}</Text>
                                    </View>
                                </View>
                                <Text className="text-[11px] text-slate-400 font-medium">Updated {formatDistanceToNow(new Date(repo.updated_at))} ago</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
