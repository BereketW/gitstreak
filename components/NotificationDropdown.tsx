import React, { useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Animated, 
    StyleSheet,
    Dimensions,
    ScrollView,
    Pressable
} from 'react-native';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications, Notification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NOTIFICATION_ICONS = {
    streak: { icon: 'local-fire-department', color: '#f59e0b' },
    pr: { icon: 'call-merge', color: '#8b5cf6' },
    mention: { icon: 'alternate-email', color: '#3b82f6' },
    review: { icon: 'rate-review', color: '#10b981' },
    success: { icon: 'check-circle', color: '#22c55e' },
};

export function NotificationDropdown() {
    const insets = useSafeAreaInsets();
    const { 
        notifications, 
        unreadCount, 
        isOpen, 
        closeDropdown, 
        markAsRead, 
        markAllAsRead 
    } = useNotifications();
    
    const slideAnim = useRef(new Animated.Value(0)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const dropdownScale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(dropdownScale, {
                    toValue: 1,
                    tension: 100,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const handleNotificationPress = (notification: Notification) => {
        markAsRead(notification.id);
    };

    const renderNotification = (notification: Notification) => {
        const iconConfig = NOTIFICATION_ICONS[notification.type];
        const timeAgo = formatDistanceToNow(notification.timestamp, { addSuffix: true });

        return (
            <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
                className={`
                    relative overflow-hidden px-4 py-3.5 border-b border-slate-100 dark:border-white/5
                    ${!notification.read ? 'bg-primary/5 dark:bg-primary/10' : 'bg-white dark:bg-[#161f2e]'}
                `}
            >
                {!notification.read && (
                    <View className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                )}
                
                <View className="flex-row gap-3 items-start">
                    <View 
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: `${iconConfig.color}15` }}
                    >
                        <MaterialIcons 
                            name={iconConfig.icon as any} 
                            size={20} 
                            color={iconConfig.color} 
                        />
                    </View>
                    
                    <View className="flex-1 pr-2">
                        <View className="flex-row justify-between items-start mb-0.5">
                            <Text className="text-sm font-bold text-slate-900 dark:text-white flex-1" numberOfLines={1}>
                                {notification.title}
                            </Text>
                            <Text className="text-[10px] text-slate-400 font-medium ml-2 flex-shrink-0">
                                {timeAgo}
                            </Text>
                        </View>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed" numberOfLines={2}>
                            {notification.message}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (!isOpen) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
            <Animated.View 
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
                    { opacity: backdropOpacity }
                ]}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={closeDropdown} />
            </Animated.View>

            <Animated.View 
                style={[
                    styles.dropdown,
                    {
                        top: Math.max(insets.top + 70, 90),
                        right: 16,
                        transform: [{ scale: dropdownScale }],
                        opacity: slideAnim,
                    }
                ]}
                pointerEvents="box-none"
            >
                <View className="bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                    <View className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <View className="flex-row items-center gap-2">
                            <Octicons name="bell" size={18} color="#3fb950" />
                            <Text className="text-base font-bold text-slate-900 dark:text-white">Notifications</Text>
                            {unreadCount > 0 && (
                                <View className="bg-primary px-2 py-0.5 rounded-full">
                                    <Text className="text-[10px] font-bold text-white">{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        {unreadCount > 0 && (
                            <TouchableOpacity 
                                onPress={markAllAsRead}
                                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800"
                            >
                                <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mark all read</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView 
                        style={styles.notificationList}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {notifications.length === 0 ? (
                            <View className="py-12 px-5 items-center">
                                <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
                                    <MaterialIcons name="notifications-off" size={28} color="#94a3b8" />
                                </View>
                                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">No notifications yet</Text>
                                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">You&apos;re all caught up!</Text>
                            </View>
                        ) : (
                            notifications.map(renderNotification)
                        )}
                    </ScrollView>

                    {notifications.length > 0 && (
                        <View className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <TouchableOpacity className="flex-row items-center justify-center gap-2 py-2">
                                <Text className="text-xs font-semibold text-primary">View all notifications</Text>
                                <MaterialIcons name="arrow-forward" size={14} color="#3fb950" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    dropdown: {
        position: 'absolute',
        width: SCREEN_WIDTH - 32,
        maxWidth: 380,
        maxHeight: 480,
        zIndex: 1000,
    },
    notificationList: {
        maxHeight: 340,
    },
});
