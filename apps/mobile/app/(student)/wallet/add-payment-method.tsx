import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Smartphone } from 'lucide-react-native';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';

type MobileMoneyProvider = 'orange' | 'mtn' | 'moov';

export default function AddPaymentMethodScreen() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  const providers = [
    { id: 'orange' as MobileMoneyProvider, name: 'Orange Money', color: '#FF6600', bgColor: 'rgba(255, 102, 0, 0.1)' },
    { id: 'mtn' as MobileMoneyProvider, name: 'MTN Mobile Money', color: '#FFCC00', bgColor: 'rgba(255, 204, 0, 0.1)' },
    { id: 'moov' as MobileMoneyProvider, name: 'Moov Money', color: '#009FE3', bgColor: 'rgba(0, 159, 227, 0.1)' },
  ];

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
      // TODO: Implement API call to save payment method
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    } catch (error) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un compte</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélectionnez votre opérateur</Text>
          <View style={styles.providersGrid}>
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  selectedProvider === provider.id && styles.providerCardActive,
                  { borderColor: selectedProvider === provider.id ? provider.color : Colors.borderLight }
                ]}
                onPress={() => setSelectedProvider(provider.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.providerIcon, { backgroundColor: provider.bgColor }]}>
                  <Smartphone size={24} color={provider.color} strokeWidth={2} />
                </View>
                <Text style={styles.providerName}>{provider.name}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
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
    gap: Spacing.sm,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
    borderWidth: 2,
    ...Shadows.small,
  },
  providerCardActive: {
    borderWidth: 2,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
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
