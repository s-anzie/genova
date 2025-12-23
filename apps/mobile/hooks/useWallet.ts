import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ApiClient } from '@/utils/api';
import { WalletBalance } from '@/types/api';

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

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

  useEffect(() => {
    loadWalletData();
  }, []);

  return {
    balance,
    loading,
    refreshing,
    recentTransactions,
    onRefresh,
    reload: loadWalletData,
  };
}
