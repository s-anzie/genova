import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DollarSign, AlertCircle } from 'lucide-react-native';
import { useWallet } from '@/hooks/useWallet';
import { formatEurAsFcfa, fcfaToEur, eurToFcfa } from '@/utils/currency';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';

export default function AddFundsScreen() {
  const router = useRouter();
  const { balance } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const currentBalance = balance?.totalBalance || 0;

  const handleAddFunds = async () => {
    const addAmountFcfa = parseFloat(amount);
    
    if (!addAmountFcfa || addAmountFcfa <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    const minFcfa = eurToFcfa(0.76); // ~500 FCFA
    if (addAmountFcfa < minFcfa) {
      Alert.alert('Erreur', `Le montant minimum est de ${minFcfa.toLocaleString('fr-FR')} FCFA`);
      return;
    }

    setLoading(true);
    try {
      // Convert FCFA to EUR for API call
      const addAmountEur = fcfaToEur(addAmountFcfa);
      // TODO: Implement add funds API call with Orange Money / MTN MoMo
      // API expects amount in EUR
      Alert.alert('Succès', 'Fonds ajoutés avec succès');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const setQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Recharger le compte" 
        showBackButton 
        variant="primary"
        centerTitle
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde actuel</Text>
          <Text style={styles.balanceAmount}>{formatEurAsFcfa(currentBalance)}</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Montant à recharger</Text>
          <View style={styles.inputContainer}>
            <DollarSign size={20} color="#666666" />
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor="#666666"
            />
            <Text style={styles.currency}>FCFA</Text>
          </View>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Montants rapides</Text>
          <View style={styles.quickAmounts}>
            {[500, 1000, 2500, 5000].map((valueInFcfa) => (
              <TouchableOpacity
                key={valueInFcfa}
                style={[
                  styles.quickButton,
                  amount === valueInFcfa.toString() && styles.quickButtonActive
                ]}
                onPress={() => setQuickAmount(valueInFcfa)}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    amount === valueInFcfa.toString() && styles.quickButtonTextActive
                  ]}
                >
                  {valueInFcfa}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <AlertCircle size={20} color="#0d7377" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Informations importantes
            </Text>
            <Text style={styles.infoText}>
              • Montant minimum : {eurToFcfa(0.76).toLocaleString('fr-FR')} FCFA{'\n'}
              • Paiement via Orange Money ou MTN MoMo{'\n'}
              • Les fonds sont disponibles immédiatement
            </Text>
          </View>
        </View>

        {/* Add Funds Button */}
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddFunds}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Traitement...' : 'Recharger'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xlarge,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    alignItems: 'center',
    ...Shadows.small,
  },
  quickButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quickButtonTextActive: {
    color: Colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xlarge,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.medium,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
