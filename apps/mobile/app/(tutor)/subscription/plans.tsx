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
import { ArrowLeft, Check, Crown, Zap, Star } from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows } from '@/constants/colors';
import { formatEurAsFcfa } from '@/utils/currency';

interface SubscriptionTier {
  type: string;
  price: number;
  description: string;
  features: {
    maxActiveClasses: number;
    examBankAccess: boolean;
    prioritySupport: boolean;
    platformCommission: number;
  };
}

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentType, setCurrentType] = useState<string>('FREE');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      // Load available tiers
      const tiersResponse = await apiClient.get<{ success: boolean; data: SubscriptionTier[] }>(
        '/subscriptions/tiers'
      );
      setTiers(tiersResponse.data);

      // Load current subscription
      const statusResponse = await apiClient.get<{ success: boolean; data: { type: string } }>(
        '/subscriptions/status'
      );
      setCurrentType(statusResponse.data.type);
    } catch (error: any) {
      console.error('Failed to load plans:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans d\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier.type === currentType) {
      Alert.alert('Information', 'Vous êtes déjà abonné à ce plan');
      return;
    }

    if (tier.type === 'FREE') {
      Alert.alert(
        'Confirmation',
        'Êtes-vous sûr de vouloir rétrograder vers le plan gratuit?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            style: 'destructive',
            onPress: () => router.push({
              pathname: '/(student)/subscription/purchase',
              params: { planType: tier.type },
            }),
          },
        ]
      );
      return;
    }

    router.push({
      pathname: '/(student)/subscription/purchase',
      params: { planType: tier.type },
    });
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'PREMIUM':
        return <Crown size={24} color="#FFD700" strokeWidth={2} />;
      case 'PRO':
        return <Star size={24} color="#FF6B6B" strokeWidth={2} />;
      default:
        return <Zap size={24} color={Colors.primary} strokeWidth={2} />;
    }
  };

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'PREMIUM':
        return '#FFD700';
      case 'PRO':
        return '#FF6B6B';
      default:
        return Colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir un plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Choisissez le plan qui correspond le mieux à vos besoins
        </Text>

        {/* Plans */}
        {tiers.map((tier) => {
          const isCurrent = tier.type === currentType;
          const isRecommended = tier.type === 'PREMIUM';
          const planColor = getPlanColor(tier.type);

          return (
            <View
              key={tier.type}
              style={[
                styles.planCard,
                isCurrent && styles.currentPlanCard,
                isRecommended && styles.recommendedPlanCard,
              ]}
            >
              {isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommandé</Text>
                </View>
              )}

              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Check size={14} color={Colors.white} strokeWidth={3} />
                  <Text style={styles.currentText}>Plan actuel</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.planIconContainer, { backgroundColor: `${planColor}20` }]}>
                  {getPlanIcon(tier.type)}
                </View>
                <View style={styles.planTitleContainer}>
                  <Text style={styles.planName}>
                    {tier.type === 'FREE' && 'Gratuit'}
                    {tier.type === 'BASIC' && 'Basic'}
                    {tier.type === 'PREMIUM' && 'Premium'}
                    {tier.type === 'PRO' && 'Pro'}
                  </Text>
                  <Text style={styles.planDescription}>{tier.description}</Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  {tier.price === 0 ? 'Gratuit' : formatEurAsFcfa(tier.price)}
                </Text>
                {tier.price > 0 && <Text style={styles.priceUnit}>/mois</Text>}
              </View>

              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Check size={18} color={Colors.success} strokeWidth={2.5} />
                  <Text style={styles.featureText}>
                    {tier.features?.maxActiveClasses === -1
                      ? 'Classes illimitées'
                      : `${tier.features?.maxActiveClasses || 0} classe${(tier.features?.maxActiveClasses || 0) > 1 ? 's' : ''}`}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  {tier.features?.examBankAccess ? (
                    <Check size={18} color={Colors.success} strokeWidth={2.5} />
                  ) : (
                    <View style={styles.featureDisabled} />
                  )}
                  <Text style={[styles.featureText, !tier.features?.examBankAccess && styles.featureTextDisabled]}>
                    Banque d'épreuves
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  {tier.features?.prioritySupport ? (
                    <Check size={18} color={Colors.success} strokeWidth={2.5} />
                  ) : (
                    <View style={styles.featureDisabled} />
                  )}
                  <Text style={[styles.featureText, !tier.features?.prioritySupport && styles.featureTextDisabled]}>
                    Support prioritaire
                  </Text>
                </View>

                {user?.role === 'TUTOR' && (
                  <View style={styles.featureItem}>
                    <Check size={18} color={Colors.success} strokeWidth={2.5} />
                    <Text style={styles.featureText}>
                      Commission: {((tier.features?.platformCommission || 0) * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  isCurrent && styles.selectButtonDisabled,
                  isRecommended && !isCurrent && styles.selectButtonRecommended,
                ]}
                onPress={() => handleSelectPlan(tier)}
                disabled={isCurrent}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    isCurrent && styles.selectButtonTextDisabled,
                    isRecommended && !isCurrent && styles.selectButtonTextRecommended,
                  ]}
                >
                  {isCurrent ? 'Plan actuel' : tier.price === 0 ? 'Rétrograder' : 'Choisir ce plan'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Questions fréquentes</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Puis-je changer de plan à tout moment?</Text>
            <Text style={styles.faqAnswer}>
              Oui, vous pouvez améliorer ou rétrograder votre plan à tout moment. Les changements prennent effet immédiatement.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Comment fonctionne la facturation?</Text>
            <Text style={styles.faqAnswer}>
              Les abonnements sont facturés mensuellement. Vous pouvez annuler à tout moment sans frais supplémentaires.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Que se passe-t-il si mon paiement échoue?</Text>
            <Text style={styles.faqAnswer}>
              Vous disposez d'une période de grâce de 7 jours pour mettre à jour votre moyen de paiement avant que votre compte ne soit rétrogradé.
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
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Plan Card
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Shadows.medium,
    position: 'relative',
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  recommendedPlanCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },

  // Plan Header
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  planDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Price
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  // Features
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  featureTextDisabled: {
    color: Colors.textSecondary,
  },
  featureDisabled: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
  },

  // Select Button
  selectButton: {
    backgroundColor: Colors.bgCream,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonRecommended: {
    backgroundColor: Colors.primary,
  },
  selectButtonDisabled: {
    backgroundColor: Colors.bgCream,
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectButtonTextRecommended: {
    color: Colors.white,
  },
  selectButtonTextDisabled: {
    color: Colors.textSecondary,
  },

  // FAQ
  faqSection: {
    marginTop: 24,
    gap: 16,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  faqItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    ...Shadows.small,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
