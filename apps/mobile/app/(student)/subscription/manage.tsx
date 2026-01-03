import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  AlertCircle,
  RefreshCw,
  XCircle,
  ChevronRight,
} from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows } from '@/constants/colors';
import { formatEurAsFcfa } from '@/utils/currency';

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

export default function SubscriptionManageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: SubscriptionStatus }>(
        '/subscriptions/status'
      );
      setStatus(response.data);
    } catch (error: any) {
      console.error('Failed to load subscription status:', error);
      Alert.alert('Erreur', 'Impossible de charger le statut de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Annuler l\'abonnement',
      'Êtes-vous sûr de vouloir annuler votre abonnement? Vous perdrez l\'accès aux fonctionnalités premium et serez rétrogradé vers le plan gratuit.',
      [
        { text: 'Non, garder mon abonnement', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: processCancellation,
        },
      ]
    );
  };

  const processCancellation = async () => {
    try {
      setCancelling(true);
      
      await apiClient.post('/subscriptions/cancel');

      Alert.alert(
        'Abonnement annulé',
        'Votre abonnement a été annulé avec succès. Vous avez été rétrogradé vers le plan gratuit.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(student)/subscription'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'annuler l\'abonnement');
    } finally {
      setCancelling(false);
    }
  };

  const handleChangePaymentMethod = () => {
    router.push('/(student)/subscription/payment-method');
  };

  const handleChangePlan = () => {
    router.push('/(student)/subscription/plans');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = () => {
    if (!status?.expiresAt) return null;
    const days = Math.ceil((new Date(status.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();
  const showExpiryWarning = daysUntilExpiry !== null && daysUntilExpiry <= 7 && !status?.isExpired;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gérer l'abonnement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Statut de l'abonnement</Text>
            <View style={[styles.statusBadge, status?.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={styles.statusBadgeText}>
                {status?.isActive ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>

          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Plan actuel</Text>
              <Text style={styles.statusValue}>
                {status?.type === 'FREE' && 'Gratuit'}
                {status?.type === 'BASIC' && 'Basic'}
                {status?.type === 'PREMIUM' && 'Premium'}
                {status?.type === 'PRO' && 'Pro'}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Prix</Text>
              <Text style={styles.statusValue}>
                {status?.price === 0 ? 'Gratuit' : `${formatEurAsFcfa(status?.price || 0)}/mois`}
              </Text>
            </View>

            {status?.expiresAt && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Date de renouvellement</Text>
                <Text style={styles.statusValue}>{formatDate(status.expiresAt)}</Text>
              </View>
            )}
          </View>

          {/* Expiry Warning */}
          {showExpiryWarning && (
            <View style={styles.warningBox}>
              <AlertCircle size={20} color={Colors.warning} strokeWidth={2} />
              <Text style={styles.warningText}>
                Votre abonnement expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}. 
                Assurez-vous que votre moyen de paiement est à jour.
              </Text>
            </View>
          )}

          {/* Expired Notice */}
          {status?.isExpired && (
            <View style={styles.errorBox}>
              <XCircle size={20} color={Colors.error} strokeWidth={2} />
              <Text style={styles.errorText}>
                Votre abonnement a expiré. Renouvelez-le pour retrouver l'accès aux fonctionnalités premium.
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity style={styles.actionCard} onPress={handleChangePlan}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5F5' }]}>
                <RefreshCw size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Changer de plan</Text>
                <Text style={styles.actionDescription}>
                  Améliorer ou rétrograder votre abonnement
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {status?.type !== 'FREE' && (
            <TouchableOpacity style={styles.actionCard} onPress={handleChangePaymentMethod}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFF4E6' }]}>
                  <CreditCard size={20} color="#FF9800" strokeWidth={2} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Moyen de paiement</Text>
                  <Text style={styles.actionDescription}>
                    Gérer vos moyens de paiement
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}

          {status?.type !== 'FREE' && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleCancelSubscription}
              disabled={cancelling}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
                  <XCircle size={20} color={Colors.error} strokeWidth={2} />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionTitle, { color: Colors.error }]}>
                    Annuler l'abonnement
                  </Text>
                  <Text style={styles.actionDescription}>
                    Rétrograder vers le plan gratuit
                  </Text>
                </View>
              </View>
              {cancelling ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <ChevronRight size={20} color={Colors.textSecondary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Billing Info */}
        <View style={styles.billingSection}>
          <Text style={styles.sectionTitle}>Informations de facturation</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Calendar size={18} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.infoText}>
                Facturation mensuelle automatique
              </Text>
            </View>
            
            {status?.expiresAt && (
              <View style={styles.infoRow}>
                <RefreshCw size={18} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.infoText}>
                  Prochain renouvellement: {formatDate(status.expiresAt)}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <AlertCircle size={18} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.infoText}>
                Période de grâce de 7 jours en cas d'échec de paiement
              </Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Besoin d'aide?</Text>
          <Text style={styles.helpText}>
            Si vous rencontrez des problèmes avec votre abonnement ou votre facturation, 
            n'hésitez pas à contacter notre équipe de support.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },

  // Content
  content: {
    flex: 1,
    padding: 20,
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Shadows.medium,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  statusDetails: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF4E6',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },

  // Actions Section
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Shadows.small,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Billing Section
  billingSection: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Help Section
  helpSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    ...Shadows.small,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
