import React, { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Upload, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { ShopProductResponse, UpdateProductData } from '@/types/api';
import { PageHeader } from '@/components/PageHeader';

export default function EditProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<ShopProductResponse | null>(null);
  const [formData, setFormData] = useState<UpdateProductData>({
    title: '',
    description: '',
    price: 0,
    isActive: true,
  });
  const [coverImage, setCoverImage] = useState<{ uri: string; name: string } | null>(null);
  const [resourceFile, setResourceFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: ShopProductResponse }>(
        `/marketplace/products/${productId}`
      );
      setProduct(response.data);
      setFormData({
        title: response.data.title,
        description: response.data.description || '',
        price: response.data.price,
        isActive: response.data.isActive,
      });
      
      // Load existing files if available
      if (response.data.previewUrl) {
        setCoverImage({
          uri: response.data.previewUrl,
          name: 'cover.jpg',
        });
      }
      if (response.data.fileUrl) {
        setResourceFile({
          uri: response.data.fileUrl,
          name: 'resource',
          type: 'application/pdf',
        });
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (formData.price && formData.price <= 0) {
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
      setSaving(true);
      
      // TODO: Upload new files if changed
      const updateData = {
        ...formData,
        ...(coverImage && { previewUrl: coverImage.uri }),
        ...(resourceFile && { fileUrl: resourceFile.uri }),
      };
      
      await apiClient.put(`/marketplace/products/${productId}`, updateData);
      Alert.alert('Succès', 'Produit mis à jour avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update product:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le produit');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UpdateProductData, value: any) => {
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
      }
    } catch (error: any) {
      console.error('Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Modifier le produit"
        showBackButton
        variant="primary"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Info (Read-only) */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{product.productType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Matière:</Text>
            <Text style={styles.infoValue}>{product.subject}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Niveau:</Text>
            <Text style={styles.infoValue}>{product.educationLevel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléchargements:</Text>
            <Text style={styles.infoValue}>{product.downloadsCount}</Text>
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

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Prix (FCFA) *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            placeholder="0"
            value={formData.price ? formData.price.toString() : ''}
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
          {formData.price && formData.price > 0 && (
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Votre revenu:</Text>
              <Text style={styles.revenueValue}>
                {(formData.price * 0.7).toLocaleString()} FCFA
              </Text>
            </View>
          )}
        </View>

        {/* Active Status */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleCard}
            onPress={() => updateField('isActive', !formData.isActive)}
            activeOpacity={0.7}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Produit actif</Text>
              <Text style={styles.toggleDescription}>
                {formData.isActive
                  ? 'Visible dans le marketplace'
                  : 'Masqué du marketplace'}
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                formData.isActive && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  formData.isActive && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Cover Image (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Image de couverture (optionnel)</Text>
          {coverImage ? (
            <View style={styles.uploadedFile}>
              <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {coverImage.name}
                </Text>
                <TouchableOpacity onPress={pickCoverImage}>
                  <Text style={styles.changeText}>Changer</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setCoverImage(null)}
                style={styles.removeButton}
              >
                <X size={18} color={Colors.error} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickCoverImage}>
              <ImageIcon size={24} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.uploadButtonText}>Choisir une image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resource File */}
        <View style={styles.section}>
          <Text style={styles.label}>Fichier de ressource</Text>
          {resourceFile ? (
            <View style={styles.uploadedFile}>
              <View style={styles.fileIconContainer}>
                <Upload size={24} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {resourceFile.name}
                </Text>
                <TouchableOpacity onPress={pickResourceFile}>
                  <Text style={styles.changeText}>Changer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickResourceFile}>
              <Upload size={24} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.uploadButtonText}>Choisir un fichier</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Enregistrer</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    marginBottom: 24,
    ...Shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: Colors.border,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    ...Shadows.small,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.large,
    paddingVertical: 20,
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
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
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
