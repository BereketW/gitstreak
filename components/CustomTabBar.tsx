import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_BAR_HEIGHT = 65;
const NOTCH_WIDTH = 75;
const NOTCH_DEPTH = 34;
const FAB_SIZE = 58;

interface CustomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
}

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    dashboard: 'home',
    repos: 'chat-bubble',
    'add-placeholder': 'add',
    timeline: 'bar-chart',
    'pull-requests': 'person',
};

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const isDark = colorScheme === 'dark';

    const bgColor = isDark ? '#161b22' : '#ffffff';
    const activeColor = '#3fb950';
    const inactiveColor = isDark ? '#484f58' : '#b0b8c1';
    const activeBgColor = isDark ? 'rgba(63, 185, 80, 0.15)' : 'rgba(63, 185, 80, 0.08)';
    const fabColor = '#3fb950';

    const totalHeight = TAB_BAR_HEIGHT + insets.bottom;
    const svgHeight = TAB_BAR_HEIGHT + NOTCH_DEPTH + insets.bottom;

    const tabs = state.routes;
    const centerIndex = tabs.findIndex((r: any) => r.name === 'add-placeholder');

    // SVG curved path
    const mid = SCREEN_WIDTH / 2;
    const notchHalf = NOTCH_WIDTH / 2;
    const curveControl = 26;
    const topY = NOTCH_DEPTH; // offset so the notch curve sits at the top

    const svgPath = [
        `M 0 ${topY}`,
        `L ${mid - notchHalf - curveControl} ${topY}`,
        `C ${mid - notchHalf} ${topY}, ${mid - notchHalf + 10} 0, ${mid} 0`,
        `C ${mid + notchHalf - 10} 0, ${mid + notchHalf} ${topY}, ${mid + notchHalf + curveControl} ${topY}`,
        `L ${SCREEN_WIDTH} ${topY}`,
        `L ${SCREEN_WIDTH} ${svgHeight}`,
        `L 0 ${svgHeight}`,
        `Z`
    ].join(' ');

    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: svgHeight }}>
            {/* SVG Curved Background */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Svg width={SCREEN_WIDTH} height={svgHeight}>
                    <Path
                        d={svgPath}
                        fill={bgColor}
                    />
                </Svg>
            </View>

            {/* FAB Button - positioned at center top */}
            <View style={{
                position: 'absolute',
                top: -FAB_SIZE / 2 + NOTCH_DEPTH / 2 + 2,
                left: mid - FAB_SIZE / 2,
                zIndex: 20,
            }}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/streak-assist');
                    }}
                    activeOpacity={0.85}
                    style={{
                        width: FAB_SIZE,
                        height: FAB_SIZE,
                        borderRadius: FAB_SIZE / 2,
                        backgroundColor: fabColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: fabColor,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                        elevation: 10,
                    }}
                >
                    <MaterialIcons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Tab Icons Row */}
            <View style={{
                position: 'absolute',
                top: NOTCH_DEPTH,
                left: 0,
                right: 0,
                height: TAB_BAR_HEIGHT,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingHorizontal: 12,
                zIndex: 10,
            }}>
                {tabs.map((route: any, index: number) => {
                    const isFocused = state.index === index;
                    const isCenter = index === centerIndex;

                    if (isCenter) {
                        // Empty spacer for the center FAB
                        return <View key={route.key} style={{ flex: 1 }} />;
                    }

                    const iconName = TAB_ICONS[route.name] || 'circle';

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            }}
                            activeOpacity={0.7}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: TAB_BAR_HEIGHT,
                            }}
                        >
                            <View style={[
                                {
                                    width: 46,
                                    height: 46,
                                    borderRadius: 23,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                },
                                isFocused && { backgroundColor: activeBgColor },
                            ]}>
                                <MaterialIcons
                                    name={iconName}
                                    size={24}
                                    color={isFocused ? activeColor : inactiveColor}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
