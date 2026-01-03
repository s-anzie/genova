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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Book, FileText, Layers, Video, Package, Upload, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/colors';
import { CreateProductData } from '@/types/api';
import { PageHeader } from '@/components/PageHeader';

const PRODUCT_TYPES = [
  { value: 'BOOK', label: 'Livre', icon: Book },
  { value: 'EXAM', label: 'Épreuve', icon: FileText },
  { value: 'FLASHCARDS', label: 'Fiches', icon: Layers },
  { value: 'VIDEO', label: 'Vidéo', icon: Video },
  { value: 'OTHER', label: 'Autre', icon: Package },
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
  const [coverImage, setCoverImage] = useState<{ uri: string; name: string } | null>(null);
  const [resourceFile, setResourceFile] = useState<{ uri: string; name: string; type: string } | null>(null);
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

    if (!resourceFile) {
      newErrors.resourceFile = 'Le fichier de ressource est requis';
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
      
      // TODO: Upload files to storage and get URLs
      // For now, we'll use placeholder URLs
      const productData = {
        ...formData,
        fileUrl: resourceFile?.uri, // In production, upload file and use returned URL
        previewUrl: coverImage?.uri, // In production, upload image and use returned URL
      };
      
      await apiClient.post('/marketplace/products', productData);
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

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCoverImage({
        uri: asset.uri,
        name: asset.fileName || `cover_${Date.now()}.jpg`,
      });
    }
  };

  const pickResourceFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'video/*', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const doc = result.assets[0];
        setResourceFile({
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType || 'application/pdf',
        });
        if (errors.resourceFile) {
          setErrors({ ...errors, resourceFile: '' });
        }
      }
    } catch (error: any) {
      console.error('Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Nouveau produit"
        showBackButton
        variant="primary"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section: Type de produit */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Type de produit</Text>
          <View style={styles.typeGrid}>
            {PRODUCT_TYPES.map((type) => {
              const IconComponent = type.icon;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    formData.productType === type.value && styles.typeCardActive,
                  ]}
                  onPress={() => updateField('productType', type.value)}
                >
                  <IconComponent
                    size={24}
                    color={
                      formData.productType === type.value ? Colors.white : Colors.textSecondary
                    }
                    strokeWidth={2}
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
              );
            })}
          </View>
        </View>

        {/* Section: Informations générales */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Ex: Cours complet de mathématiques"
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.field}>
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

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Matière *</Text>
              <TextInput
                style={[styles.input, errors.subject && styles.inputError]}
                placeholder="Ex: Maths"
                value={formData.subject}
                onChangeText={(text) => updateField('subject', text)}
              />
              {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
            </View>

            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Niveau *</Text>
              <TextInput
                style={[styles.input, errors.educationLevel && styles.inputError]}
                placeholder="Ex: Terminale"
                value={formData.educationLevel}
                onChangeText={(text) => updateField('educationLevel', text)}
              />
              {errors.educationLevel && <Text style={styles.errorText}>{errors.educationLevel}</Text>}
            </View>
          </View>
        </View>

        {/* Section: Fichiers */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Fichiers</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Image de couverture (optionnel)</Text>
            {coverImage ? (
              <View style={styles.uploadedFile}>
                <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {coverImage.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCoverImage(null)}
                    style={styles.removeButton}
                  >
                    <X size={18} color={Colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={pickCoverImage}>
                <ImageIcon size={24} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.uploadButtonText}>Choisir une image</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.helperText}>
              Format recommandé: 3:4 (ex: 600x800px)
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fichier de ressource *</Text>
            {resourceFile ? (
              <View style={styles.uploadedFile}>
                <View style={styles.fileIconContainer}>
                  <Upload size={24} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {resourceFile.name}
                  </Text>
                  <Text style={styles.fileType}>{resourceFile.type}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setResourceFile(null)}
                  style={styles.removeButton}
                >
                  <X size={18} color={Colors.error} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.uploadButton, errors.resourceFile && styles.uploadButtonError]} 
                onPress={pickResourceFile}
              >
                <Upload size={24} color={errors.resourceFile ? Colors.error : Colors.primary} strokeWidth={2} />
                <Text style={[styles.uploadButtonText, errors.resourceFile && styles.uploadButtonTextError]}>
                  Choisir un fichier
                </Text>
              </TouchableOpacity>
            )}
            {errors.resourceFile && <Text style={styles.errorText}>{errors.resourceFile}</Text>}
            <Text style={styles.helperText}>
              Formats acceptés: PDF, images, vidéos
            </Text>
          </View>
        </View>

        {/* Section: Prix */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Prix et revenus</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Prix de vente (FCFA) *</Text>
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
          </View>

          {formData.price > 0 && (
            <View style={styles.revenueCard}>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Prix de vente</Text>
                <Text style={styles.revenueAmount}>{formData.price.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Commission (30%)</Text>
                <Text style={styles.revenueAmount}>-{(formData.price * 0.3).toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabelBold}>Votre revenu</Text>
                <Text style={styles.revenueValue}>{(formData.price * 0.7).toLocaleString()} FCFA</Text>
              </View>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 Le fichier sera téléchargeable par les acheteurs après l'achat.
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
            <Text style={styles.submitButtonText}>Créer le produit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: 20,
    marginBottom: 16,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bgCream,
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
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.bgCream,
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
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.medium,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  revenueLabelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: BorderRadius.large,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.large,
    paddingVertical: 20,
    gap: 12,
  },
  uploadButtonError: {
    borderColor: Colors.error,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  uploadButtonTextError: {
    color: Colors.error,
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.large,
    padding: 12,
    gap: 12,
  },
  coverPreview: {
    width: 60,
    height: 80,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.bgSecondary,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fileType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
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
