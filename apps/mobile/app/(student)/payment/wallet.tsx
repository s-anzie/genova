import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  Download,
  ChevronRight,
} from 'lucide-react-native';
import { ApiClient } from '@/utils/api';
import { useAuth } from '@/contexts/auth-context';
import { WalletBalance } from '@/types/api';
import { Colors, Gradients, Shadows, Spacing, BorderRadius } from '@/constants/colors';

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ success: boolean; data: WalletBalance }>(
        '/payments/wallet'
      );
      setBalance(response.data);
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
      Alert.alert('Erreur', 'Impossible de charger le solde du wallet');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletBalance();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
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
      {/* Header */}
      <LinearGradient colors={Gradients.primary} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde Total</Text>
          <Text style={styles.balanceAmount}>
            {balance ? formatCurrency(balance.totalBalance) : '0,00 €'}
          </Text>
          
          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetailItem}>
              <View style={styles.balanceDetailIcon}>
                <TrendingUp size={16} color={Colors.success} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.balanceDetailLabel}>Disponible</Text>
                <Text style={styles.balanceDetailValue}>
                  {balance ? formatCurrency(balance.availableBalance) : '0,00 €'}
                </Text>
              </View>
            </View>
            
            <View style={styles.balanceDetailDivider} />
            
            <View style={styles.balanceDetailItem}>
              <View style={[styles.balanceDetailIcon, { backgroundColor: 'rgba(255, 211, 61, 0.2)' }]}>
                <Clock size={16} color={Colors.accent2} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.balanceDetailLabel}>En attente</Text>
                <Text style={styles.balanceDetailValue}>
                  {balance ? formatCurrency(balance.pendingBalance) : '0,00 €'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/payment/transactions')}
            activeOpacity={0.7}
          >
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(13, 115, 119, 0.1)' }]}>
                <TrendingUp size={24} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Historique</Text>
                <Text style={styles.actionSubtitle}>Voir toutes les transactions</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          {user?.role === 'tutor' && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/payment/withdraw')}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                  <Download size={24} color={Colors.success} strokeWidth={2} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Retirer</Text>
                  <Text style={styles.actionSubtitle}>Transférer vers votre compte</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/payment/payment-methods')}
            activeOpacity={0.7}
          >
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                <CreditCard size={24} color={Colors.accent1} strokeWidth={2} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Moyens de paiement</Text>
                <Text style={styles.actionSubtitle}>Gérer vos cartes</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 À propos de votre wallet</Text>
          <Text style={styles.infoText}>
            Votre solde inclut tous les gains de vos sessions de tutorat. 
            Le solde disponible peut être retiré vers votre compte bancaire. 
            Le solde en attente représente les fonds des sessions récentes en cours de traitement.
          </Text>
        </View>

        <View style={{ height: 20 }} />
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    paddingTop: 60, // Status bar spacing
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xxlarge,
    borderBottomRightRadius: BorderRadius.xxlarge,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.md,
    letterSpacing: -1,
  },
  balanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceDetailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  balanceDetailDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.small,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.large,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.peach,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
});
