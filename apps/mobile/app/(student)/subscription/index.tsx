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
import { ArrowLeft, Crown, Check, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
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

export default function SubscriptionIndexScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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

  const handleUpgrade = () => {
    router.push('/(student)/subscription/plans');
  };

  const handleManage = () => {
    router.push('/(student)/subscription/manage');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isFreeTier = status?.type === 'FREE';
  const daysUntilExpiry = status?.expiresAt
    ? Math.ceil((new Date(status.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Abonnement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Card */}
        <View style={[styles.currentPlanCard, isFreeTier ? styles.freePlanCard : styles.premiumPlanCard]}>
          <View style={styles.planHeader}>
            <View style={styles.planIconContainer}>
              <Crown size={32} color={isFreeTier ? Colors.textSecondary : '#FFD700'} strokeWidth={2} />
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, isFreeTier && { color: Colors.textPrimary }]}>
                {status?.type === 'FREE' && 'Gratuit'}
                {status?.type === 'BASIC' && 'Basic'}
                {status?.type === 'PREMIUM' && 'Premium'}
                {status?.type === 'PRO' && 'Pro'}
              </Text>
              <Text style={[styles.planPrice, isFreeTier && { color: Colors.textSecondary }]}>
                {status?.price === 0 ? 'Gratuit' : `${formatEurAsFcfa(status?.price || 0)}/mois`}
              </Text>
            </View>
          </View>

          {/* Expiry Warning */}
          {status?.expiresAt && !status.isExpired && daysUntilExpiry && daysUntilExpiry <= 7 && (
            <View style={styles.expiryWarning}>
              <AlertCircle size={16} color={Colors.warning} strokeWidth={2} />
              <Text style={styles.expiryWarningText}>
                Expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Expired Notice */}
          {status?.isExpired && (
            <View style={styles.expiredNotice}>
              <AlertCircle size={16} color={Colors.error} strokeWidth={2} />
              <Text style={styles.expiredNoticeText}>
                Abonnement expiré
              </Text>
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, isFreeTier ? { color: Colors.textSecondary } : { color: 'rgba(255, 255, 255, 0.8)' }]}>
              Fonctionnalités incluses:
            </Text>
            
            <View style={styles.featureItem}>
              <Check size={16} color={isFreeTier ? Colors.success : Colors.white} strokeWidth={2.5} />
              <Text style={[styles.featureText, isFreeTier ? { color: Colors.textPrimary } : { color: Colors.white }]}>
                {status?.features?.maxActiveClasses === -1
                  ? 'Classes illimitées'
                  : `${status?.features?.maxActiveClasses || 0} classe${(status?.features?.maxActiveClasses || 0) > 1 ? 's' : ''} active${(status?.features?.maxActiveClasses || 0) > 1 ? 's' : ''}`}
              </Text>
            </View>

            <View style={styles.featureItem}>
              {status?.features?.examBankAccess ? (
                <Check size={16} color={isFreeTier ? Colors.success : Colors.white} strokeWidth={2.5} />
              ) : (
                <View style={[styles.featureDisabled, isFreeTier ? { borderColor: Colors.border } : { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />
              )}
              <Text style={[
                styles.featureText, 
                isFreeTier ? { color: Colors.textPrimary } : { color: Colors.white },
                !status?.features?.examBankAccess && styles.featureTextDisabled
              ]}>
                Banque d'épreuves
              </Text>
            </View>

            <View style={styles.featureItem}>
              {status?.features?.prioritySupport ? (
                <Check size={16} color={isFreeTier ? Colors.success : Colors.white} strokeWidth={2.5} />
              ) : (
                <View style={[styles.featureDisabled, isFreeTier ? { borderColor: Colors.border } : { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />
              )}
              <Text style={[
                styles.featureText,
                isFreeTier ? { color: Colors.textPrimary } : { color: Colors.white },
                !status?.features?.prioritySupport && styles.featureTextDisabled
              ]}>
                Support prioritaire
              </Text>
            </View>

            {user?.role === 'TUTOR' && (
              <View style={styles.featureItem}>
                <Check size={16} color={isFreeTier ? Colors.success : Colors.white} strokeWidth={2.5} />
                <Text style={[styles.featureText, isFreeTier ? { color: Colors.textPrimary } : { color: Colors.white }]}>
                  Commission plateforme: {((status?.features?.platformCommission || 0) * 100).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isFreeTier || status?.isExpired ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Crown size={20} color={Colors.white} strokeWidth={2} />
              <Text style={styles.upgradeButtonText}>Améliorer mon abonnement</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.manageButton} onPress={handleManage}>
                <Text style={styles.manageButtonText}>Gérer mon abonnement</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.viewPlansButton} onPress={handleUpgrade}>
                <Text style={styles.viewPlansButtonText}>Voir tous les plans</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Pourquoi passer à Premium?</Text>
          
          <View style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>📚 Banque d'épreuves complète</Text>
            <Text style={styles.benefitDescription}>
              Accédez à des milliers d'examens blancs et corrections détaillées
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>👥 Classes illimitées</Text>
            <Text style={styles.benefitDescription}>
              Créez autant de groupes d'étude que vous le souhaitez
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>⚡ Support prioritaire</Text>
            <Text style={styles.benefitDescription}>
              Obtenez de l'aide rapidement avec notre équipe dédiée
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Current Plan Card
  currentPlanCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    ...Shadows.medium,
  },
  freePlanCard: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  premiumPlanCard: {
    backgroundColor: Colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Warnings
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  expiryWarningText: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '600',
  },
  expiredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  expiredNoticeText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },

  // Features
  featuresContainer: {
    gap: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },
  featureTextDisabled: {
    opacity: 0.6,
  },
  featureDisabled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },

  // Actions
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    ...Shadows.medium,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  manageButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadows.small,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  viewPlansButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  viewPlansButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Benefits
  benefitsSection: {
    gap: 12,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  benefitCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    ...Shadows.small,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
