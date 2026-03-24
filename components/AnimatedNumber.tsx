import React, { useEffect } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

Animated.addWhitelistedNativeProps({ text: true });

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps extends Omit<TextInputProps, 'value'> {
    value: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, ...rest }) => {
    const animatedValue = useSharedValue(0);

    useEffect(() => {
        animatedValue.value = withTiming(value, {
            duration: 400,
            easing: Easing.out(Easing.cubic),
        });
    }, [value, animatedValue]);

    const animatedProps = useAnimatedProps(() => {
        return {
            text: Math.floor(animatedValue.value).toString(),
        } as any;
    });

    return (
        <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            animatedProps={animatedProps}
            {...rest}
        />
    );
};
