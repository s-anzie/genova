import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiClient } from '@/utils/api-client';

interface SubscriptionStatus {
  type: string;
  price: number;
  features: {
    maxActiveClasses: number;
    examBankAccess: boolean;
    prioritySupport: boolean;
    platformCommission: number;
  };
  expiresAt: string | null;
  isExpired: boolean;
  isActive: boolean;
}

interface UseSubscriptionReturn {
  status: SubscriptionStatus | null;
  loading: boolean;
  refreshing: boolean;
  daysUntilExpiry: number | null;
  needsRenewal: boolean;
  refresh: () => Promise<void>;
  checkRenewalReminder: () => Promise<void>;
}

/**
 * Hook for managing subscription status and renewal reminders
 */
export function useSubscription(): UseSubscriptionReturn {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSubscriptionStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiClient.get<{ success: boolean; data: SubscriptionStatus }>(
        '/subscriptions/status'
      );
      setStatus(response.data);
    } catch (error: any) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const refresh = useCallback(async () => {
    await loadSubscriptionStatus(true);
  }, [loadSubscriptionStatus]);

  const getDaysUntilExpiry = useCallback((): number | null => {
    if (!status?.expiresAt) return null;
    const days = Math.ceil((new Date(status.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }, [status]);

  const daysUntilExpiry = getDaysUntilExpiry();
  const needsRenewal = daysUntilExpiry !== null && daysUntilExpiry <= 7 && !status?.isExpired;

  /**
   * Check if user needs renewal reminder and schedule notification
   */
  const checkRenewalReminder = useCallback(async () => {
    if (!status || status.type === 'FREE') return;

    const days = getDaysUntilExpiry();
    
    // Show reminder if subscription expires in 7 days or less
    if (days !== null && days > 0 && days <= 7) {
      // Request notification permissions
      const { status: permissionStatus } = await Notifications.requestPermissionsAsync();
      
      if (permissionStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Schedule notification for renewal reminder
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Renouvellement d\'abonnement',
          body: `Votre abonnement expire dans ${days} jour${days > 1 ? 's' : ''}. Assurez-vous que votre moyen de paiement est à jour.`,
          data: { type: 'subscription_renewal_reminder', daysUntilExpiry: days },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 60, // Show after 1 minute (for testing, adjust as needed)
        } as Notifications.TimeIntervalTriggerInput,
      });

      console.log('Renewal reminder scheduled:', notificationId);
    }

    // Show alert if subscription is expired
    if (status.isExpired) {
      Alert.alert(
        'Abonnement expiré',
        'Votre abonnement a expiré. Renouvelez-le pour retrouver l\'accès aux fonctionnalités premium.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Renouveler', onPress: () => {
            // Navigation will be handled by the component using this hook
          }},
        ]
      );
    }
  }, [status, getDaysUntilExpiry]);

  return {
    status,
    loading,
    refreshing,
    daysUntilExpiry,
    needsRenewal,
    refresh,
    checkRenewalReminder,
  };
}

/**
 * Configure notification handlers for subscription-related notifications
 */
export function configureSubscriptionNotifications() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data;
      
      // Handle subscription-related notifications
      if (data?.type === 'subscription_renewal_reminder' || 
          data?.type === 'subscription_payment_failed' ||
          data?.type === 'subscription_expired') {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  // Add notification received listener
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    console.log('Subscription notification received:', data);
  });

  // Add notification response listener (when user taps notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'subscription_renewal_reminder' ||
        data?.type === 'subscription_payment_failed' ||
        data?.type === 'subscription_expired') {
      // Navigation to subscription screen will be handled by the app
      console.log('User tapped subscription notification:', data);
    }
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}
