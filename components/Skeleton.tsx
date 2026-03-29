import React, { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolateColor,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    className?: string;
    style?: ViewStyle;
}

export const Skeleton = ({ width, height, className = '', style }: SkeletonProps) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1, // infinite
            true // reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(
            progress.value,
            [0, 1],
            isDark 
                ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.08)'] 
                : ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.09)']
        );
        return { backgroundColor: bg };
    });

    return (
        <Animated.View 
            style={[{ width, height, borderRadius: 8 }, animatedStyle, style]} 
            className={`${className}`} 
        />
    );
};
