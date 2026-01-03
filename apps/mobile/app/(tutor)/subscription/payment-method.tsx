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
import { ArrowLeft, CreditCard, Check, Plus, Trash2 } from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows } from '@/constants/colors';

interface PaymentMethod {
  id: string;
  operatorId: string;
  phoneNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  operator?: {
    name: string;
    displayName: string;
    color: string;
    logoUrl: string | null;
  };
}

export default function SubscriptionPaymentMethodScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: PaymentMethod[] }>(
        '/payment-methods'
      );
      setPaymentMethods(response.data);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Erreur', 'Impossible de charger les moyens de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setUpdating(true);
      
      await apiClient.patch(`/payment-methods/${methodId}/default`);
      
      // Update local state
      setPaymentMethods((prev) =>
        prev.map((pm) => ({
          ...pm,
          isDefault: pm.id === methodId,
        }))
      );

      Alert.alert('Succès', 'Moyen de paiement par défaut mis à jour');
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le moyen de paiement');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMethod = (method: PaymentMethod) => {
    if (method.isDefault && paymentMethods.length > 1) {
      Alert.alert(
        'Attention',
        'Vous ne pouvez pas supprimer votre moyen de paiement par défaut. Veuillez d\'abord définir un autre moyen de paiement par défaut.'
      );
      return;
    }

    Alert.alert(
      'Supprimer le moyen de paiement',
      `Êtes-vous sûr de vouloir supprimer ${method.operator?.displayName || method.accountName}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => processDelete(method.id),
        },
      ]
    );
  };

  const processDelete = async (methodId: string) => {
    try {
      setUpdating(true);
      
      await apiClient.delete(`/payment-methods/${methodId}`);
      
      // Update local state
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== methodId));

      Alert.alert('Succès', 'Moyen de paiement supprimé');
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      Alert.alert('Erreur', error.message || 'Impossible de supprimer le moyen de paiement');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddPaymentMethod = () => {
    router.push('/wallet/add-payment-method');
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
        <Text style={styles.headerTitle}>Moyens de paiement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Gérez vos moyens de paiement pour le renouvellement automatique de votre abonnement
        </Text>

        {/* Payment Methods List */}
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={48} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.emptyStateTitle}>Aucun moyen de paiement</Text>
            <Text style={styles.emptyStateText}>
              Ajoutez un moyen de paiement pour renouveler automatiquement votre abonnement
            </Text>
          </View>
        ) : (
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodHeader}>
                  <View style={styles.methodInfo}>
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
                    <View style={styles.methodDetails}>
                      <Text style={styles.methodName}>
                        {method.operator?.displayName || method.accountName}
                      </Text>
                      <Text style={styles.methodNumber}>{method.phoneNumber}</Text>
                    </View>
                  </View>

                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Check size={12} color={Colors.white} strokeWidth={3} />
                      <Text style={styles.defaultBadgeText}>Par défaut</Text>
                    </View>
                  )}
                </View>

                <View style={styles.methodActions}>
                  {!method.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(method.id)}
                      disabled={updating}
                    >
                      <Text style={styles.actionButtonText}>Définir par défaut</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteMethod(method)}
                    disabled={updating}
                  >
                    <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Payment Method Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddPaymentMethod}>
          <Plus size={20} color={Colors.white} strokeWidth={2} />
          <Text style={styles.addButtonText}>Ajouter un moyen de paiement</Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>À propos des moyens de paiement</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoText}>
              • Votre moyen de paiement par défaut sera utilisé pour le renouvellement automatique de votre abonnement
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoText}>
              • Vous pouvez ajouter plusieurs moyens de paiement et choisir celui par défaut
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoText}>
              • En cas d'échec de paiement, vous disposez d'une période de grâce de 7 jours pour mettre à jour votre moyen de paiement
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoText}>
              • Vos informations de paiement sont sécurisées et cryptées
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
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    ...Shadows.small,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Methods List
  methodsList: {
    gap: 12,
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  operatorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  methodNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },

  // Method Actions
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCream,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: Colors.error,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    ...Shadows.medium,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Info Section
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
