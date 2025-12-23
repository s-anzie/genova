import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet, AlertCircle, Building2 } from 'lucide-react-native';
import { ApiClient } from '@/utils/api';
import { WalletBalance } from '@/types/api';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';

const MIN_WITHDRAWAL = 20;

export default function WithdrawScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Montant invalide', 'Veuillez entrer un montant valide');
      return;
    }

    if (withdrawAmount < MIN_WITHDRAWAL) {
      Alert.alert(
        'Montant minimum',
        `Le montant minimum de retrait est de €${MIN_WITHDRAWAL}`
      );
      return;
    }

    if (!balance || withdrawAmount > balance.availableBalance) {
      Alert.alert(
        'Solde insuffisant',
        'Vous n\'avez pas assez de solde disponible pour ce retrait'
      );
      return;
    }

    try {
      setSubmitting(true);
      await ApiClient.post('/payments/withdraw', {
        amount: withdrawAmount,
      });

      Alert.alert(
        'Retrait demandé',
        'Votre demande de retrait a été soumise. Les fonds seront transférés vers votre compte bancaire dans les 5 jours ouvrables.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to request withdrawal:', error);
      Alert.alert('Erreur', error.message || 'Impossible de demander le retrait');
    } finally {
      setSubmitting(false);
    }
  };

  const setQuickAmount = (percentage: number) => {
    if (balance) {
      const quickAmount = (balance.availableBalance * percentage) / 100;
      setAmount(quickAmount.toFixed(2));
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retirer</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Available Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceIconContainer}>
              <Wallet size={32} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <Text style={styles.balanceAmount}>
              {balance ? formatCurrency(balance.availableBalance) : '€0.00'}
            </Text>
            <View style={styles.minWithdrawalBadge}>
              <AlertCircle size={14} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.minWithdrawalText}>
                Minimum de retrait: €{MIN_WITHDRAWAL}
              </Text>
            </View>
          </View>

          {/* Withdrawal Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Montant du retrait</Text>
            
            <View style={styles.inputCard}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                editable={!submitting}
              />
            </View>

            {/* Quick Amount Buttons */}
            <Text style={styles.quickSelectLabel}>Sélection rapide</Text>
            <View style={styles.quickAmountGrid}>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setQuickAmount(25)}
                disabled={submitting}
              >
                <Text style={styles.quickAmountText}>25%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setQuickAmount(50)}
                disabled={submitting}
              >
                <Text style={styles.quickAmountText}>50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setQuickAmount(75)}
                disabled={submitting}
              >
                <Text style={styles.quickAmountText}>75%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setQuickAmount(100)}
                disabled={submitting}
              >
                <Text style={styles.quickAmountText}>100%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bank Account Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compte bancaire</Text>
            <View style={styles.bankCard}>
              <View style={styles.bankIconContainer}>
                <Building2 size={24} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>Compte bancaire par défaut</Text>
                <Text style={styles.bankAccount}>•••• •••• •••• 1234</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.changeButton}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Warning Card */}
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <AlertCircle size={20} color={Colors.accent2} strokeWidth={2} />
              <Text style={styles.warningTitle}>Informations importantes</Text>
            </View>
            <Text style={styles.warningText}>
              Les retraits sont traités dans les 5 jours ouvrables. 
              Les fonds seront transférés vers votre compte bancaire enregistré.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleWithdraw}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Demander le retrait</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    ...Shadows.medium,
  },
  balanceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `rgba(13, 115, 119, 0.1)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
    letterSpacing: -1,
  },
  minWithdrawalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `rgba(13, 115, 119, 0.08)`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.medium,
    gap: 6,
  },
  minWithdrawalText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  quickAmountGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: 16,
    ...Shadows.small,
  },
  bankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.large,
    backgroundColor: `rgba(13, 115, 119, 0.08)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bankAccount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  changeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  warningCard: {
    backgroundColor: `rgba(255, 211, 61, 0.1)`,
    borderRadius: BorderRadius.large,
    padding: 16,
    borderWidth: 1,
    borderColor: `rgba(255, 211, 61, 0.2)`,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent2,
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
