import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDefaultBranch, fetchRepoTree, fetchFileContent, createStreakPR } from '../utils/github';
import { getAIProposal } from '../utils/gemini';
import { DiffViewer } from '../components/DiffViewer';
import { useColorScheme } from 'nativewind';
import { useGithubRepos, GithubRepo } from '../hooks/useGithubRepos';
import * as Haptics from 'expo-haptics';

interface ScannedLog {
    time: string;
    tag: string;
    tagColor: string;
    path: string;
    size: string;
}

export default function StreakAssistScreen() {
    const { owner: paramOwner, repo: paramRepo } = useLocalSearchParams<{ owner: string, repo: string }>();
    const router = useRouter();
    const { token } = useAuth();
    const { colorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    
    const [selectedOwner, setSelectedOwner] = useState<string | null>(paramOwner || null);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(paramRepo || null);
    
    const [step, setStep] = useState<'select_repo' | 'scanning' | 'analyzing' | 'review' | 'submitting' | 'done' | 'error'>(
        (paramOwner && paramRepo) ? 'scanning' : 'select_repo'
    );
    
    const [diff, setDiff] = useState<string>('');
    const [targetFile, setTargetFile] = useState<string>('');
    const [finalContent, setFinalContent] = useState<string>('');
    const [prUrl, setPrUrl] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    
    const [scannedLogs, setScannedLogs] = useState<ScannedLog[]>([]);
    const [totalScanned, setTotalScanned] = useState(0);
    const [integrityScore, setIntegrityScore] = useState<string>('0.0');
    const [processedTokens, setProcessedTokens] = useState<number>(0);
    const [throughput, setThroughput] = useState<number>(0);
    const [analyzingLogStep, setAnalyzingLogStep] = useState<number>(0);

    const { repos, loading: reposLoading } = useGithubRepos();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.exp)
        }).start();
    }, [step]);

    useEffect(() => {
        if (step === 'scanning') {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true
                })
            ).start();
            
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        } else {
            spinAnim.stopAnimation();
            pulseAnim.stopAnimation();
        }
    }, [step]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });
    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.25]
    });
    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 0.4]
    });

    useEffect(() => {
        if (selectedOwner && selectedRepo && token && step === 'scanning') {
            startProcess(selectedOwner, selectedRepo);
        }
    }, [selectedOwner, selectedRepo, token, step]);

    const startProcess = async (ownerStr: string, repoStr: string) => {
        if (!token) return;
        try {
            setStep('scanning');
            setTotalScanned(0);
            setScannedLogs([]);
            setAnalyzingLogStep(0);
            
            const branch = await getDefaultBranch(ownerStr, repoStr, token);
            const tree = await fetchRepoTree(ownerStr, repoStr, branch, token);
            
            const validFiles = tree.filter((t: any) => t.type === 'blob' && /\.(ts|tsx|js|jsx)$/.test(t.path));
            if (validFiles.length === 0) throw new Error("No eligible source files found.");
            
            setIntegrityScore(((validFiles.length / tree.length) * 100).toFixed(1));

            const allPaths = tree.map((t: any) => ({
                path: t.path, 
                size: t.size ? (t.size / 1024).toFixed(1) : '0.1',
                type: t.type.toUpperCase()
            })).sort(() => Math.random() - 0.5);
            
            setScannedLogs([{
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                tag: 'INIT_SCAN',
                tagColor: 'text-slate-500',
                path: `Indexing ${tree.length} files...`,
                size: ''
            }]);

            const chunkSize = Math.max(1, Math.ceil(allPaths.length / 20));
            for (let i = 0; i < allPaths.length; i += chunkSize) {
                const chunk = allPaths.slice(i, i + chunkSize);
                const newLogs = chunk.map((file: any) => ({
                    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    tag: file.type,
                    tagColor: 'text-primary',
                    path: file.path,
                    size: `-- ${file.size}kb`
                }));
                
                setScannedLogs(prev => [...newLogs, ...prev].slice(0, 50));
                setTotalScanned(prev => prev + chunk.length);
                await new Promise(r => setTimeout(r, 60)); 
            }

            const file = validFiles[Math.floor(Math.random() * Math.min(validFiles.length, 15))];
            setTargetFile(file.path);

            setStep('analyzing');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            setAnalyzingLogStep(1);
            const startTime = Date.now();
            const { content } = await fetchFileContent(ownerStr, repoStr, file.path, token);
            
            setProcessedTokens(Math.floor(content.length / 4));
            setAnalyzingLogStep(2);
            
            const result = await getAIProposal(content);
            const endTime = Date.now();
            setThroughput(Math.round(content.length / ((endTime - startTime) / 1000 || 1)));
            setAnalyzingLogStep(3);
            
            setDiff(result.diff);
            setFinalContent(result.full_content);
            await new Promise(r => setTimeout(r, 600)); 
            
            setStep('review');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
        } catch (err: any) {
            setErrorMsg(err.message);
            setStep('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleSelectRepo = (repo: GithubRepo) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedOwner(repo.owner.login);
        setSelectedRepo(repo.name);
        setStep('scanning');
    };

    const handleApprove = async () => {
        if (!selectedOwner || !selectedRepo || !token) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setStep('submitting');
            const url = await createStreakPR(
                selectedOwner, 
                selectedRepo, 
                targetFile, 
                finalContent, 
                `AI: Minor refactoring in ${targetFile}`, 
                `✨ AI Nudge: Refactor ${targetFile}`, 
                token
            );
            setPrUrl(url);
            setStep('done');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            setErrorMsg(err.message);
            setStep('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return (
        <View className="flex-1 bg-background-light dark:bg-[#10141a] font-sans">
            <View 
                style={{ paddingTop: Math.max(insets.top, 20) + 16 }}
                className="absolute top-0 left-0 right-0 z-30 px-6 pb-4 bg-background-light/90 dark:bg-[#10141a]/90 backdrop-blur-3xl border-b border-slate-200/50 dark:border-white/5 flex-row items-center gap-4"
            >
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white dark:bg-surface rounded-full shadow-sm border border-slate-200 dark:border-border active:scale-90 transition-transform">
                    <MaterialIcons name="arrow-back" size={20} color={colorScheme === 'dark' ? '#e6edf3' : '#0f172a'} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Streak Assist</Text>
                    {selectedRepo && <Text className="text-xs font-bold text-primary tracking-wide" numberOfLines={1}>Targeting: {selectedRepo}</Text>}
                </View>
                <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 flex-row items-center gap-1.5 shadow-sm shadow-primary/20">
                    <MaterialIcons name="auto-awesome" size={14} color="#3fb950" />
                    <Text className="text-primary font-black text-[10px] uppercase tracking-widest leading-none">Nudge</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 100, paddingBottom: 120, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
                    
                    {step === 'select_repo' && (
                        <View>
                            <View className="mb-8 items-center pt-4">
                                <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center border-4 border-primary/20 mb-4 shadow-xl shadow-primary/20">
                                    <MaterialIcons name="auto-awesome" size={36} color="#3fb950" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tighter">Choose a Target</Text>
                                <Text className="text-slate-500 dark:text-text-secondary text-center font-medium px-4 leading-relaxed">Select a repository for Gemini to scan. It will analyze your code to find a safe refactoring opportunity to extend your streak.</Text>
                            </View>
                            
                            {reposLoading ? (
                                <ActivityIndicator size="large" color="#3fb950" className="mt-10" />
                            ) : (
                                <View className="space-y-3">
                                    {repos.map((repo: GithubRepo) => (
                                        <TouchableOpacity 
                                            key={repo.id}
                                            onPress={() => handleSelectRepo(repo)}
                                            className="bg-white dark:bg-[#161f2e] border border-slate-200 dark:border-white/5 p-5 rounded-2xl flex-row items-center gap-4 active:scale-[0.98] transition-all shadow-sm"
                                        >
                                            <View className="w-10 h-10 bg-slate-100 dark:bg-[#0d1117] rounded-full items-center justify-center border border-slate-200 dark:border-white/5 shadow-inner">
                                                <Octicons name={repo.private ? "lock" : "repo"} size={16} color={colorScheme === 'dark' ? '#8b949e' : '#64748b'} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-base font-bold text-slate-900 dark:text-white">{repo.name}</Text>
                                                <Text className="text-xs text-slate-500 font-medium mt-0.5">{repo.language || 'Unknown'} · {repo.stargazers_count} stars</Text>
                                            </View>
                                            <MaterialIcons name="chevron-right" size={24} color={colorScheme === 'dark' ? '#30363d' : '#e2e8f0'} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {step === 'scanning' && (
                        <View className="flex-1 w-full pt-2 flex-col">
                            {/* HUD Metrics Top */}
                            <View className="flex-row justify-between w-full px-2 mb-6 z-20">
                                <View>
                                    <Text className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-[#bdcab8] mb-1">Files Scanned</Text>
                                    <Text className="text-2xl font-black font-mono text-primary">{totalScanned}</Text>
                                    <View className="flex-row items-center gap-1 mt-0.5">
                                        <View className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <Text className="text-[8px] font-bold text-primary/80 uppercase">Active</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-[#bdcab8] mb-1">Integrity Score</Text>
                                    <View className="flex-row items-baseline gap-1">
                                        <Text className="text-2xl font-black font-mono text-purple-600 dark:text-[#d5bbff]">{integrityScore}</Text>
                                        <Text className="text-sm font-black font-mono text-purple-600/60 dark:text-[#d5bbff]/60 mb-0.5">%</Text>
                                    </View>
                                    <Text className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">optimal</Text>
                                </View>
                            </View>

                            {/* Background Elements */}
                            <View className="absolute inset-0 items-center justify-center opacity-40 pointer-events-none">
                                <View className="w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px]" /> 
                            </View>
                            
                            {/* Center Orb */}
                            <View className="flex-1 items-center justify-center min-h-[220px]">
                                <View className="relative w-48 h-48 sm:w-64 sm:h-64 items-center justify-center mb-6">
                                    <View className="absolute inset-0 border border-slate-200 dark:border-primary/20 rounded-full" />
                                    <View className="absolute inset-6 border border-slate-200 dark:border-primary/15 rounded-full" />
                                    <View className="absolute inset-12 border border-slate-100 dark:border-primary/10 rounded-full" />
                                    <View className="absolute inset-20 border border-slate-100 dark:border-primary/5 rounded-full" />
                                    
                                    <Animated.View 
                                        className="absolute inset-0 items-center justify-start overflow-hidden rounded-full"
                                        style={{ transform: [{ rotate: spin }] }}
                                    >
                                        <View className="w-full h-1/2 bg-primary/10 dark:bg-primary/20" />
                                    </Animated.View>

                                    <View className="relative z-10 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary" />
                                    <Animated.View 
                                        className="absolute z-10 w-6 h-6 bg-primary rounded-full" 
                                        style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }} 
                                    />
                                </View>
                                
                                <View className="items-center space-y-1 mb-4">
                                    <Text className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Scanning Repository</Text>
                                    <Text className="text-[10px] text-primary/80 uppercase tracking-widest font-mono font-bold mt-1">Deep analysis in progress</Text>
                                </View>
                            </View>
                            
                            {/* Sleek Terminal Log, reduced bulk */}
                            <View className="w-full bg-slate-50 dark:bg-[#10141a] rounded-2xl border border-slate-200 dark:border-[#3e4a3c]/30 shadow-sm flex-col h-48 mt-auto z-20">
                                <View className="flex-row items-center justify-between px-4 py-2 bg-slate-100 dark:bg-[#1c2026] border-b border-slate-200 dark:border-[#3e4a3c]/30 rounded-t-2xl">
                                    <View className="flex-row gap-2">
                                        <View className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <View className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <View className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    </View>
                                    <Text className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">system_monitor_v4.2</Text>
                                </View>
                                
                                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                                    {scannedLogs.map((log, idx) => (
                                        <View key={idx} className="flex-row gap-3 mb-2 items-start opacity-80" style={{ opacity: 1 - (idx * 0.1) }}>
                                            <Text className="font-mono text-[10px] text-slate-400 dark:text-slate-500/70">{log.time}</Text>
                                            <Text className={`font-mono text-[10px] w-[50px] font-bold ${log.tagColor}`}>{log.tag}</Text>
                                            <Text className="font-mono text-[10px] text-slate-600 dark:text-slate-300 flex-1 tracking-tight" numberOfLines={1}>
                                                {log.path} <Text className="text-slate-400 dark:text-slate-500">{log.size}</Text>
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    )}

                    {step === 'analyzing' && (
                        <View className="flex-1 w-full pt-2 pb-6 flex-col relative">
                            {/* Ambient Background Elements */}
                            <View className="absolute top-[20%] -left-[10%] w-[300px] h-[300px] bg-purple-500/10 dark:bg-[#d5bbff]/10 rounded-full" style={{ filter: 'blur(70px)' }} />
                            <View className="absolute bottom-[20%] -right-[10%] w-[300px] h-[300px] bg-green-500/10 dark:bg-[#67df70]/5 rounded-full" style={{ filter: 'blur(70px)' }} />
                            
                            {/* HUD Metrics Top */}
                            <View className="flex-row justify-between w-full px-2 mb-2 z-20">
                                <View>
                                    <Text className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-[#bdcab8] mb-1">Processed Tokens</Text>
                                    <Text className="text-2xl font-black font-mono text-slate-900 dark:text-[#dfe2eb]">{processedTokens}</Text>
                                    <View className="w-24 h-1 bg-slate-200 dark:bg-[#31353c]/40 rounded-full mt-1.5 overflow-hidden">
                                        <View className="h-full bg-purple-500 dark:bg-[#d5bbff] w-[100%] rounded-full" />
                                    </View>
                                    <Text className="text-[8px] font-bold text-slate-500 dark:text-[#d5bbff]/60 uppercase mt-1">Throughput {throughput > 0 ? throughput : '...'} bps</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-[#bdcab8] mb-1">Model Temp</Text>
                                    <Text className="text-2xl font-black font-mono text-slate-900 dark:text-[#dfe2eb]">0.70</Text>
                                    <View className="flex-row gap-0.5 mt-1.5 w-16 justify-end">
                                        <View className="h-1 flex-1 bg-green-500 dark:bg-[#67df70] rounded-full" />
                                        <View className="h-1 flex-1 bg-green-500 dark:bg-[#67df70] rounded-full" />
                                        <View className="h-1 flex-1 bg-green-500 dark:bg-[#67df70] rounded-full" />
                                        <View className="h-1 flex-1 bg-slate-200 dark:bg-[#31353c]/40 rounded-full" />
                                    </View>
                                    <Text className="text-[8px] font-bold text-green-600 dark:text-[#67df70] uppercase mt-1">Stable</Text>
                                </View>
                            </View>

                            {/* Center Orb */}
                            <View className="flex-1 items-center justify-center min-h-[220px] z-10 w-full">
                                <Animated.View className="relative mb-8 items-center justify-center">
                                    <Animated.View className="absolute inset-0 bg-purple-500/10 dark:bg-[#d5bbff]/20 rounded-full scale-125" style={{ transform: [{ scale: pulseScale }] }} />
                                    <View className="absolute inset-[-20px] bg-green-500/5 dark:bg-[#67df70]/10 rounded-full" style={{ filter: 'blur(20px)' }} />
                                    
                                    <View className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-white/60 dark:bg-[#181c22]/60 border border-slate-200 dark:border-[#d5bbff]/20 items-center justify-center overflow-hidden">
                                        <MaterialIcons name="auto-awesome" size={56} color={colorScheme === 'dark' ? '#d5bbff' : '#a855f7'} />
                                        
                                        <Animated.View className="absolute inset-2 border border-dashed border-purple-500/20 dark:border-[#d5bbff]/10 rounded-full" style={{ transform: [{ rotate: spin }] }} />
                                        <Animated.View className="absolute inset-6 border border-green-500/20 dark:border-[#67df70]/10 rounded-full" style={{ transform: [{ rotate: spin }] }} />
                                    </View>
                                </Animated.View>

                                <View className="space-y-2 mb-2 w-full items-center">
                                    <Text className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-[#dfe2eb] text-center">
                                        Analyzing <Text className="text-purple-600 dark:text-[#d5bbff]">{targetFile.split('/').pop()}</Text>
                                    </Text>
                                    <Text className="text-slate-500 dark:text-[#bdcab8]/80 max-w-[85%] mx-auto text-[11px] sm:text-xs font-medium tracking-tight text-center leading-relaxed">
                                        Synthesizing architectural patterns and logic flow for peak neural performance.
                                    </Text>
                                </View>
                            </View>

                            {/* Sleek Process Feed (No bulky box) */}
                            <View className="w-full mt-auto z-20 px-2">
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-[10px] uppercase tracking-widest font-black text-purple-600/80 dark:text-[#d5bbff]/60">System Log</Text>
                                        <View className="h-[1px] w-6 bg-purple-500/20 dark:bg-[#d5bbff]/20" />
                                    </View>
                                    <View className="flex-row items-center gap-1.5">
                                        <Text className="text-[9px] font-bold text-slate-400 dark:text-[#bdcab8]/40">ACTIVE</Text>
                                        <Animated.View className="h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-[#d5bbff]" style={{ opacity: pulseOpacity }} />
                                    </View>
                                </View>
                                
                                <View className="space-y-3 bg-white/40 dark:bg-[#181c22]/30 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-slate-400 dark:text-[#d5bbff]/30 font-mono text-[11px]">01</Text>
                                        {analyzingLogStep >= 1 ? <MaterialIcons name="check-circle" size={14} color={colorScheme === 'dark' ? '#67df70' : '#22c55e'} /> : <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#d5bbff' : '#a855f7'} className="scale-[0.6]" />}
                                        <Text className={`font-mono text-[11px] flex-1 ${analyzingLogStep >= 1 ? 'text-slate-600 dark:text-[#bdcab8]/90' : 'text-slate-900 dark:text-[#dfe2eb] font-semibold'}`}>Fetching file content from GitHub API...</Text>
                                    </View>
                                    <View className={`flex-row items-center gap-3 ${analyzingLogStep < 1 ? 'opacity-30' : ''}`}>
                                        <Text className="text-slate-400 dark:text-[#d5bbff]/30 font-mono text-[11px]">02</Text>
                                        {analyzingLogStep >= 2 ? <MaterialIcons name="check-circle" size={14} color={colorScheme === 'dark' ? '#67df70' : '#22c55e'} /> : (analyzingLogStep === 1 ? <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#d5bbff' : '#a855f7'} className="scale-[0.6]" /> : <Text className="text-slate-400 dark:text-[#bdcab8] px-0.5">—</Text>)}
                                        <Text className={`font-mono text-[11px] flex-1 ${analyzingLogStep >= 2 ? 'text-slate-600 dark:text-[#bdcab8]/90' : (analyzingLogStep === 1 ? 'text-slate-900 dark:text-[#dfe2eb] font-semibold' : 'text-slate-500 dark:text-[#bdcab8]')}`}>Analyzing tokens & architecture</Text>
                                    </View>
                                    <View className={`flex-row items-center gap-3 ${analyzingLogStep < 2 ? 'opacity-30' : ''}`}>
                                        <Text className="text-purple-500 dark:text-[#d5bbff]/60 font-mono text-[11px]">03</Text>
                                        {analyzingLogStep >= 3 ? <MaterialIcons name="check-circle" size={14} color={colorScheme === 'dark' ? '#67df70' : '#22c55e'} /> : (analyzingLogStep === 2 ? <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#d5bbff' : '#a855f7'} className="scale-[0.6]" /> : <Text className="text-slate-400 dark:text-[#bdcab8] px-0.5">—</Text>)}
                                        <Text className={`font-mono text-[11px] flex-1 ${analyzingLogStep >= 3 ? 'text-slate-600 dark:text-[#bdcab8]/90' : (analyzingLogStep === 2 ? 'text-slate-900 dark:text-[#dfe2eb] font-semibold' : 'text-slate-500 dark:text-[#bdcab8]')}`}>Generating proposal via Gemini 1.5 Pro</Text>
                                    </View>
                                    <View className={`flex-row items-center gap-3 ${analyzingLogStep < 3 ? 'opacity-30' : ''} mt-1`}>
                                        <Text className="text-slate-400 dark:text-[#d5bbff]/30 font-mono text-[11px]">04</Text>
                                        {analyzingLogStep >= 3 ? <MaterialIcons name="check-circle" size={14} color={colorScheme === 'dark' ? '#67df70' : '#22c55e'} /> : <Text className="text-slate-400 dark:text-[#bdcab8] px-0.5">—</Text>}
                                        <Text className={`font-mono text-[11px] flex-1 ${analyzingLogStep >= 3 ? 'text-slate-600 dark:text-[#bdcab8]/90' : 'text-slate-500 dark:text-[#bdcab8]'}`}>Finalizing diff & JSON integrity</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {step === 'error' && (
                        <View className="flex-1 items-center justify-center py-10">
                            <View className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full items-center justify-center mb-6 shadow-xl shadow-red-500/20">
                                <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                            </View>
                            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">Analysis Failed</Text>
                            <Text className="text-sm text-red-600 dark:text-red-400 text-center mb-8 bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-200 dark:border-red-900/30 w-full leading-relaxed">{errorMsg}</Text>
                            <TouchableOpacity onPress={() => (selectedOwner && selectedRepo) ? startProcess(selectedOwner, selectedRepo) : setStep('select_repo')} className="w-full bg-slate-900 dark:bg-white py-4 rounded-xl items-center shadow-lg active:scale-95 transition-transform">
                                <Text className="text-white dark:text-slate-900 font-black tracking-wide text-base">TRY AGAIN</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'review' && (
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center mb-6 mt-4">
                                <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Review Changes</Text>
                            </View>
                            
                            <View className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-border rounded-2xl overflow-hidden shadow-sm">
                                <View className="bg-slate-50 dark:bg-surface border-b border-slate-200 dark:border-border px-4 py-3 flex-row items-center gap-2">
                                    <View className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center">
                                        <MaterialIcons name="code" size={14} color={colorScheme === 'dark' ? '#8b949e' : '#64748b'} />
                                    </View>
                                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink font-mono" numberOfLines={1}>
                                        {targetFile}
                                    </Text>
                                </View>
                                <DiffViewer diffText={diff} />
                            </View>

                            <View className="mt-8 space-y-4">
                                <TouchableOpacity 
                                    onPress={handleApprove}
                                    className="w-full bg-primary py-4 rounded-full items-center shadow-xl shadow-primary/30 active:scale-[0.98] transition-transform flex-row justify-center gap-2"
                                >
                                    <MaterialIcons name="call-merge" size={20} color="#000" />
                                    <Text className="text-[#0a0f18] font-black text-sm tracking-widest">APPROVE & PULL REQUEST</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => startProcess(selectedOwner!, selectedRepo!)}
                                    className="w-full bg-slate-100 dark:bg-surface py-4 rounded-full flex-row items-center justify-center gap-2 active:scale-[0.98] transition-all border border-slate-200 dark:border-border"
                                >
                                    <MaterialIcons name="refresh" size={18} color={colorScheme === 'dark' ? '#8b949e' : '#64748b'} />
                                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs tracking-widest uppercase">RE-ROLL FILE</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {step === 'submitting' && (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#3fb950" className="mb-8 scale-150" />
                            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Merging Timeline</Text>
                            <Text className="text-sm text-slate-500 text-center px-4">Auto-committing to a new branch and opening your automated PR...</Text>
                        </View>
                    )}

                    {step === 'done' && (
                        <View className="flex-1 items-center py-10 mt-6">
                            <View className="w-24 h-24 bg-green-100 dark:bg-primary/20 rounded-full items-center justify-center mb-8 border-4 border-white dark:border-[#0f172a] shadow-2xl relative">
                                <View className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                                <MaterialIcons name="check" size={48} color="#3fb950" />
                            </View>
                            <Text className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">Streak Refueled!</Text>
                            <Text className="text-base text-slate-500 text-center px-6 leading-relaxed mb-10">
                                The AI refactoring was successfully proposed. Merging your new PR will permanently secure your contribution for today.
                            </Text>
                            
                            <View className="w-full space-y-4">
                                <TouchableOpacity 
                                    onPress={() => Linking.openURL(prUrl)}
                                    className="w-full bg-slate-900 dark:bg-white py-4 rounded-full shadow-xl border border-slate-800 dark:border-white shadow-slate-900/30 flex-row items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <Octicons name="git-pull-request" size={18} color={colorScheme === 'dark' ? '#0f172a' : '#ffffff'} />
                                    <Text className="text-white dark:text-slate-900 font-black tracking-widest text-xs uppercase">VIEW PULL REQUEST</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => router.push('/(tabs)/dashboard')}
                                    className="w-full bg-slate-100 dark:bg-surface py-4 rounded-full flex-row items-center justify-center gap-2 active:scale-95 transition-transform border border-slate-200 dark:border-border"
                                >
                                    <Text className="text-slate-600 dark:text-slate-300 font-bold text-xs tracking-widest uppercase">BACK TO DASHBOARD</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </Animated.View>
            </ScrollView>
        </View>
    );
}
