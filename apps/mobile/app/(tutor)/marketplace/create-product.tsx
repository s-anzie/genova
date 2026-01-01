import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { CreateProductData } from '@/types/api';

const PRODUCT_TYPES = [
  { value: 'BOOK', label: 'Livre', icon: 'book' },
  { value: 'EXAM', label: 'Épreuve', icon: 'document-text' },
  { value: 'FLASHCARDS', label: 'Fiches', icon: 'albums' },
  { value: 'VIDEO', label: 'Vidéo', icon: 'videocam' },
  { value: 'OTHER', label: 'Autre', icon: 'cube' },
];

export default function CreateProductScreen() {
  const [formData, setFormData] = useState<CreateProductData>({
    title: '',
    description: '',
    productType: 'BOOK',
    subject: '',
    educationLevel: '',
    price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'La matière est requise';
    }

    if (!formData.educationLevel.trim()) {
      newErrors.educationLevel = 'Le niveau est requis';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/marketplace/products', formData);
      Alert.alert('Succès', 'Produit créé avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to create product:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer le produit');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateProductData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau produit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Type de produit *</Text>
          <View style={styles.typeGrid}>
            {PRODUCT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  formData.productType === type.value && styles.typeCardActive,
                ]}
                onPress={() => updateField('productType', type.value)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={
                    formData.productType === type.value ? Colors.white : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeLabel,
                    formData.productType === type.value && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Ex: Cours complet de mathématiques"
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez votre produit..."
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label}>Matière *</Text>
          <TextInput
            style={[styles.input, errors.subject && styles.inputError]}
            placeholder="Ex: Mathématiques"
            value={formData.subject}
            onChangeText={(text) => updateField('subject', text)}
          />
          {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
        </View>

        {/* Education Level */}
        <View style={styles.section}>
          <Text style={styles.label}>Niveau d'éducation *</Text>
          <TextInput
            style={[styles.input, errors.educationLevel && styles.inputError]}
            placeholder="Ex: Terminale"
            value={formData.educationLevel}
            onChangeText={(text) => updateField('educationLevel', text)}
          />
          {errors.educationLevel && <Text style={styles.errorText}>{errors.educationLevel}</Text>}
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Prix (FCFA) *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            placeholder="0"
            value={formData.price > 0 ? formData.price.toString() : ''}
            onChangeText={(text) => {
              const price = parseInt(text) || 0;
              updateField('price', price);
            }}
            keyboardType="numeric"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          <Text style={styles.helperText}>
            Vous recevrez 70% du prix (commission de 30%)
          </Text>
          {formData.price > 0 && (
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Votre revenu:</Text>
              <Text style={styles.revenueValue}>
                {(formData.price * 0.7).toLocaleString()} FCFA
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Après la création, vous pourrez télécharger le fichier du produit depuis le tableau
            de bord.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.submitButtonText}>Créer le produit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
  },
  typeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeLabelActive: {
    color: Colors.white,
  },
  revenueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    padding: 12,
    borderRadius: BorderRadius.medium,
    marginTop: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: BorderRadius.large,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: Colors.white,
    padding: 20,
    paddingBottom: 30,
    ...Shadows.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.large,
    gap: 8,
    ...Shadows.primary,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    ...Shadows.small,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
