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
import { ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react-native';
import { ApiClient } from '@/utils/api';
import { TransactionResponse } from '@/types/api';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { formatEurAsFcfa } from '@/utils/currency';
import { PageHeader } from '@/components/PageHeader';
import { getSubjectName } from '@/utils/session-helpers';

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ success: boolean; data: TransactionResponse[] }>(
        '/payments/history?limit=100'
      );
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Hier à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return Colors.success;
      case 'PENDING': return Colors.accent2;
      case 'FAILED': return Colors.error;
      case 'REFUNDED': return Colors.primary;
      default: return Colors.textTertiary;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'rgba(74, 222, 128, 0.1)';
      case 'PENDING': return 'rgba(255, 211, 61, 0.1)';
      case 'FAILED': return 'rgba(239, 68, 68, 0.1)';
      case 'REFUNDED': return 'rgba(13, 115, 119, 0.1)';
      default: return 'rgba(153, 153, 153, 0.1)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Complété';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'REFUNDED': return 'Remboursé';
      default: return status;
    }
  };

  const getTransactionType = (tx: TransactionResponse) => {
    switch (tx.type) {
      case 'SESSION_PAYMENT': return 'Paiement session';
      case 'SUBSCRIPTION': return 'Abonnement';
      case 'SHOP_PURCHASE': return 'Achat boutique';
      case 'WITHDRAWAL': return 'Retrait';
      default: return 'Transaction';
    }
  };

  const isExpense = (tx: TransactionResponse) => {
    return tx.type === 'SESSION_PAYMENT' || tx.type === 'SUBSCRIPTION' || tx.type === 'SHOP_PURCHASE';
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'expense') return isExpense(tx);
    if (filter === 'income') return !isExpense(tx);
    return true;
  });

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
      <PageHeader 
        title="Historique" 
        showBackButton 
        variant="primary"
        centerTitle
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'income' && styles.filterTabActive]}
          onPress={() => setFilter('income')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>
            Revenus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'expense' && styles.filterTabActive]}
          onPress={() => setFilter('expense')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'expense' && styles.filterTextActive]}>
            Dépenses
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptyText}>
              Votre historique de transactions apparaîtra ici
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionIcon}>
                  {isExpense(tx) ? (
                    <ArrowUpRight size={20} color={Colors.error} strokeWidth={2.5} />
                  ) : (
                    <ArrowDownLeft size={20} color={Colors.success} strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {getTransactionType(tx)}
                  </Text>
                  {tx.session && (
                    <Text style={styles.transactionSubtitle}>
                      {getSubjectName(tx.session)}
                    </Text>
                  )}
                  {tx.payee && (
                    <Text style={styles.transactionSubtitle}>
                      {tx.payee.firstName} {tx.payee.lastName}
                    </Text>
                  )}
                  <Text style={styles.transactionDate}>
                    {formatDate(tx.createdAt)}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: isExpense(tx) ? Colors.error : Colors.success }
                  ]}>
                    {isExpense(tx) ? '-' : '+'}{formatEurAsFcfa(tx.amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(tx.status) },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(tx.status) },
                    ]}
                  >
                    {getStatusText(tx.status)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    ...Shadows.small,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  transactionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
