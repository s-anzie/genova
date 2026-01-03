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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Check, AlertCircle } from 'lucide-react-native';
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

interface PaymentMethod {
  id: string;
  operatorId: string;
  phoneNumber: string;
  accountName: string;
  isDefault: boolean;
  operator?: {
    name: string;
    displayName: string;
    color: string;
  };
}

export default function SubscriptionPurchaseScreen() {
  const router = useRouter();
  const { planType } = useLocalSearchParams<{ planType: string }>();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionTier | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load plan details
      const tiersResponse = await apiClient.get<{ success: boolean; data: SubscriptionTier[] }>(
        '/subscriptions/tiers'
      );
      const selectedPlan = tiersResponse.data.find((t) => t.type === planType);
      setPlan(selectedPlan || null);

      // Load payment methods if not free plan
      if (planType !== 'FREE') {
        try {
          const paymentMethodsResponse = await apiClient.get<{ success: boolean; data: PaymentMethod[] }>(
            '/payment-methods'
          );
          setPaymentMethods(paymentMethodsResponse.data);
          
          // Auto-select default payment method
          const defaultMethod = paymentMethodsResponse.data.find((pm) => pm.isDefault);
          if (defaultMethod) {
            setSelectedPaymentMethod(defaultMethod.id);
          }
        } catch (error) {
          console.log('No payment methods found');
        }
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!plan) return;

    // Free plan doesn't require payment
    if (plan.type === 'FREE') {
      Alert.alert(
        'Confirmation',
        'Êtes-vous sûr de vouloir rétrograder vers le plan gratuit? Vous perdrez l\'accès aux fonctionnalités premium.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            style: 'destructive',
            onPress: processFreeDowngrade,
          },
        ]
      );
      return;
    }

    // Paid plans require payment method
    if (!selectedPaymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner un moyen de paiement');
      return;
    }

    Alert.alert(
      'Confirmer l\'abonnement',
      `Vous allez souscrire au plan ${getPlanName(plan.type)} pour ${formatEurAsFcfa(plan.price)}/mois. Continuer?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: processPurchase },
      ]
    );
  };

  const processFreeDowngrade = async () => {
    try {
      setProcessing(true);
      
      await apiClient.post('/subscriptions/create', {
        subscriptionType: 'FREE',
      });

      Alert.alert(
        'Succès',
        'Votre abonnement a été rétrogradé vers le plan gratuit',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(student)/subscription'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to downgrade:', error);
      Alert.alert('Erreur', error.message || 'Impossible de rétrograder l\'abonnement');
    } finally {
      setProcessing(false);
    }
  };

  const processPurchase = async () => {
    try {
      setProcessing(true);

      const response = await apiClient.post<{
        success: boolean;
        data: {
          user: any;
          subscription: {
            type: string;
            price: number;
            expiresAt: string;
            stripeSubscriptionId?: string;
            clientSecret?: string;
          };
        };
      }>('/subscriptions/create', {
        subscriptionType: planType,
        paymentMethodId: selectedPaymentMethod,
      });

      // In a real implementation, you would handle Stripe payment here
      // For now, we'll just show success
      Alert.alert(
        'Succès',
        'Votre abonnement a été activé avec succès!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(student)/subscription'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to purchase subscription:', error);
      Alert.alert('Erreur', error.message || 'Impossible de souscrire à l\'abonnement');
    } finally {
      setProcessing(false);
    }
  };

  const getPlanName = (type: string) => {
    switch (type) {
      case 'FREE':
        return 'Gratuit';
      case 'BASIC':
        return 'Basic';
      case 'PREMIUM':
        return 'Premium';
      case 'PRO':
        return 'Pro';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={Colors.error} strokeWidth={2} />
        <Text style={styles.errorText}>Plan introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finaliser l'abonnement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Récapitulatif</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan sélectionné</Text>
            <Text style={styles.summaryValue}>{getPlanName(plan.type)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Prix</Text>
            <Text style={styles.summaryValue}>
              {plan.price === 0 ? 'Gratuit' : `${formatEurAsFcfa(plan.price)}/mois`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Fonctionnalités incluses:</Text>
            
            <View style={styles.featureItem}>
              <Check size={16} color={Colors.success} strokeWidth={2.5} />
              <Text style={styles.featureText}>
                {plan.features?.maxActiveClasses === -1
                  ? 'Classes illimitées'
                  : `${plan.features?.maxActiveClasses || 0} classe${(plan.features?.maxActiveClasses || 0) > 1 ? 's' : ''}`}
              </Text>
            </View>

            {plan.features?.examBankAccess && (
              <View style={styles.featureItem}>
                <Check size={16} color={Colors.success} strokeWidth={2.5} />
                <Text style={styles.featureText}>Banque d'épreuves</Text>
              </View>
            )}

            {plan.features?.prioritySupport && (
              <View style={styles.featureItem}>
                <Check size={16} color={Colors.success} strokeWidth={2.5} />
                <Text style={styles.featureText}>Support prioritaire</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Method Selection */}
        {plan.type !== 'FREE' && (
          <View style={styles.paymentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Moyen de paiement</Text>
              <TouchableOpacity onPress={() => router.push('/wallet/payment-methods')}>
                <Text style={styles.addPaymentText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {paymentMethods.length === 0 ? (
              <View style={styles.noPaymentMethods}>
                <CreditCard size={32} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.noPaymentMethodsText}>
                  Aucun moyen de paiement enregistré
                </Text>
                <TouchableOpacity
                  style={styles.addPaymentButton}
                  onPress={() => router.push('/wallet/payment-methods')}
                >
                  <Text style={styles.addPaymentButtonText}>Ajouter un moyen de paiement</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.paymentMethodsList}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodCard,
                      selectedPaymentMethod === method.id && styles.paymentMethodCardSelected,
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                  >
                    <View style={styles.paymentMethodInfo}>
                      <View
                        style={[
                          styles.operatorIcon,
                          { backgroundColor: method.operator?.color || Colors.primary },
                        ]}
                      >
                        <Text style={styles.operatorIconText}>
                          {method.operator?.name.charAt(0) || 'M'}
                        </Text>
                      </View>
                      <View style={styles.paymentMethodDetails}>
                        <Text style={styles.paymentMethodName}>
                          {method.operator?.displayName || method.accountName}
                        </Text>
                        <Text style={styles.paymentMethodNumber}>{method.phoneNumber}</Text>
                      </View>
                    </View>
                    {selectedPaymentMethod === method.id && (
                      <View style={styles.selectedIndicator}>
                        <Check size={16} color={Colors.white} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            En souscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            L'abonnement est renouvelé automatiquement chaque mois.
          </Text>
        </View>
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (processing || (plan.type !== 'FREE' && !selectedPaymentMethod)) && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={processing || (plan.type !== 'FREE' && !selectedPaymentMethod)}
        >
          {processing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>
              {plan.type === 'FREE' ? 'Confirmer' : `Souscrire pour ${formatEurAsFcfa(plan.price)}/mois`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  headerBackButton: {
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

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Shadows.medium,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  featuresContainer: {
    gap: 10,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Payment Section
  paymentSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  noPaymentMethods: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    ...Shadows.small,
  },
  noPaymentMethodsText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  addPaymentButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  addPaymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  paymentMethodsList: {
    gap: 12,
  },
  paymentMethodCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.small,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  operatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  paymentMethodNumber: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Terms
  termsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...Shadows.small,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadows.medium,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
