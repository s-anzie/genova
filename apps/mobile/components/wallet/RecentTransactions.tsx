import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { formatEurAsFcfa } from '@/utils/currency';
import { TransactionResponse } from '@/types/api';

interface RecentTransactionsProps {
  transactions: TransactionResponse[];
  userRole?: 'student' | 'tutor' | 'STUDENT' | 'TUTOR' | 'ADMIN' | 'admin';
}

export function RecentTransactions({ transactions, userRole = 'student' }: RecentTransactionsProps) {
  const router = useRouter();
  const isTutor = userRole === 'tutor' || userRole === 'TUTOR';
  const transactionsPath = isTutor ? '/(tutor)/wallet/transactions' : '/(student)/wallet/transactions';

  const formatCurrency = (amount: number) => {
    return formatEurAsFcfa(amount);
  };

  const formatDate = (dateString: string | Date) => {
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

  const getTransactionType = (tx: TransactionResponse) => {
    switch (tx.type) {
      case 'SESSION_PAYMENT': return 'Paiement session';
      case 'SUBSCRIPTION': return 'Abonnement';
      case 'SHOP_PURCHASE': return 'Achat boutique';
      case 'WITHDRAWAL': return 'Retrait';
      default: return 'Transaction';
    }
  };

  // For students: SESSION_PAYMENT, SUBSCRIPTION, SHOP_PURCHASE are expenses
  // For tutors: SESSION_PAYMENT is income, WITHDRAWAL is expense
  const isExpense = (tx: TransactionResponse) => {
    if (isTutor) {
      return tx.type === 'WITHDRAWAL' || tx.type === 'SUBSCRIPTION' || tx.type === 'SHOP_PURCHASE';
    } else {
      return tx.type === 'SESSION_PAYMENT' || tx.type === 'SUBSCRIPTION' || tx.type === 'SHOP_PURCHASE';
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions récentes</Text>
        <TouchableOpacity onPress={() => router.push(transactionsPath as any)}>
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
                  { backgroundColor: isExpense(transaction) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)' }
                ]}>
                  {isExpense(transaction) ? (
                    <ArrowUpRight size={20} color="#EF4444" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownLeft size={20} color="#4ADE80" strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {getTransactionType(transaction)}
                  </Text>
                  {transaction.session && (
                    <Text style={styles.transactionSubtitle}>
                      {transaction.session.subject}
                    </Text>
                  )}
                  {transaction.payee && !transaction.session && (
                    <Text style={styles.transactionSubtitle}>
                      {transaction.payee.firstName} {transaction.payee.lastName}
                    </Text>
                  )}
                  {!transaction.session && !transaction.payee && (
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: isExpense(transaction) ? '#EF4444' : '#4ADE80' }
              ]}>
                {isExpense(transaction) ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
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
  transactionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
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
