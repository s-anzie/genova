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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  TrendingUp,
  TrendingDown,
  Clock, 
  CreditCard, 
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { ApiClient } from '@/utils/api';
import { useAuth } from '@/contexts/auth-context';
import { WalletBalance } from '@/types/api';
import { formatEurAsFcfa } from '@/utils/currency';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Load wallet balance
      const balanceResponse = await ApiClient.get<{ success: boolean; data: WalletBalance }>(
        '/payments/wallet'
      );
      setBalance(balanceResponse.data);

      // Load recent transactions (last 5)
      try {
        const transactionsResponse = await ApiClient.get<{ success: boolean; data: any[] }>(
          '/payments/transactions?limit=5'
        );
        setRecentTransactions(transactionsResponse.data || []);
      } catch (error) {
        console.log('No transactions yet');
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du wallet');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return formatEurAsFcfa(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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

  const totalBalance = balance?.totalBalance || 0;
  const availableBalance = balance?.availableBalance || 0;
  const pendingBalance = balance?.pendingBalance || 0;

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={['#0D7377', '#14FFEC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setBalanceVisible(!balanceVisible)}
          >
            {balanceVisible ? (
              <Eye size={22} color={Colors.white} strokeWidth={2.5} />
            ) : (
              <EyeOff size={22} color={Colors.white} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>

        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde Total</Text>
          <Text style={styles.balanceAmount}>
            {balanceVisible ? formatCurrency(totalBalance) : '••••••'}
          </Text>
          
          {/* Balance breakdown */}
          <View style={styles.balanceBreakdown}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: 'rgba(74, 222, 128, 0.2)' }]}>
                <TrendingUp size={18} color="#4ADE80" strokeWidth={2.5} />
              </View>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Disponible</Text>
                <Text style={styles.breakdownValue}>
                  {balanceVisible ? formatCurrency(availableBalance) : '••••'}
                </Text>
              </View>
            </View>
            
            <View style={styles.breakdownDivider} />
            
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                <Clock size={18} color="#FBBF24" strokeWidth={2.5} />
              </View>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>En attente</Text>
                <Text style={styles.breakdownValue}>
                  {balanceVisible ? formatCurrency(pendingBalance) : '••••'}
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
        <View style={styles.quickActions}>
          {user?.role === 'tutor' && (
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/withdraw')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4ADE80' }]}>
                <Download size={24} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.quickActionLabel}>Retirer</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/payment-methods')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgrolundColor: '#0D7377' }]}>
              <CreditCard size={24} color={Colors.white} strokeWidth={2.5} />
            </View>
            <Text style={styles.quickActionLabel}>Cartes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/transactions')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#14FFEC' }]}>
              <TrendingUp size={24} color={Colors.white} strokeWidth={2.5} />
            </View>
            <Text style={styles.quickActionLabel}>Historique</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAllText}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <TrendingUp size={32} color={Colors.textTertiary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
              <Text style={styles.emptyText}>
                Vos transactions apparaîtront ici
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={transaction.id || index}
                  style={styles.transactionItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: transaction.type === 'credit' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                    ]}>
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft size={20} color="#4ADE80" strokeWidth={2.5} />
                      ) : (
                        <ArrowUpRight size={20} color="#EF4444" strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {transaction.description || 'Transaction'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'credit' ? '#4ADE80' : '#EF4444' }
                  ]}>
                    {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 À propos de votre wallet</Text>
          <Text style={styles.infoText}>
            {user?.role === 'tutor' 
              ? 'Votre solde inclut tous les gains de vos sessions. Le solde disponible peut être retiré vers votre compte bancaire. Le solde en attente représente les fonds en cours de traitement.'
              : 'Votre wallet vous permet de gérer vos paiements pour les sessions de tutorat. Ajoutez des moyens de paiement pour réserver facilement vos cours.'
            }
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 20,
    letterSpacing: -2,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  breakdownItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownText: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  breakdownDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 12,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  transactionsList: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
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
