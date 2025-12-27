import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Plus } from 'lucide-react-native';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { AddPaymentMethodModal } from '@/components/wallet/AddPaymentMethodModal';
import { PaymentMethodCard } from '@/components/wallet/PaymentMethodCard';
import { ApiClient } from '@/utils/api';
import { PaymentMethod, MobileMoneyOperator } from '@/types/api';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [operators, setOperators] = useState<MobileMoneyOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPaymentMethods(),
        loadOperators(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await ApiClient.get<{ success: boolean; data: PaymentMethod[] }>(
        '/payment-methods'
      );
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Erreur', 'Impossible de charger les comptes');
    }
  };

  const loadOperators = async () => {
    try {
      const response = await ApiClient.get<{ success: boolean; data: MobileMoneyOperator[] }>(
        '/operators?country=CM'
      );
      setOperators(response.data);
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await ApiClient.patch(`/payment-methods/${id}/default`, {});
      await loadPaymentMethods();
      Alert.alert('Succès', 'Compte par défaut mis à jour');
    } catch (error) {
      console.error('Failed to set default:', error);
      Alert.alert('Erreur', 'Impossible de définir le compte par défaut');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer ce compte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiClient.delete(`/payment-methods/${id}`);
              await loadPaymentMethods();
              Alert.alert('Succès', 'Compte supprimé');
            } catch (error) {
              console.error('Failed to delete:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le compte');
            }
          },
        },
      ]
    );
  };

  const handleAddPaymentMethod = async (
    operatorId: string,
    phoneNumber: string,
    accountName: string,
    accountHolder?: string
  ) => {
    try {
      await ApiClient.post('/payment-methods', {
        operatorId,
        phoneNumber,
        accountName,
        accountHolder,
      });
      
      await loadPaymentMethods();
      setModalVisible(false);
      Alert.alert('Succès', 'Compte ajouté avec succès');
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le compte');
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes comptes</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Add Payment Method Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.addIconContainer}>
            <Plus size={24} color={Colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.addButtonText}>Ajouter un compte</Text>
        </TouchableOpacity>

        {/* Payment Methods List */}
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={64} color={Colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Aucun compte enregistré</Text>
            <Text style={styles.emptyText}>
              Ajoutez votre premier compte Mobile Money pour commencer
            </Text>
          </View>
        ) : (
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <AddPaymentMethodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddPaymentMethod}
        operators={operators}
      />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    ...Shadows.small,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  methodsList: {
    gap: Spacing.sm,
  },
});
