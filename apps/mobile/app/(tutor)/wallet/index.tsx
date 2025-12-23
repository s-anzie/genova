import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@/hooks/useWallet';
import { WalletHeader } from '@/components/wallet/WalletHeader';
import { QuickActions } from '@/components/wallet/QuickActions';
import { RecentTransactions } from '@/components/wallet/RecentTransactions';
import { Colors } from '@/constants/colors';

export default function TutorWalletScreen() {
  const { user } = useAuth();
  const { balance, loading, refreshing, recentTransactions, onRefresh } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);

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
      <WalletHeader
        balance={balance}
        balanceVisible={balanceVisible}
        onToggleVisibility={() => setBalanceVisible(!balanceVisible)}
        showBackButton={false}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <QuickActions userRole={user?.role || 'tutor'} />
        
        <RecentTransactions transactions={recentTransactions} />

        <View style={{ height: 40 }} />
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
});
