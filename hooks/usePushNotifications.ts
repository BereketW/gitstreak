import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';

export interface PushNotificationData {
    title: string;
    body: string;
    data?: Record<string, any>;
    type?: 'streak' | 'pr' | 'mention' | 'review' | 'success';
}

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string>('');
    const [notification, setNotification] = useState<any>(null);
    const [notificationPermissions, setNotificationPermissions] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        let Notifications: any = null;
        
        try {
            Notifications = require('expo-notifications');
            setIsAvailable(true);
            
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        } catch (e) {
            console.log('Notifications: Use development build for push notifications');
            return;
        }

        const requestPermissions = async (): Promise<boolean> => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            setNotificationPermissions(finalStatus);

            if (finalStatus !== 'granted') {
                console.log('Failed to get push notification permissions');
                return false;
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('streak-reminders', {
                    name: 'Streak Reminders',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#3fb950',
                    sound: 'default',
                    enableVibrate: true,
                    enableLights: true,
                });

                await Notifications.setNotificationChannelAsync('pr-updates', {
                    name: 'PR Updates',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    sound: 'default',
                });

                await Notifications.setNotificationChannelAsync('mentions', {
                    name: 'Mentions',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    sound: 'default',
                });
            }

            return true;
        };

        const registerForPushNotifications = async () => {
            try {
                const hasPermission = await requestPermissions();
                if (!hasPermission) return;

                const { data: token } = await Notifications.getExpoPushTokenAsync();
                setExpoPushToken(token);
                
            } catch (error) {
                console.log('Error registering for push notifications:', error);
            }
        };

        registerForPushNotifications();

        notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
            const data = response.notification.request.content.data;
            if (data?.screen) {
                console.log('Navigate to:', data.screen);
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    const scheduleLocalNotification = useCallback(async (notification: PushNotificationData) => {
        if (!isAvailable) {
            console.log('Notifications not available - build required');
            return;
        }
        
        try {
            const Notifications = require('expo-notifications');
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.title,
                    body: notification.body,
                    data: notification.data || {},
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
            });
        } catch (e) {
            console.log('Failed to schedule notification:', e);
        }
    }, [isAvailable]);

    const scheduleStreakReminder = useCallback(async (hoursFromNow: number = 20) => {
        if (!isAvailable) return;
        
        try {
            const Notifications = require('expo-notifications');
            const trigger = new Date();
            trigger.setHours(trigger.getHours() + hoursFromNow);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🔥 Keep your streak alive!',
                    body: "You haven't committed today. Don't lose your hard-earned streak!",
                    data: { type: 'streak', screen: 'streak-assist' },
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: trigger,
                },
            });
        } catch (e) {
            console.log('Failed to schedule streak reminder:', e);
        }
    }, [isAvailable]);

    const cancelAllScheduledNotifications = useCallback(async () => {
        if (!isAvailable) return;
        try {
            const Notifications = require('expo-notifications');
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (e) {}
    }, [isAvailable]);

    const dismissAllNotifications = useCallback(async () => {
        if (!isAvailable) return;
        try {
            const Notifications = require('expo-notifications');
            await Notifications.dismissAllNotificationsAsync();
        } catch (e) {}
    }, [isAvailable]);

    const setBadgeCount = useCallback(async (count: number) => {
        if (!isAvailable || Platform.OS !== 'ios') return;
        try {
            const Notifications = require('expo-notifications');
            await Notifications.setBadgeCountAsync(count);
        } catch (e) {}
    }, [isAvailable]);

    return {
        expoPushToken,
        notification,
        notificationPermissions,
        scheduleLocalNotification,
        scheduleStreakReminder,
        cancelAllScheduledNotifications,
        dismissAllNotifications,
        setBadgeCount,
        isAvailable,
    };
}
