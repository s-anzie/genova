import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, EyeOff, Wallet } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import { WalletBalance } from '@/types/api';

interface WalletHeaderProps {
  balance: WalletBalance | null;
  balanceVisible: boolean;
  onToggleVisibility: () => void;
  showBackButton?: boolean;
}

export function WalletHeader({ 
  balance, 
  balanceVisible, 
  onToggleVisibility,
  showBackButton = true 
}: WalletHeaderProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  const totalBalance = balance?.totalBalance || 0;
  const availableBalance = balance?.availableBalance || 0;
  const pendingBalance = balance?.pendingBalance || 0;

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {showBackButton ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onToggleVisibility}
        >
          {balanceVisible ? (
            <Eye size={22} color={Colors.white} strokeWidth={2.5} />
          ) : (
            <EyeOff size={22} color={Colors.white} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Balance Card */}
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceCardContent}>
          <View style={styles.balanceHeader}>
            <View style={styles.walletIconContainer}>
              <Wallet size={20} color={Colors.white} strokeWidth={2.5} />
            </View>
            <Text style={styles.balanceLabel}>Solde Total</Text>
          </View>
          
          <Text style={styles.balanceAmount}>
            {balanceVisible ? formatCurrency(totalBalance) : '••••••'}
          </Text>
          
          {/* Balance breakdown */}
          <View style={styles.balanceBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Disponible</Text>
              <Text style={styles.breakdownValue}>
                {balanceVisible ? formatCurrency(availableBalance) : '••••'}
              </Text>
            </View>
            
            <View style={styles.breakdownDivider} />
            
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>En attente</Text>
              <Text style={styles.breakdownValue}>
                {balanceVisible ? formatCurrency(pendingBalance) : '••••'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceCardContent: {
    gap: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1.5,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  breakdownDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
});
