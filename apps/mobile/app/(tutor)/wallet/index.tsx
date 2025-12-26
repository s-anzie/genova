import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
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
      <View className="flex-1 justify-center items-center bg-bgCream">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-sm text-gray-500 mt-3 font-medium">Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bgCream">
      <WalletHeader
        balance={balance}
        balanceVisible={balanceVisible}
        onToggleVisibility={() => setBalanceVisible(!balanceVisible)}
        showBackButton={true}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <QuickActions userRole={user?.role || 'TUTOR'} />
        
        <RecentTransactions transactions={recentTransactions} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
