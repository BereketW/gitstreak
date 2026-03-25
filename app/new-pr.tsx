import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { useGithubRepos, GithubRepo } from '../hooks/useGithubRepos';
import { useGithubBranches, GithubBranch } from '../hooks/useGithubBranches';
import { useAuth } from '../context/AuthContext';

import { Skeleton } from '../components/Skeleton';

export default function NewPRScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { repos, loading: reposLoading } = useGithubRepos();
    const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
    
    const { branches, loading: branchesLoading } = useGithubBranches(selectedRepo?.full_name || null);
    
    const [baseBranch, setBaseBranch] = useState<GithubBranch | null>(null);
    const [compareBranch, setCompareBranch] = useState<GithubBranch | null>(null);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { colorScheme } = useColorScheme();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['75%', '95%'], []);
    const [modalType, setModalType] = useState<'repo' | 'base' | 'compare' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Set default repo and branches
    useEffect(() => {
        if (!selectedRepo && repos.length > 0) {
            setSelectedRepo(repos[0]);
        }
    }, [repos]);
    
    useEffect(() => {
        if (branches.length > 0) {
            const mainOrMaster = branches.find(b => b.name === 'main' || b.name === 'master');
            setBaseBranch(mainOrMaster || branches[0]);
            
            const others = branches.filter(b => b.name !== mainOrMaster?.name);
            if (others.length > 0) {
                setCompareBranch(others[0]);
            } else {
                setCompareBranch(branches[0]);
            }
        } else {
            setBaseBranch(null);
            setCompareBranch(null);
        }
    }, [branches]);

    const handleSubmitPR = async () => {
        if (!selectedRepo || !baseBranch || !compareBranch) {
            Alert.alert("Missing Information", "Please select a repository, base branch, and compare branch.");
            return;
        }
        
        if (!title.trim()) {
            Alert.alert("Missing Information", "Please enter a pull request title.");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const response = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/pulls`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title.trim(),
                    body: description.trim(),
                    head: compareBranch.name,
                    base: baseBranch.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.errors?.[0]?.message || 'Failed to create pull request');
            }

            Alert.alert("Success!", "Pull request created successfully.", [
                { text: "Awesome!", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openModal = useCallback((type: 'repo' | 'base' | 'compare') => {
        setModalType(type);
        setSearchQuery(''); // Reset search when opening
        bottomSheetModalRef.current?.present();
    }, []);

    const closeModal = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
    }, []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
            />
        ),
        []
    );

    const renderModalContent = () => {
        if (modalType === 'repo') {
            const filteredRepos = repos.filter(r => r.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
            
            return (
                <View className="flex-1 px-4">
                    <View className="pb-4 pt-2">
                        <View className="flex-row items-center bg-[#f3f4f6] dark:bg-[#27272a] rounded-xl px-4 py-4">
                            <Feather name="search" size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                            <BottomSheetTextInput 
                                className="flex-1 ml-3 text-slate-900 dark:text-white font-medium text-base"
                                placeholder="Search repositories..."
                                placeholderTextColor={colorScheme === 'dark' ? '#94a3b8' : '#64748b'}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="cancel" size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
                        {reposLoading ? (
                            <View className="flex-row flex-wrap px-1" style={{ gap: '4.5%' }}>
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <View key={idx} className="w-[30%] mb-5 items-center">
                                        <Skeleton className="w-20 h-20 rounded-[20px] mb-2" />
                                        <Skeleton className="w-16 h-3 rounded-sm" />
                                    </View>
                                ))}
                            </View>
                        ) : filteredRepos.length === 0 ? (
                            <Text className="text-center text-slate-500 mt-4">No repositories found.</Text>
                        ) : (
                            <View className="flex-row flex-wrap px-1" style={{ gap: '4.5%' }}>
                                {filteredRepos.map(repo => {
                                    const isSelected = selectedRepo?.id === repo.id;
                                    return (
                                        <TouchableOpacity
                                            key={repo.id}
                                            onPress={() => {
                                                setSelectedRepo(repo);
                                                closeModal();
                                            }}
                                            className="w-[30%] mb-5 items-center active:opacity-70"
                                        >
                                            <View 
                                                className={`w-20 h-20 rounded-[20px] items-center justify-center bg-white dark:bg-zinc-900 border shadow-sm ${
                                                    isSelected 
                                                    ? 'border-primary border-2 shadow-primary/20' 
                                                    : 'border-slate-200 dark:border-zinc-800 shadow-black/5'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <View className="absolute -top-2 -right-2 bg-primary w-6 h-6 rounded-full items-center justify-center z-10 border-2 border-white dark:border-zinc-900 shadow-sm">
                                                        <MaterialIcons name="check" size={12} color="black" />
                                                    </View>
                                                )}
                                                <Feather 
                                                    name="book" 
                                                    size={28} 
                                                    color={isSelected ? '#13ec13' : (colorScheme === 'dark' ? "#e2e8f0" : "#3b82f6")} 
                                                />
                                            </View>
                                            <Text 
                                                className={`mt-2 text-[11px] text-center font-bold px-1 ${
                                                    isSelected 
                                                    ? 'text-primary dark:text-primary' 
                                                    : 'text-slate-600 dark:text-zinc-400'
                                                }`}
                                                numberOfLines={2}
                                            >
                                                {repo.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </BottomSheetScrollView>
                </View>
            );
        }

        const isBase = modalType === 'base';
        const currentBranch = isBase ? baseBranch : compareBranch;
        const setBranch = isBase ? setBaseBranch : setCompareBranch;
        const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

        return (
            <View className="flex-1 px-4">
                <View className="pb-4 pt-2">
                    <View className="flex-row items-center bg-[#f3f4f6] dark:bg-[#27272a] rounded-xl px-4 py-4">
                        <Feather name="search" size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                        <BottomSheetTextInput 
                            className="flex-1 ml-3 text-slate-900 dark:text-white font-medium text-base"
                            placeholder="Search branches..."
                            placeholderTextColor={colorScheme === 'dark' ? '#94a3b8' : '#64748b'}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialIcons name="cancel" size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
                    {branchesLoading ? (
                        <View className="flex-row flex-wrap px-1" style={{ gap: '4.5%' }}>
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <View key={idx} className="w-[30%] mb-5 items-center">
                                    <Skeleton className="w-20 h-20 rounded-[20px] mb-2" />
                                    <Skeleton className="w-16 h-3 rounded-sm" />
                                </View>
                            ))}
                        </View>
                    ) : filteredBranches.length === 0 ? (
                        <Text className="text-center text-slate-500 mt-4">No branches found.</Text>
                    ) : (
                        <View className="flex-row flex-wrap px-1" style={{ gap: '4.5%' }}>
                            {filteredBranches.map(branch => {
                                const isSelected = currentBranch?.name === branch.name;
                                return (
                                    <TouchableOpacity
                                        key={branch.name}
                                        onPress={() => {
                                            setBranch(branch as any);
                                            closeModal();
                                        }}
                                        className="w-[30%] mb-5 items-center active:opacity-70"
                                    >
                                        <View 
                                            className={`w-20 h-20 rounded-[20px] items-center justify-center bg-white dark:bg-zinc-900 border shadow-sm ${
                                                isSelected 
                                                ? 'border-primary border-2 shadow-primary/20' 
                                                : 'border-slate-200 dark:border-zinc-800 shadow-black/5'
                                            }`}
                                        >
                                            {isSelected && (
                                                <View className="absolute -top-2 -right-2 bg-primary w-6 h-6 rounded-full items-center justify-center z-10 border-2 border-white dark:border-zinc-900 shadow-sm">
                                                    <MaterialIcons name="check" size={12} color="black" />
                                                </View>
                                            )}
                                            <MaterialIcons 
                                                name="call-split" 
                                                size={28} 
                                                color={isSelected ? '#13ec13' : (colorScheme === 'dark' ? "#e2e8f0" : "#10b981")} 
                                            />
                                        </View>
                                        <Text 
                                            className={`mt-2 text-[11px] text-center font-bold px-1 ${
                                                isSelected 
                                                ? 'text-primary dark:text-primary' 
                                                : 'text-slate-600 dark:text-zinc-400'
                                            }`}
                                            numberOfLines={2}
                                        >
                                            {branch.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </BottomSheetScrollView>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-background-dark font-display">
            {/* Minimal Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-200/50 dark:border-white/5 bg-slate-50/90 dark:bg-background-dark/90 z-50">
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 active:scale-95"
                >
                    <MaterialIcons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Create Pull Request</Text>
                <View className="w-10" />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="p-6 space-y-8 pb-32" className="flex-1" showsVerticalScrollIndicator={false}>
                    
                    {/* Goal Banner */}
                    <View className="bg-gradient-to-r from-primary/20 to-primary/5 dark:from-primary/20 dark:to-transparent border border-primary/20 rounded-2xl p-5 flex-row items-center gap-4 shadow-sm">
                        <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(19,236,19,0.3)]">
                            <MaterialIcons name="local-fire-department" size={24} color="#13ec13" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-black text-primary uppercase tracking-widest mb-1">Streak Saver</Text>
                            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">Opening this PR secures your 15-day streak. You&apos;re crushing it!</Text>
                        </View>
                    </View>

                    {/* Routing Section */}
                    <View className="bg-white dark:bg-[#111827] rounded-3xl p-2 border border-slate-200 dark:border-white/5 shadow-sm">
                        {/* Repository */}
                        <TouchableOpacity 
                            className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-[#161f2e] rounded-2xl mb-2 border border-transparent dark:border-white/5 active:scale-[0.98]"
                            onPress={() => openModal('repo')}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                    <MaterialIcons name="folder" size={16} color="#6366f1" />
                                </View>
                                <View>
                                    <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Repository</Text>
                                    {reposLoading ? (
                                        <Skeleton className="w-32 h-5 rounded-md mt-1" />
                                    ) : (
                                        <Text className="font-bold text-slate-900 dark:text-white text-base">
                                            {selectedRepo?.full_name || 'Select a repository'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Feather name="chevron-down" size={20} color="#64748b" />
                        </TouchableOpacity>

                        {/* Branch Logic */}
                        <View className="flex-row items-center gap-2 px-2 pb-2 pt-1">
                            <TouchableOpacity 
                                className="flex-1 flex-row items-center justify-between p-3 bg-white dark:bg-[#161f2e] border border-slate-200 dark:border-white/10 rounded-xl active:scale-[0.98]"
                                onPress={() => openModal('base')}
                            >
                                <View>
                                    <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Base</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <MaterialIcons name="call-split" size={14} color="#64748b" />
                                        {branchesLoading ? (
                                            <Skeleton className="w-16 h-4 rounded-sm" />
                                        ) : (
                                            <Text className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300" numberOfLines={1}>
                                                {baseBranch?.name || 'none'}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <Feather name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>

                            <View className="w-8 items-center justify-center">
                                <MaterialIcons name="west" size={20} color="#64748b" />
                            </View>

                            <TouchableOpacity 
                                className="flex-1 flex-row items-center justify-between p-3 bg-primary/5 dark:bg-primary/10 border border-primary/30 rounded-xl active:scale-[0.98]"
                                onPress={() => openModal('compare')}
                            >
                                <View>
                                    <Text className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Compare</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <MaterialIcons name="call-split" size={14} color="#13ec13" />
                                        {branchesLoading ? (
                                            <Skeleton className="w-16 h-4 rounded-sm bg-primary/20 dark:bg-primary/20" />
                                        ) : (
                                            <Text className="text-sm font-mono font-bold text-primary" numberOfLines={1}>
                                                {compareBranch?.name || 'none'}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <Feather name="chevron-down" size={16} color="#13ec13" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Inputs Section */}
                    <View className="space-y-6">
                        <View>
                            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 ml-1">Title</Text>
                            <TextInput
                                className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-lg font-bold text-slate-900 dark:text-white shadow-sm"
                                placeholder="E.g., Add new authentication flow"
                                placeholderTextColor="#94a3b8"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View>
                            <View className="flex-row items-center justify-between mb-3 ml-1">
                                <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Description</Text>
                                <Text className="text-[10px] font-medium text-slate-400">Markdown supported</Text>
                            </View>
                            <View className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                                <TextInput
                                    className="w-full p-5 text-base text-slate-700 dark:text-slate-300 leading-relaxed"
                                    placeholder="Describe the changes in this PR..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    textAlignVertical="top"
                                    style={{ minHeight: 200 }}
                                    value={description}
                                    onChangeText={setDescription}
                                />
                                <View className="flex-row items-center justify-between p-3 bg-slate-50 dark:bg-[#161f2e] border-t border-slate-100 dark:border-white/5">
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity className="p-2 bg-white dark:bg-[#111827] rounded-lg shadow-sm border border-slate-200 dark:border-white/5">
                                            <Feather name="bold" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="p-2 bg-white dark:bg-[#111827] rounded-lg shadow-sm border border-slate-200 dark:border-white/5">
                                            <Feather name="italic" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="p-2 bg-white dark:bg-[#111827] rounded-lg shadow-sm border border-slate-200 dark:border-white/5">
                                            <Feather name="link" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="p-2 bg-white dark:bg-[#111827] rounded-lg shadow-sm border border-slate-200 dark:border-white/5">
                                            <Feather name="code" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity className="p-2">
                                        <Feather name="eye" size={16} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Action Footer */}
            <View className="p-6 bg-slate-50/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 absolute bottom-0 left-0 right-0">
                <TouchableOpacity
                    className={`w-full bg-primary py-4 rounded-2xl flex-row items-center justify-center gap-3 shadow-[0_8px_30px_rgba(19,236,19,0.3)] active:scale-[0.98] transition-transform ${isSubmitting ? 'opacity-70' : ''}`}
                    onPress={handleSubmitPR}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#000" />
                    ) : (
                        <Feather name="git-pull-request" size={20} color="#000" />
                    )}
                    <Text className="text-black font-black text-lg tracking-tight">
                        {isSubmitting ? 'Creating...' : 'Create Pull Request'}
                    </Text>
                </TouchableOpacity>
            </View>

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={{
                    backgroundColor: colorScheme === 'dark' ? '#52525b' : '#d4d4d8',
                    width: 48,
                    height: 5,
                    borderRadius: 10,
                    marginTop: 8,
                }}
                backgroundStyle={{
                    backgroundColor: colorScheme === 'dark' ? '#18181b' : '#ffffff',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                }}
            >
                <View className="px-4 pt-2 pb-4 flex-row justify-between items-center z-50">
                    <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {modalType === 'repo' ? 'Select Repository' : 'Select Branch'}
                    </Text>
                    <TouchableOpacity 
                        className="bg-slate-100 dark:bg-zinc-800 w-8 h-8 rounded-full items-center justify-center active:scale-95"
                        onPress={closeModal}
                    >
                        <MaterialIcons name="close" size={14} color={colorScheme === 'dark' ? "#a1a1aa" : "#64748b"} />
                    </TouchableOpacity>
                </View>
                <View className="flex-1">
                    {renderModalContent()}
                </View>
            </BottomSheetModal>
        </SafeAreaView>
    );
}