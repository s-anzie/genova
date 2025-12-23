import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  createdAt: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
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

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions récentes</Text>
        <TouchableOpacity onPress={() => router.push('/transactions')}>
          <Text style={styles.seeAllText}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
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
          {transactions.map((transaction, index) => (
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
  );
}

const styles = StyleSheet.create({
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
});
