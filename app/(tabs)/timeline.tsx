import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGithubEvents, GithubEvent } from '../../hooks/useGithubEvents';
import { formatDistanceToNow } from 'date-fns';
import { ScreenHeader } from '../../components/ScreenHeader';

export default function TimelineScreen() {
    const { events, loading } = useGithubEvents();

    const renderEvent = (event: GithubEvent, index: number) => {
        let icon = "commit";
        let color = "#13ec13";
        let bgClass = "bg-primary/20 border-primary/50";
        let title = "Unknown Event";
        let description = "";

        if (event.type === "PushEvent") {
            icon = "commit";
            color = "#13ec13";
            bgClass = "bg-primary/20 border-primary/50";
            const commitCount = event.payload.commits ? event.payload.commits.length : 0;
            const branch = event.payload.ref?.replace('refs/heads/', '') || '';
            title = `Pushed ${commitCount} commit${commitCount === 1 ? '' : 's'} to ${branch}`;
            description = event.payload.commits?.[0]?.message || "";
        } else if (event.type === "PullRequestEvent") {
            const action = event.payload.action; // opened, closed, etc.
            icon = action === 'closed' && event.payload.pull_request?.merged ? "call-merge" : "call-split";
            color = action === 'closed' && event.payload.pull_request?.merged ? "#a855f7" : "#3b82f6";
            bgClass = action === 'closed' && event.payload.pull_request?.merged ? "bg-purple-100 dark:bg-purple-500/20 border-purple-400 dark:border-purple-500" : "bg-blue-100 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500";
            title = `${action === 'closed' && event.payload.pull_request?.merged ? 'Merged' : action === 'opened' ? 'Opened' : 'Updated'} pull request #${event.payload.number}`;
            description = event.payload.pull_request?.title || "";
        } else if (event.type === "PullRequestReviewEvent" || event.type === "PullRequestReviewCommentEvent") {
            icon = "visibility";
            color = "#3b82f6";
            bgClass = "bg-blue-100 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500";
            title = `Reviewed pull request #${event.payload.pull_request?.number || ''}`;
            description = event.payload.review?.body || event.payload.comment?.body || "";
        } else if (event.type === "IssuesEvent") {
            icon = "error-outline";
            color = "#eab308";
            bgClass = "bg-yellow-100 dark:bg-yellow-500/20 border-yellow-400 dark:border-yellow-500";
            title = `${event.payload.action} issue #${event.payload.issue?.number}`;
            description = event.payload.issue?.title || "";
        } else if (event.type === "CreateEvent") {
            icon = "add-circle-outline";
            color = "#13ec13";
            bgClass = "bg-primary/20 border-primary/50";
            title = `Created ${event.payload.ref_type} ${event.payload.ref || ''}`;
            description = event.repo.name;
        }

        const isLast = index === events.length - 1;

        return (
            <View key={event.id} className={`relative pl-12 ${isLast ? 'mb-2' : 'mb-8'}`}>
                <View className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 items-center justify-center z-10 ${bgClass}`}>
                    <MaterialIcons name={icon as any} size={20} color={color} />
                </View>
                
                <View className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm mt-1">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center gap-1.5 flex-wrap flex-1 pr-2">
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">{title}</Text>
                        </View>
                        <Text className="text-[10px] text-slate-400 font-medium mt-1">{formatDistanceToNow(new Date(event.created_at))} ago</Text>
                    </View>

                    <View className="flex-row items-center gap-2 mb-2">
                        <MaterialIcons name="folder-open" size={14} color="#64748b" />
                        <Text className="text-xs text-slate-500 font-medium">{event.repo.name}</Text>
                    </View>
                    
                    {description ? (
                        <View className="bg-slate-50 dark:bg-[#161f2e] rounded-xl p-3 border border-slate-100 dark:border-white/5 mt-1">
                            <Text className="text-sm text-slate-600 dark:text-slate-300" numberOfLines={2}>{description}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-[#0a0f18] font-display text-slate-900 dark:text-slate-100">
            <ScreenHeader title="Pulse" subtitle="Your recent developer activity" />
            
            <ScrollView contentContainerClassName="px-6 pb-32 pt-6" showsVerticalScrollIndicator={false}>
                {/* The continuous vertical line */}
                <View className="absolute left-[35px] top-6 bottom-4 w-0.5 bg-slate-200 dark:bg-white/10 rounded-full" />
                
                {loading ? (
                    <View className="py-10 items-center">
                        <ActivityIndicator size="large" color="#13ec13" />
                    </View>
                ) : events.length === 0 ? (
                    <View className="py-10 items-center bg-white dark:bg-[#111827] rounded-3xl p-5 border border-slate-200 dark:border-white/5">
                        <Text className="text-slate-500 font-medium text-center">No recent activity found.</Text>
                    </View>
                ) : events.slice(0, 30).filter(e => ["PushEvent", "PullRequestEvent", "PullRequestReviewEvent", "IssuesEvent", "CreateEvent"].includes(e.type)).map(renderEvent)}
            </ScrollView>
        </SafeAreaView>
    );
}
