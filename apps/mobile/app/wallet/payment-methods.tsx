import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { ArrowLeft, Plus, CreditCard, Building2, CheckCircle, Trash2 } from 'lucide-react-native';
import { ApiClient } from '@/utils/api';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      // In production, fetch payment methods from your backend
      // const response = await ApiClient.get('/payments/methods');
      // setPaymentMethods(response.data);
      
      // Mock data for now
      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Erreur', 'Impossible de charger les moyens de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setLoading(true);

      // Step 1: Create setup intent on backend
      // const response = await ApiClient.post('/payments/setup-intent');
      // const { clientSecret } = response.data;

      // Step 2: Initialize payment sheet for setup
      // const { error: initError } = await initPaymentSheet({
      //   merchantDisplayName: 'Genova',
      //   setupIntentClientSecret: clientSecret,
      //   returnURL: 'genova://payment-setup-complete',
      // });

      // if (initError) {
      //   Alert.alert('Erreur', initError.message);
      //   return;
      // }

      // Step 3: Present payment sheet
      // const { error: presentError } = await presentPaymentSheet();

      // if (presentError) {
      //   Alert.alert('Annulé', presentError.message);
      //   return;
      // }

      // Step 4: Reload payment methods
      // await loadPaymentMethods();
      // Alert.alert('Succès', 'Moyen de paiement ajouté avec succès');

      // For now, show a placeholder message
      Alert.alert(
        'Ajouter un moyen de paiement',
        'Cette fonctionnalité nécessite la configuration complète de Stripe. ' +
        'En production, cela ouvrira la feuille de paiement Stripe pour ajouter une carte.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le moyen de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods((methods) =>
      methods.map((method) => ({
        ...method,
        isDefault: method.id === methodId,
      }))
    );
    Alert.alert('Succès', 'Moyen de paiement par défaut mis à jour');
  };

  const handleRemoveMethod = (methodId: string) => {
    Alert.alert(
      'Supprimer le moyen de paiement',
      'Êtes-vous sûr de vouloir supprimer ce moyen de paiement?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods((methods) =>
              methods.filter((method) => method.id !== methodId)
            );
          },
        },
      ]
    );
  };

  const getCardBrand = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      default:
        return 'Carte';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moyens de paiement</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Payment Method Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPaymentMethod}
        >
          <Plus size={20} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Ajouter un moyen de paiement</Text>
        </TouchableOpacity>

        {/* Payment Methods List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos moyens de paiement</Text>

          {paymentMethods.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconContainer}>
                <CreditCard size={48} color={Colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyText}>Aucun moyen de paiement</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez un moyen de paiement pour réserver des sessions
              </Text>
            </View>
          ) : (
            paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentCard}>
                <View style={styles.paymentCardHeader}>
                  <View style={styles.paymentCardLeft}>
                    <View style={styles.paymentIconContainer}>
                      {method.type === 'card' ? (
                        <CreditCard size={24} color={Colors.primary} strokeWidth={2} />
                      ) : (
                        <Building2 size={24} color={Colors.primary} strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>
                        {method.type === 'card'
                          ? `${getCardBrand(method.brand)} •••• ${method.last4}`
                          : `Compte bancaire •••• ${method.last4}`}
                      </Text>
                      {method.type === 'card' && method.expiryMonth && method.expiryYear && (
                        <Text style={styles.paymentExpiry}>
                          Expire {method.expiryMonth}/{method.expiryYear}
                        </Text>
                      )}
                    </View>
                  </View>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <CheckCircle size={14} color={Colors.success} strokeWidth={2.5} />
                      <Text style={styles.defaultBadgeText}>Par défaut</Text>
                    </View>
                  )}
                </View>

                <View style={styles.paymentCardActions}>
                  {!method.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(method.id)}
                    >
                      <Text style={styles.actionButtonText}>Définir par défaut</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => handleRemoveMethod(method.id)}
                  >
                    <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Paiements sécurisés</Text>
          <Text style={styles.infoText}>
            Toutes les informations de paiement sont stockées et traitées de manière sécurisée par Stripe. 
            Nous ne stockons jamais les détails complets de votre carte sur nos serveurs.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 8,
    ...Shadows.primary,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: 16,
    marginBottom: 12,
    ...Shadows.small,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.large,
    backgroundColor: `rgba(13, 115, 119, 0.08)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  paymentExpiry: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `rgba(74, 222, 128, 0.1)`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.medium,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  paymentCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.medium,
    gap: 4,
  },
  actionButtonDanger: {
    backgroundColor: `rgba(239, 68, 68, 0.1)`,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionButtonTextDanger: {
    color: Colors.error,
  },
  emptyStateCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: 40,
    alignItems: 'center',
    ...Shadows.small,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `rgba(13, 115, 119, 0.08)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.xlarge,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.peach,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
});
