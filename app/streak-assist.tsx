import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Dimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withRepeat, 
    withSequence, 
    Easing,
    FadeIn,
    FadeOut,
    FadeInDown,
    FadeInUp,
    SlideInDown,
    SlideOutUp,
    interpolateColor,
    withSpring,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { getDefaultBranch, fetchRepoTree, fetchFileContent, createStreakPR } from '../utils/github';
import { getAIProposal } from '../utils/gemini';
import { DiffViewer } from '../components/DiffViewer';
import { Skeleton } from '../components/Skeleton';
import { useColorScheme } from 'nativewind';
import { useGithubRepos, GithubRepo } from '../hooks/useGithubRepos';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const SPACING = (width - CARD_WIDTH) / 2;

type Step = 'select_repo' | 'scanning' | 'analyzing' | 'review' | 'submitting' | 'done' | 'error';

// Top level component definition for the RepoCard
const RepoCardItem = ({ 
    item, 
    index, 
    scrollX, 
    onSelect, 
    colorScheme 
}: { 
    item: GithubRepo; 
    index: number; 
    scrollX: any; 
    onSelect: (repo: GithubRepo) => void;
    colorScheme: 'light' | 'dark' | undefined;
}) => {
    const inputRange = [
        (index - 1) * CARD_WIDTH,
        index * CARD_WIDTH,
        (index + 1) * CARD_WIDTH,
    ];

    const animatedCardStyle = useAnimatedStyle(() => {
        const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolation.CLAMP);
        const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
        return { transform: [{ scale }], opacity };
    });

    return (
        <View style={{ width: CARD_WIDTH }}>
            <Animated.View style={[animatedCardStyle]}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => onSelect(item)}
                    className="h-[400px] w-full bg-white/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-3xl"
                >
                    <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} className="absolute inset-0 z-0" />
                    <View className="flex-1 p-8 justify-between z-10">
                        <View className="w-16 h-16 bg-black/5 dark:bg-black/40 rounded-full items-center justify-center border border-black/5 dark:border-white/10">
                            <Octicons name={item.private ? "lock" : "repo"} size={28} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                        </View>
                        
                        <View className="mt-auto">
                            <Text className="text-[12px] font-black uppercase tracking-widest text-primary mb-2 flex-row items-center">{item.language || 'Code'} • {item.stargazers_count} ★</Text>
                            <Text className="text-[32px] font-black text-slate-900 dark:text-white tracking-tighter leading-tight" numberOfLines={2}>{item.name}</Text>
                            <Text className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mt-3" numberOfLines={3}>{item.description || "No description provided."}</Text>
                        </View>
                        
                        <View className="w-full bg-primary/10 dark:bg-primary/20 py-4 mt-8 rounded-full items-center border border-primary/20">
                            <Text className="text-primary font-black uppercase tracking-widest text-[12px]">Analyze Repo</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

