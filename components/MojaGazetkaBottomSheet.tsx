import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export type CategoryItem = {
    id: string;
    name: string;
    icon: keyof typeof FontAwesome.glyphMap;
    color?: string;
};

const MOCK_CATEGORIES: CategoryItem[] = [
    { id: '1', name: 'Pull Requests', icon: 'code-fork', color: '#10b981' },
    { id: '2', name: 'Issues', icon: 'exclamation-circle', color: '#ef4444' },
    { id: '3', name: 'Repositories', icon: 'book', color: '#3b82f6' },
    { id: '4', name: 'Organizations', icon: 'users', color: '#f59e0b' },
    { id: '5', name: 'Stars', icon: 'star', color: '#eab308' },
    { id: '6', name: 'Projects', icon: 'trello', color: '#8b5cf6' },
    { id: '7', name: 'Gists', icon: 'file-text', color: '#6366f1' },
    { id: '8', name: 'Followers', icon: 'users', color: '#db2777' },
    { id: '9', name: 'Settings', icon: 'cog', color: '#64748b' },
];

export type MojaGazetkaBottomSheetProps = {
    title?: string;
    items?: CategoryItem[];
    onSelect?: (item: CategoryItem) => void;
    selectedId?: string;
};

export const MojaGazetkaBottomSheet = forwardRef<BottomSheetModal, MojaGazetkaBottomSheetProps>(
    ({ title = "Categories", items = MOCK_CATEGORIES, onSelect, selectedId }, ref) => {
        const snapPoints = useMemo(() => ['50%', '85%'], []);
        const { colorScheme } = useColorScheme();
        const isDark = colorScheme === 'dark';

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    pressBehavior="close"
                    opacity={0.4}
                />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={{
                    backgroundColor: isDark ? '#52525b' : '#d4d4d8',
                    width: 48,
                    height: 5,
                    borderRadius: 10,
                    marginTop: 8,
                }}
                backgroundStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                }}
            >
                <View className="flex-1 px-4 pt-2">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6 px-1">
                        <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </Text>
                        <TouchableOpacity 
                            className="bg-slate-100 dark:bg-zinc-800 w-8 h-8 rounded-full items-center justify-center active:scale-95"
                            onPress={() => {
                                // @ts-ignore
                                if (ref && 'current' in ref && ref.current) {
                                    ref.current.dismiss();
                                }
                            }}
                        >
                            <FontAwesome name="close" size={14} color={isDark ? "#a1a1aa" : "#64748b"} />
                        </TouchableOpacity>
                    </View>

                    {/* Grid */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        <View className="flex-row flex-wrap justify-between">
                            {items.map((item) => {
                                const isSelected = selectedId === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => onSelect?.(item)}
                                        className="w-[31%] mb-5 items-center active:opacity-70"
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
                                                    <FontAwesome name="check" size={10} color="black" />
                                                </View>
                                            )}
                                            
                                            <FontAwesome 
                                                name={item.icon} 
                                                size={28} 
                                                color={isSelected ? '#13ec13' : (isDark ? "#e2e8f0" : (item.color || "#334155"))} 
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
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </BottomSheetModal>
        );
    }
);

MojaGazetkaBottomSheet.displayName = 'MojaGazetkaBottomSheet';
