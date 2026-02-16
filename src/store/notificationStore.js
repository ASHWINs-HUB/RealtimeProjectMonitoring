import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const data = await api.getNotifications();
            set({
                notifications: data.notifications,
                unreadCount: data.unread_count,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    markAsRead: async (id) => {
        try {
            await api.markNotificationRead(id);
            set(state => ({
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await api.markAllNotificationsRead();
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    },

    addNotification: (notification) => {
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }));
    }
}));
