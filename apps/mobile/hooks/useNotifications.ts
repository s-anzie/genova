import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiClient } from '@/utils/api';
import { NotificationResponse } from '@/types/api';
import { AppState } from 'react-native';

const POLLING_INTERVAL = 60000; // 60 seconds

export function useNotifications(enablePolling = true) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef(false);

  const loadNotifications = useCallback(async (showLoading = true) => {
    // Prevent concurrent requests
    if (isLoadingRef.current) {
      console.log('⚠️ Notifications already loading, skipping...');
      return;
    }

    // Throttle requests - don't load more than once every 5 seconds
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (timeSinceLastLoad < 5000) {
      console.log('⚠️ Throttling notifications request (last load was', timeSinceLastLoad, 'ms ago)');
      return;
    }

    try {
      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;
      
      if (showLoading) setLoading(true);
      
      const [notificationsRes, countRes] = await Promise.all([
        ApiClient.get<{ success: boolean; data: NotificationResponse[] }>('/notifications?limit=20'),
        ApiClient.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count'),
      ]);

      setNotifications(notificationsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error: any) {
      // Don't log errors if we're logging out
      if (error?.message !== 'Déconnexion en cours...') {
        console.error('Failed to load notifications:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await ApiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await ApiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await ApiClient.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(false);
  }, [loadNotifications]);

  // Setup polling - only run once on mount
  useEffect(() => {
    loadNotifications();

    if (enablePolling) {
      // Clear any existing interval first
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Start polling
      pollingIntervalRef.current = setInterval(() => {
        // Only poll if app is in foreground
        if (appStateRef.current === 'active') {
          loadNotifications(false);
        }
      }, POLLING_INTERVAL);

      // Listen to app state changes
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        appStateRef.current = nextAppState;
        
        // Refresh when app comes to foreground
        if (nextAppState === 'active') {
          loadNotifications(false);
        }
      });

      // Cleanup
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        subscription.remove();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enablePolling]); // Only depend on enablePolling, not loadNotifications

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}
