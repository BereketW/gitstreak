import { View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGithubEvents, GithubEvent } from '../../hooks/useGithubEvents';
import { formatDistanceToNow } from 'date-fns';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';

export default function TimelineScreen() {
    const { events, loading, refreshing, refresh, error } = useGithubEvents();
    const insets = useSafeAreaInsets();

    const renderEvent = (event: GithubEvent, index: number) => {
        let icon = "commit";
        let color = "#22c55e"; // green-500
        let bgClass = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
        let title = "Unknown Event";
        let description = "";

        if (event.type === "PushEvent") {
            icon = "commit";
            color = "#22c55e";
            bgClass = "bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-border";
            const commitCount = event.payload.size ?? (event.payload.commits ? event.payload.commits.length : 0);
            const branch = event.payload.ref?.replace('refs/heads/', '') || '';
            title = `Pushed ${commitCount} commit${commitCount === 1 ? '' : 's'} to ${branch}`;
            const commits = event.payload.commits || [];
            const latestCommit = commits.length > 0 ? commits[commits.length - 1] : null;
            description = latestCommit?.message || "";
        } else if (event.type === "PullRequestEvent") {
            const action = event.payload.action;
            const isMerged = action === 'closed' && event.payload.pull_request?.merged;
            icon = isMerged ? "call-merge" : "call-split";
            color = isMerged ? "#a855f7" : "#3b82f6";
            bgClass = isMerged ? "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20" : "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
            title = `${isMerged ? 'Merged' : action === 'opened' ? 'Opened' : 'Updated'} pull request #${event.payload.number}`;
            description = event.payload.pull_request?.title || "";
        } else if (event.type === "PullRequestReviewEvent" || event.type === "PullRequestReviewCommentEvent") {
            icon = "visibility";
            color = "#64748b";
            bgClass = "bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-border";
            title = `Reviewed pull request #${event.payload.pull_request?.number || ''}`;
            description = event.payload.review?.body || event.payload.comment?.body || "";
        } else if (event.type === "IssuesEvent") {
            icon = "error-outline";
            color = "#eab308";
            bgClass = "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20";
            title = `${event.payload.action} issue #${event.payload.issue?.number}`;
            description = event.payload.issue?.title || "";
        } else if (event.type === "CreateEvent") {
            icon = "add-circle-outline";
            color = "#22c55e";
            bgClass = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
            title = `Created ${event.payload.ref_type} ${event.payload.ref || ''}`;
            description = event.repo.name;
        }

        const isLast = index === events.length - 1;

        return (
            <View key={event.id} className={`relative pl-10 ${isLast ? 'mb-4' : 'mb-6'}`}>
                {/* Minimalist connecting line */}
                {!isLast && <View className="absolute left-[15px] top-8 bottom-[-24px] w-[1px] bg-slate-200 dark:bg-border z-0" />}
                
                {/* Premium Icon Container */}
                <View className={`absolute left-0 top-1 w-8 h-8 rounded-full border items-center justify-center z-10 ${bgClass} shadow-sm`}>
                    <MaterialIcons name={icon as any} size={16} color={color} />
                </View>
                
                {/* Flat Premium Card */}
                <View className="bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-3xl p-5 shadow-sm">
                    <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center gap-1.5 flex-wrap flex-1 pr-3">
                            <Text className="text-base font-bold text-slate-900 dark:text-text-primary tracking-tight leading-tight">{title}</Text>
                        </View>
                        <Text className="text-[11px] text-slate-500 dark:text-text-secondary font-medium whitespace-nowrap">{formatDistanceToNow(new Date(event.created_at))} ago</Text>
                    </View>

                    <View className="flex-row items-center gap-2 mb-3">
                        <MaterialIcons name="folder" size={14} color="#64748b" />
                        <Text className="text-sm text-slate-500 font-medium tracking-tight">{event.repo.name}</Text>
                    </View>
                    
                    {description ? (
                        <View className="bg-slate-50 dark:bg-background-dark rounded-2xl p-4 border border-slate-100 dark:border-border">
                            <Text className="text-sm text-slate-600 dark:text-text-secondary leading-relaxed" numberOfLines={2}>{description}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        );
    };

    const renderSkeleton = () => (
        <View className="px-6 pb-32">
            {Array.from({ length: 6 }).map((_, idx) => (
                <View key={idx} className="relative pl-10 mb-6">
                    {idx !== 5 && <View className="absolute left-[15px] top-8 bottom-[-24px] w-[1px] bg-slate-200 dark:bg-border z-0" />}
                    
                    <Skeleton className="absolute left-0 top-1 w-8 h-8 rounded-full z-10" />
                    
                    <View className="bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-3xl p-5 shadow-sm">
                        <View className="flex-row justify-between items-start mb-3">
                            <Skeleton className="w-3/4 h-5 rounded-md" />
                            <Skeleton className="w-12 h-3 rounded-md mt-1" />
                        </View>
                        <View className="flex-row items-center gap-2 mb-3">
                            <Skeleton className="w-4 h-4 rounded-md" />
                            <Skeleton className="w-1/3 h-4 rounded-md" />
                        </View>
                        <View className="bg-slate-50 dark:bg-background-dark rounded-2xl p-4 border border-slate-100 dark:border-border">
                            <Skeleton className="w-full h-4 rounded-md mb-2" />
                            <Skeleton className="w-4/5 h-4 rounded-md" />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderItem = ({ item, index }: { item: GithubEvent, index: number }) => renderEvent(item, index);

    const filteredEvents = events.slice(0, 30).filter(e => ["PushEvent", "PullRequestEvent", "PullRequestReviewEvent", "IssuesEvent", "CreateEvent"].includes(e.type));

    return (
        <View className="flex-1 bg-slate-50 dark:bg-background-dark font-display text-slate-900 dark:text-text-primary">
            <ScreenHeader title="Pulse" subtitle="Your recent developer activity" />
            
            {error ? (
                <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 20) + 80 }}>
                    <ErrorState message={error} onRetry={refresh} />
                </View>
            ) : loading ? (
                <View style={{ paddingTop: Math.max(insets.top, 20) + 80 }}>
                    {renderSkeleton()}
                </View>
            ) : filteredEvents.length === 0 ? (
                <View className="py-10 px-6 items-center" style={{ paddingTop: Math.max(insets.top, 20) + 80 }}>
                    <View className="items-center bg-white dark:bg-surface rounded-3xl p-5 border border-slate-200 dark:border-border w-full">
                        <Text className="text-slate-500 dark:text-text-secondary font-medium text-center">No recent activity found.</Text>
                    </View>
                </View>
            ) : (
                <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 20) + 80 }}>
                    <FlatList
                        data={filteredEvents}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerClassName="px-6 pb-32"
                        showsVerticalScrollIndicator={false}
                        refreshing={refreshing}
                        onRefresh={refresh}
                    />
                </View>
            )}
        </View>
    );
}
