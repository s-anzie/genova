import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Notification, NotificationBehavior } from 'expo-notifications';
import { apiClient } from '@/utils/api-client';
import { useAuth } from './auth-context';
import { NotificationResponse, NotificationPreferences } from '@/types/api';

interface NotificationContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const POLLING_INTERVAL = 60000; // 60 seconds
const THROTTLE_INTERVAL = 5000; // 5 seconds

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification: Notification): Promise<NotificationBehavior> => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef(false);

  const loadNotifications = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Prevent concurrent requests
    if (isLoadingRef.current) {
      console.log('⚠️ Notifications already loading, skipping...');
      return;
    }

    // Throttle requests
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (timeSinceLastLoad < THROTTLE_INTERVAL) {
      console.log('⚠️ Throttling notifications request');
      return;
    }

    try {
      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;

      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      const [notificationsRes, countRes] = await Promise.all([
        apiClient.get<{ data: NotificationResponse[] }>('/notifications?limit=50'),
        apiClient.get<{ data: { count: number } }>('/notifications/unread-count'),
      ]);

      setNotifications(notificationsRes.data || []);
      setUnreadCount(countRes.data?.count || 0);

      // Update badge count
      await Notifications.setBadgeCountAsync(countRes.data?.count || 0);
    } catch (err: any) {
      // Don't log errors if we're logging out
      if (err?.message !== 'Déconnexion en cours...') {
        console.error('Failed to load notifications:', err);
        setError(err.message || 'Failed to load notifications');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isLoadingRef.current = false;
    }
  }, [isAuthenticated]);

  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setPreferences(null);
      return;
    }

    // Note: Backend doesn't have notification preferences endpoint yet
    // Setting default preferences for now
    setPreferences({
      sessionNotifications: true,
      badgeNotifications: true,
      paymentNotifications: true,
      reviewNotifications: true,
      marketingNotifications: false,
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadPreferences();
    }
  }, [isAuthenticated, loadNotifications, loadPreferences]);

  // Setup polling
  useEffect(() => {
    if (!isAuthenticated) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start polling
    pollingIntervalRef.current = setInterval(() => {
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
  }, [isAuthenticated, loadNotifications]);

  // Setup notification listeners
  useEffect(() => {
    // Notification received listener
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // Refresh notifications list
      loadNotifications(false);
    });

    // Notification response listener (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // Handle navigation based on notification type
      const data = response.notification.request.content.data;
      // Navigation will be handled by the app
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [loadNotifications]);

  const refreshNotifications = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications(false);
  }, [loadNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        Notifications.setBadgeCountAsync(newCount);
        return newCount;
      });
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put('/notifications/read-all');
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await Notifications.setBadgeCountAsync(0);
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1);
          Notifications.setBadgeCountAsync(newCount);
          return newCount;
        });
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, [notifications]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      // Note: Backend doesn't have notification preferences endpoint yet
      // Update local state only for now
      setPreferences(prev => prev ? { ...prev, ...prefs } : null);
      console.log('Notification preferences updated locally:', prefs);
    } catch (err: any) {
      console.error('Failed to update notification preferences:', err);
      throw err;
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get push token for remote notifications
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token:', token.data);

      // Note: Backend doesn't have device registration endpoint yet
      // Store token locally for now
      console.log('Push token ready for backend integration:', token.data);

      return true;
    } catch (err: any) {
      console.error('Failed to request notification permissions:', err);
      return false;
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isRefreshing,
        error,
        preferences,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
