import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone } from 'lucide-react-native';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { ApiClient } from '@/utils/api';
import { MobileMoneyOperator } from '@/types/api';

export default function AddPaymentMethodScreen() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<MobileMoneyOperator[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(true);

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      setLoadingOperators(true);
      const response = await ApiClient.get<{ success: boolean; data: MobileMoneyOperator[] }>(
        '/operators?country=CM'
      );
      setOperators(response.data);
    } catch (error) {
      console.error('Failed to load operators:', error);
      Alert.alert('Erreur', 'Impossible de charger les opérateurs');
    } finally {
      setLoadingOperators(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    // Format as XX XX XX XX XX
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    if (limited.length <= 6) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4)}`;
    if (limited.length <= 8) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6)}`;
    return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6, 8)} ${limited.slice(8)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const validateForm = () => {
    if (!selectedProvider) {
      Alert.alert('Erreur', 'Veuillez sélectionner un opérateur');
      return false;
    }

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Erreur', 'Le numéro de téléphone doit contenir 10 chiffres');
      return false;
    }

    if (!accountName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour ce compte');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      
      await ApiClient.post('/payment-methods', {
        operatorId: selectedProvider,
        phoneNumber: cleanPhone,
        accountName: accountName.trim(),
      });
      
      Alert.alert(
        'Succès',
        'Votre compte Mobile Money a été ajouté avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le compte');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOperators) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Ajouter un compte" 
          showBackButton 
          variant="primary"
          centerTitle
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des opérateurs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Ajouter un compte" 
        showBackButton 
        variant="primary"
        centerTitle
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélectionnez votre opérateur</Text>
          <View style={styles.providersGrid}>
            {operators.map((operator) => (
              <TouchableOpacity
                key={operator.id}
                style={[
                  styles.providerCard,
                  selectedProvider === operator.id && styles.providerCardActive,
                  { borderColor: selectedProvider === operator.id ? operator.color : Colors.borderLight }
                ]}
                onPress={() => setSelectedProvider(operator.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.providerIcon, { backgroundColor: `${operator.color}15` }]}>
                  <Smartphone size={18} color={operator.color} strokeWidth={2} />
                </View>
                <Text style={styles.providerName} numberOfLines={2}>{operator.displayName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Phone Number Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>+237</Text>
            <TextInput
              style={styles.input}
              placeholder="XX XX XX XX XX"
              placeholderTextColor={Colors.textTertiary}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14} // 10 digits + 4 spaces
            />
          </View>
          <Text style={styles.inputHint}>
            Entrez votre numéro Mobile Money
          </Text>
        </View>

        {/* Account Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom du compte</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Mon compte Orange"
            placeholderTextColor={Colors.textTertiary}
            value={accountName}
            onChangeText={setAccountName}
            maxLength={50}
          />
          <Text style={styles.inputHint}>
            Donnez un nom pour identifier ce compte
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxxl }} />
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
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  providerCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderWidth: 2,
    width: '31.5%',
    marginBottom: Spacing.xs,
    minHeight: 85,
    ...Shadows.small,
  },
  providerCardActive: {
    borderWidth: 2,
  },
  providerIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  providerName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  inputHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xlarge,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