export default function StreakAssist() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { token } = useAuth();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    
    const [step, setStep] = useState<Step>('select_repo');
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
    const [targetFile, setTargetFile] = useState<string>('');
    const [diff, setDiff] = useState<string>('');
    const [prUrl, setPrUrl] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    
    const [scannedLogs, setScannedLogs] = useState<Array<{path: string; size: string; time: string}>>([]);
    const [totalScanned, setTotalScanned] = useState(0);
    const [integrityScore, setIntegrityScore] = useState(100);
    const [processedTokens, setProcessedTokens] = useState(0);
    const [analyzingLogStep, setAnalyzingLogStep] = useState(0);

    const { repos, loading: reposLoading } = useGithubRepos();

    // Reanimated Values
    const scrollX = useSharedValue(0);
    const bgProgress = useSharedValue(0);
    
    // Background Color Interpolation based on step
    useEffect(() => {
        const stepValues: Record<Step, number> = {
            'select_repo': 0,
            'scanning': 1,
            'analyzing': 2,
            'review': 3,
            'submitting': 4,
            'done': 5,
            'error': 6
        };
        bgProgress.value = withTiming(stepValues[step] || 0, { duration: 1000 });
    }, [step]);
    
    const animatedBgStyle = useAnimatedStyle(() => {
        const darkColors = ['#050814', '#0f172a', '#31120b', '#000000', '#0f172a', '#082f18', '#311116'];
        const lightColors = ['#e0e7ff', '#f1f5f9', '#ffedd5', '#ffffff', '#f1f5f9', '#dcfce7', '#fee2e2'];
        const colors = colorScheme === 'dark' ? darkColors : lightColors;
        
        return {
            backgroundColor: interpolateColor(
                bgProgress.value,
                [0, 1, 2, 3, 4, 5, 6],
                colors
            )
        };
    });

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    // Radar Animations
    const radarScale = useSharedValue(0.1);
    const radarOpacity = useSharedValue(0);
    const spinProgress = useSharedValue(0);

    useEffect(() => {
        if (step === 'scanning' || step === 'analyzing' || step === 'submitting') {
            radarScale.value = withRepeat(withTiming(1.5, { duration: 2500, easing: Easing.out(Easing.ease) }), -1, false);
            radarOpacity.value = withRepeat(withSequence(withTiming(0.4, {duration: 500}), withTiming(0, { duration: 2000 })), -1, false);
            spinProgress.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1, false);
        }
    }, [step]);

    const animatedRadar = useAnimatedStyle(() => ({
        transform: [{ scale: radarScale.value }],
        opacity: radarOpacity.value,
    }));
    const animatedSpin = useAnimatedStyle(() => ({
        transform: [{ rotate: `${spinProgress.value * 360}deg` }]
    }));

    useEffect(() => {
        if (selectedOwner && selectedRepo && token && step === 'scanning') {
            processRepository(selectedOwner, selectedRepo);
        }
    }, [step, selectedOwner, selectedRepo, token]);

    const handleSelectRepo = (repo: GithubRepo) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedOwner(repo.owner.login);
        setSelectedRepo(repo.name);
        setStep('scanning');
    };

    const startProcess = (owner: string, repo: string) => {
        setStep('select_repo');
        setTimeout(() => {
            setSelectedOwner(owner);
            setSelectedRepo(repo);
            setStep('scanning');
        }, 500);
    };

    const processRepository = async (owner: string, repo: string) => {
        try {
            setScannedLogs([]); setTotalScanned(0); setIntegrityScore(100);
            
            if (!token || !owner || !repo) throw new Error("Missing authentication or repository data.");
            
            const branch = await getDefaultBranch(token, owner, repo);
            
            const logInterval = setInterval(() => {
                const exts = ['.ts', '.tsx', '.json', '.md', '.py', '.go'];
                const ext = exts[Math.floor(Math.random() * exts.length)];
                setScannedLogs(prev => [{
                    path: `src/components/Module_${Math.floor(Math.random() * 100)}${ext}`,
                    size: `${(Math.random() * 50).toFixed(1)}kb`,
                    time: new Date().toISOString().split('T')[1].substring(0,8)
                }, ...prev].slice(0, 6));
                setTotalScanned(prev => prev + Math.floor(Math.random() * 5) + 1);
                setIntegrityScore(prev => Math.max(85, prev - Math.floor(Math.random() * 2)));
            }, 600);

            let tree;
            try {
                tree = await fetchRepoTree(token, owner, repo, branch);
            } catch (e: any) {
                if (e.message?.includes('Git Repository is empty')) {
                    clearInterval(logInterval);
                    throw new Error(`Repository ${owner}/${repo} is empty. Please select a repository with code.`);
                }
                throw e;
            }
            
            clearInterval(logInterval);
            
            const files = tree.filter((f: any) => f.type === 'blob' && f.path.match(/\.(ts|js|tsx|jsx|py|go|md)$/));
            if (!files.length) throw new Error("No supported codebase files found.");
            
            const target = files[Math.floor(Math.random() * files.length)];
            setTargetFile(target.path);
            
            setStep('analyzing');
            setAnalyzingLogStep(1);
            
            const tokenInterval = setInterval(() => {
                setProcessedTokens(prev => prev + Math.floor(Math.random() * 100) + 50);
            }, 100);

            const content = await fetchFileContent(token, owner, repo, target.path);
            setAnalyzingLogStep(2);
            await new Promise(r => setTimeout(r, 1500));
            setAnalyzingLogStep(3);
            
            const proposal = await getAIProposal(content.content);
            clearInterval(tokenInterval);
            setAnalyzingLogStep(4);
            await new Promise(r => setTimeout(r, 1000));
            
            setDiff(proposal);
            setStep('review');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
        } catch (error: any) {
            setErrorMsg(error.message || "An unexpected error occurred during processing.");
            setStep('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleApprove = async () => {
        if (!token || !selectedOwner || !selectedRepo || !targetFile || !diff) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setStep('submitting');
        try {
            const branch = await getDefaultBranch(token, selectedOwner, selectedRepo);
            const originalContent = await fetchFileContent(token, selectedOwner, selectedRepo, targetFile);
            const prUrlResponse = await createStreakPR(token, selectedOwner, selectedRepo, branch, targetFile, originalContent.content, diff);
            setPrUrl(prUrlResponse);
            setStep('done');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            setErrorMsg(error.message || "Failed to create pull request.");
            setStep('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return (
        <Animated.View style={[{ flex: 1 }, animatedBgStyle]}>
            <LinearGradient 
                colors={['transparent', colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
            />
            
            {/* Immersive Floating Pill Header */}
            <View style={{ paddingTop: insets.top + 10 }} className="px-6 w-full absolute top-0 z-50">
                <BlurView intensity={100} tint={colorScheme === 'dark' ? 'dark' : 'light'} className="rounded-full overflow-hidden border border-slate-200/50 dark:border-white/10 shadow-2xl">
                    <View className="px-5 py-3.5 flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center bg-black/5 dark:bg-white/10 rounded-full active:scale-90 transition-transform">
                            <MaterialIcons name="close" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                        </TouchableOpacity>
                        <Text className="text-[15px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Streak Assist</Text>
                        <View className="bg-primary/20 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                            <MaterialIcons name="auto-awesome" size={14} color="#3fb950" />
                            <Text className="text-primary font-bold text-[10px] uppercase tracking-widest">{
                                step === 'select_repo' ? '1/3' : 
                                step === 'review' ? '2/3' : 
                                step === 'done' ? '3/3' : 'AI'
                            }</Text>
                        </View>
                    </View>
                </BlurView>
            </View>

            <View className="flex-1 justify-center relative pt-20">
                {step === 'select_repo' && (
                    <Animated.View entering={FadeInDown.duration(800)} exiting={SlideOutUp} className="flex-1">
                        <View className="px-8 mt-10 mb-8">
                            <Text className="text-[42px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">Choose Your Canvas</Text>
                            <Text className="text-[16px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-[90%]">Swipe through your repositories. Our intelligence engine will prepare a seamless commit for today.</Text>
                        </View>
                        
                        {reposLoading ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="large" color="#3fb950" />
                            </View>
                        ) : (
                            <Animated.FlatList
                                data={repos}
                                keyExtractor={(item) => item.id.toString()}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={CARD_WIDTH}
                                decelerationRate="fast"
                                contentContainerStyle={{ paddingHorizontal: SPACING, alignItems: 'center' }}
                                onScroll={scrollHandler}
                                scrollEventThrottle={16}
                                renderItem={({ item, index }) => (
                                    <RepoCardItem 
                                        item={item} 
                                        index={index} 
                                        scrollX={scrollX} 
                                        onSelect={handleSelectRepo} 
                                        colorScheme={colorScheme} 
                                    />
                                )}
                            />
                        )}
                    </Animated.View>
                )}

                {(step === 'scanning' || step === 'analyzing') && (
                    <Animated.View entering={FadeIn.duration(1000)} exiting={FadeOut} className="flex-1 items-center justify-center">
                        {/* Immersive Central Orb */}
                        <View className="w-64 h-64 items-center justify-center mb-16 relative">
                            <Animated.View style={animatedRadar} className="absolute w-[300px] h-[300px] rounded-full bg-primary" />
                            <Animated.View style={animatedSpin} className="absolute w-[200px] h-[200px] rounded-full border border-t-[4px] border-l-[1px] border-primary/80" />
                            <View className="w-32 h-32 bg-black rounded-full items-center justify-center border-[8px] border-slate-900 shadow-2xl shadow-primary/40">
                                <Octicons name="webhook" size={48} color="#fff" />
                            </View>
                        </View>
                        
                        <Text className="text-[36px] font-black text-slate-900 dark:text-white tracking-tighter mb-4 text-center">
                            {step === 'scanning' ? 'Scanning Architecture' : 'Synthesizing Code'}
                        </Text>
                        
                        <Text className="text-[16px] text-slate-600 dark:text-slate-400 font-medium text-center px-10 leading-relaxed mb-16">
                            {step === 'scanning' ? `Mapping file trees and searching for targets in ${selectedRepo}` : `Gemini is generating a safe, contextual refactor for ${targetFile.split('/').pop()}`}
                        </Text>
                        
                        {/* Minimal Tech Logs Float */}
                        <View className="h-24 justify-end items-center overflow-hidden w-full px-8">
                            {step === 'scanning' ? scannedLogs.slice(0,3).map((log, idx) => (
                                <Animated.View key={idx} entering={SlideInDown.duration(400)} className="flex-row items-center gap-3 mb-2" style={{ opacity: 1 - (idx * 0.3) }}>
                                    <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <Text className="font-mono text-[12px] text-slate-500 dark:text-slate-400">{log.path}</Text>
                                    <Text className="font-mono text-[10px] text-slate-400 dark:text-slate-600">{log.size}</Text>
                                </Animated.View>
                            )) : (
                                <Animated.View entering={FadeIn} className="flex-row items-center gap-3">
                                    <ActivityIndicator size="small" color="#3fb950" />
                                    <Text className="font-mono text-[13px] text-primary font-bold uppercase tracking-widest">Processing {processedTokens} Tokens</Text>
                                </Animated.View>
                            )}
                        </View>
                    </Animated.View>
                )}

                {step === 'review' && (
                    <Animated.View entering={FadeInUp.duration(800).springify()} className="flex-1 w-full pt-10 px-4 pb-8">
                        <View className="mb-6 px-4 flex-row items-end justify-between">
                            <View>
                                <Text className="text-[13px] font-black tracking-widest uppercase text-primary mb-1">Target Acquired</Text>
                                <Text className="text-[28px] font-black text-slate-900 dark:text-white tracking-tighter" numberOfLines={1}>{targetFile.split('/').pop()}</Text>
                            </View>
                        </View>
                        
                        <View className="flex-1 rounded-[32px] overflow-hidden bg-black/5 dark:bg-black/40 border border-slate-200/50 dark:border-white/10 shadow-2xl mb-8">
                            <BlurView intensity={colorScheme === 'dark' ? 30 : 80} tint={colorScheme === 'dark' ? 'dark' : 'light'} className="absolute inset-0" />
                            <View className="bg-black/10 dark:bg-white/5 px-6 py-4 flex-row items-center justify-between border-b border-white/10">
                                <Text className="font-mono text-[12px] font-bold text-slate-700 dark:text-slate-300">{targetFile}</Text>
                            </View>
                            <View className="flex-1 p-2">
                                <DiffViewer diffText={diff} />
                            </View>
                        </View>
                        
                        {/* Massive Action Panel */}
                        <View className="space-y-4 px-2">
                            <TouchableOpacity onPress={handleApprove} className="w-full h-16 bg-primary rounded-full items-center justify-center shadow-2xl shadow-primary/30 active:scale-95 transition-transform flex-row gap-3">
                                <Octicons name="git-merge" size={24} color="#fff" />
                                <Text className="text-white font-black text-[16px] tracking-widest uppercase">Merge Proposal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => startProcess(selectedOwner!, selectedRepo!)} className="w-full h-16 bg-black/5 dark:bg-white/5 rounded-full items-center justify-center active:scale-95 transition-transform border border-slate-200 dark:border-white/10">
                                <Text className="text-slate-700 dark:text-slate-300 font-bold text-[13px] tracking-widest uppercase">Discard & Retarget</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {step === 'submitting' && (
                    <Animated.View entering={FadeIn.duration(500)} className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#3fb950" className="scale-[2]" />
                        <Text className="mt-12 text-[24px] font-black tracking-tight text-slate-900 dark:text-white">Pushing to Origin</Text>
                    </Animated.View>
                )}

                {step === 'done' && (
                    <Animated.View entering={FadeInDown.duration(800).springify()} className="flex-1 items-center justify-center px-8">
                        <View className="w-40 h-40 bg-primary/20 rounded-full items-center justify-center mb-10 border-8 border-primary/30 shadow-[0_0_80px_rgba(63,185,80,0.5)]">
                            <MaterialIcons name="task-alt" size={80} color="#3fb950" />
                        </View>
                        <Text className="text-[48px] font-black tracking-tighter text-slate-900 dark:text-white mb-4 text-center leading-none">Streak Secured</Text>
                        <Text className="text-[16px] text-slate-600 dark:text-slate-400 text-center font-medium leading-relaxed mb-16">
                            Automated Pull Request successfully opened. Your daily contribution graph awaits.
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL(prUrl)} className="w-full h-16 bg-slate-900 dark:bg-white rounded-full items-center justify-center mb-4 shadow-xl active:scale-95 flex-row gap-3">
                            <Octicons name="link-external" size={20} color={colorScheme === 'dark' ? '#0f172a' : '#fff'} />
                            <Text className="text-white dark:text-slate-900 font-black tracking-widest text-[14px] uppercase">Reveal Pull Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard')} className="w-full h-16 bg-transparent rounded-full items-center justify-center active:scale-95">
                            <Text className="text-slate-500 font-bold tracking-widest text-[14px] uppercase">Dashboard</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {step === 'error' && (
                    <Animated.View entering={FadeInDown.duration(600)} className="flex-1 items-center justify-center px-8">
                        <View className="w-32 h-32 bg-red-500/10 rounded-full items-center justify-center mb-8 border border-red-500/30">
                            <MaterialIcons name="gpp-bad" size={64} color="#ff3b30" />
                        </View>
                        <Text className="text-[36px] font-black tracking-tighter text-slate-900 dark:text-white mb-4">Critical Error</Text>
                        <View className="bg-red-500/10 border border-red-500/20 p-6 rounded-[24px] w-full mb-10">
                            <Text className="text-[14px] text-red-600 dark:text-red-400 font-mono text-center leading-relaxed">{errorMsg}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep('select_repo')} className="w-full h-16 bg-slate-900 dark:bg-white rounded-full items-center justify-center shadow-xl active:scale-95">
                            <Text className="text-white dark:text-slate-900 font-black tracking-widest text-[14px] uppercase">Reset & Retry</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

            </View>
        </Animated.View>
    );
}
// spatial UI bounds limits
