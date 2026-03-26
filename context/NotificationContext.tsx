import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
    id: string;
    type: 'streak' | 'pr' | 'mention' | 'review' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    toggleDropdown: () => void;
    closeDropdown: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const generateMockNotifications = (): Notification[] => [
    {
        id: '1',
        type: 'streak',
        title: '🔥 Streak at risk!',
        message: "You haven't committed today. Keep your 12-day streak alive!",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        actionUrl: '/streak-assist'
    },
    {
        id: '2',
        type: 'pr',
        title: 'PR Merged 🎉',
        message: 'Your pull request "feat: add dark mode" was merged into main',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: false,
    },
    {
        id: '3',
        type: 'review',
        title: 'Review requested',
        message: '@johndoe requested your review on #142 "Fix login bug"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        read: true,
    },
    {
        id: '4',
        type: 'mention',
        title: 'You were mentioned',
        message: '@janedoe mentioned you in "Re: API redesign discussion"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        read: true,
    },
    {
        id: '5',
        type: 'success',
        title: 'CI/CD Complete',
        message: 'Build #892 passed all tests on production branch',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
        read: true,
    },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const toggleDropdown = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isOpen,
            toggleDropdown,
            closeDropdown,
            markAsRead,
            markAllAsRead,
            addNotification,
            clearNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
