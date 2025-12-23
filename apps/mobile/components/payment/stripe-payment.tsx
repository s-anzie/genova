import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { CreditCard, Lock, CheckCircle } from 'lucide-react-native';
import { ApiClient } from '@/utils/api';
import { PaymentIntentResponse } from '@/types/api';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { STRIPE_CONFIG } from '@/config/stripe';

interface StripePaymentProps {
  sessionId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePayment({
  sessionId,
  amount,
  onSuccess,
  onCancel,
}: StripePaymentProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.post<{ success: boolean; data: PaymentIntentResponse }>(
        '/payments/intent',
        {
          sessionId,
          amount,
          description: `Payment for tutoring session`,
        }
      );
      setPaymentIntent(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create payment intent:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'intention de paiement');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const initializePaymentSheet = async (intent: PaymentIntentResponse) => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: STRIPE_CONFIG.merchantDisplayName,
      paymentIntentClientSecret: intent.paymentIntent.clientSecret,
      defaultBillingDetails: {
        name: 'Customer Name',
      },
      returnURL: STRIPE_CONFIG.returnURL,
    });

    if (error) {
      Alert.alert('Erreur', error.message);
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Step 1: Create payment intent
      const intent = await createPaymentIntent();

      // Step 2: Initialize payment sheet
      const initialized = await initializePaymentSheet(intent);
      if (!initialized) {
        setLoading(false);
        return;
      }

      // Step 3: Present payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        Alert.alert('Paiement annulé', error.message);
        setLoading(false);
        return;
      }

      // Step 4: Confirm payment on backend
      try {
        await ApiClient.post('/payments/confirm', {
          paymentIntentId: intent.paymentIntent.id,
          sessionId,
        });

        Alert.alert('Succès', 'Paiement effectué avec succès!', [
          {
            text: 'OK',
            onPress: onSuccess,
          },
        ]);
      } catch (confirmError: any) {
        console.error('Failed to confirm payment:', confirmError);
        Alert.alert('Erreur', confirmError.message || 'La confirmation du paiement a échoué');
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finaliser le paiement</Text>

      {/* Payment Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Prix de la session</Text>
          <Text style={styles.summaryValue}>{formatCurrency(amount)}</Text>
        </View>
        {paymentIntent && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de plateforme (15%)</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(paymentIntent.transaction.platformFee)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {formatCurrency(paymentIntent.transaction.amount)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Payment Method Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Moyen de paiement</Text>
        <View style={styles.paymentMethodCard}>
          <View style={styles.paymentMethodIcon}>
            <CreditCard size={24} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>Visa •••• 4242</Text>
            <Text style={styles.paymentMethodExpiry}>Expire 12/2025</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.changeButton}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.payButtonText}>
            Payer {formatCurrency(amount)}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>

      {/* Security Notice */}
      <View style={styles.securityCard}>
        <Lock size={14} color={Colors.success} strokeWidth={2.5} />
        <Text style={styles.securityText}>
          Sécurisé par Stripe • Vos informations de paiement sont cryptées
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: 24,
    ...Shadows.large,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  summaryCard: {
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.large,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.large,
    padding: 16,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `rgba(13, 115, 119, 0.1)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  paymentMethodExpiry: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  changeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...Shadows.primary,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `rgba(74, 222, 128, 0.1)`,
    borderRadius: BorderRadius.medium,
    padding: 12,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
});
