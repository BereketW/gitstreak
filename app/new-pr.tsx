import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewPRScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-background-light dark:bg-[#0a0f18] font-display">
            {/* Minimal Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-200/50 dark:border-white/5 bg-background-light/90 dark:bg-[#0a0f18]/90 z-50">
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
                            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">Opening this PR secures your 15-day streak. You're crushing it!</Text>
                        </View>
                    </View>

                    {/* Routing Section */}
                    <View className="bg-white dark:bg-[#111827] rounded-3xl p-2 border border-slate-200 dark:border-white/5 shadow-sm">
                        {/* Repository */}
                        <TouchableOpacity className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-[#161f2e] rounded-2xl mb-2 border border-transparent dark:border-white/5">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                    <MaterialIcons name="folder" size={16} color="#6366f1" />
                                </View>
                                <View>
                                    <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Repository</Text>
                                    <Text className="font-bold text-slate-900 dark:text-white text-base">acme-corp / phoenix</Text>
                                </View>
                            </View>
                            <Feather name="chevron-down" size={20} color="#64748b" />
                        </TouchableOpacity>

                        {/* Branch Logic */}
                        <View className="flex-row items-center gap-2 px-2 pb-2 pt-1">
                            <TouchableOpacity className="flex-1 flex-row items-center justify-between p-3 bg-white dark:bg-[#161f2e] border border-slate-200 dark:border-white/10 rounded-xl">
                                <View>
                                    <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Base</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <MaterialIcons name="call-split" size={14} color="#64748b" />
                                        <Text className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">main</Text>
                                    </View>
                                </View>
                                <Feather name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>

                            <View className="w-8 items-center justify-center">
                                <MaterialIcons name="west" size={20} color="#64748b" />
                            </View>

                            <TouchableOpacity className="flex-1 flex-row items-center justify-between p-3 bg-primary/5 dark:bg-primary/10 border border-primary/30 rounded-xl">
                                <View>
                                    <Text className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Compare</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <MaterialIcons name="call-split" size={14} color="#13ec13" />
                                        <Text className="text-sm font-mono font-bold text-primary">feat/auth</Text>
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
            <View className="p-6 bg-background-light/90 dark:bg-[#0a0f18]/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 absolute bottom-0 left-0 right-0">
                <TouchableOpacity
                    className="w-full bg-primary py-4 rounded-2xl flex-row items-center justify-center gap-3 shadow-[0_8px_30px_rgba(19,236,19,0.3)] active:scale-[0.98] transition-transform"
                    onPress={() => router.back()}
                >
                    <Feather name="git-pull-request" size={20} color="#000" />
                    <Text className="text-black font-black text-lg tracking-tight">Create Pull Request</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}