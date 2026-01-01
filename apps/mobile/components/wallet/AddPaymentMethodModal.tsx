import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { X, Smartphone } from 'lucide-react-native';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { MobileMoneyOperator } from '@/types/api';

interface AddPaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (operatorId: string, phoneNumber: string, accountName: string, accountHolder?: string) => void;
  operators: MobileMoneyOperator[];
}

export function AddPaymentMethodModal({ visible, onClose, onAdd, operators }: AddPaymentMethodModalProps) {
  const [selectedOperator, setSelectedOperator] = useState<MobileMoneyOperator | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const formatPhoneNumber = (text: string) => {
    if (!selectedOperator) return text;
    
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to operator's phone length
    const limited = cleaned.slice(0, selectedOperator.phoneLength);
    
    // Apply operator's format
    const format = selectedOperator.phoneFormat;
    let formatted = '';
    let numIndex = 0;
    
    for (let i = 0; i < format.length && numIndex < limited.length; i++) {
      if (format[i] === 'X') {
        formatted += limited[numIndex];
        numIndex++;
      } else {
        formatted += format[i];
      }
    }
    
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleClose = () => {
    setSelectedOperator(null);
    setPhoneNumber('');
    setAccountName('');
    setAccountHolder('');
    onClose();
  };

  const validateForm = () => {
    if (!selectedOperator) {
      Alert.alert('Erreur', 'Veuillez sélectionner un opérateur');
      return false;
    }

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (cleanPhone.length !== selectedOperator.phoneLength) {
      Alert.alert('Erreur', `Le numéro de téléphone doit contenir ${selectedOperator.phoneLength} chiffres`);
      return false;
    }

    if (!accountName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour ce compte');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm() || !selectedOperator) return;

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    const formattedPhone = `${selectedOperator.phonePrefix}${cleanPhone}`;
    
    onAdd(selectedOperator.id, formattedPhone, accountName, accountHolder || undefined);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ajouter un compte</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={24} color={Colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
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
                      selectedOperator?.id === operator.id && styles.providerCardActive,
                      { borderColor: selectedOperator?.id === operator.id ? operator.color : Colors.borderLight }
                    ]}
                    onPress={() => setSelectedOperator(operator)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.providerIcon, { backgroundColor: `${operator.color}15` }]}>
                      <Smartphone size={16} color={operator.color} strokeWidth={2} />
                    </View>
                    <Text style={styles.providerName} numberOfLines={2} ellipsizeMode="tail">{operator.displayName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>
                  {selectedOperator?.phonePrefix || '+237'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={selectedOperator?.phoneFormat || 'XX XX XX XX XX'}
                  placeholderTextColor={Colors.textTertiary}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={selectedOperator ? selectedOperator.phoneFormat.length : 14}
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

            {/* Account Holder Input (Optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Titulaire du compte (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor={Colors.textTertiary}
                value={accountHolder}
                onChangeText={setAccountHolder}
                maxLength={100}
              />
              <Text style={styles.inputHint}>
                Nom complet du titulaire du compte
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxlarge,
    borderTopRightRadius: BorderRadius.xxlarge,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
    gap: Spacing.sm,
  },
  providerCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 2,
    width: '31%',
    minHeight: 75,
    ...Shadows.small,
  },
  providerCardActive: {
    borderWidth: 2,
  },
  providerIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  providerName: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xlarge,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xlarge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    marginTop: Spacing.md,
    ...Shadows.medium,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
