import React from 'react';
import { View, DimensionValue } from 'react-native';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    className?: string;
}

export const Skeleton = ({ width, height, className = '' }: SkeletonProps) => {
    return (
        <View 
            style={{ width, height }} 
            className={`bg-slate-200 dark:bg-[#1f2937] animate-pulse ${className}`} 
        />
    );
};
