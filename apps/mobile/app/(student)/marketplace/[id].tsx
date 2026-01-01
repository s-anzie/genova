import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/colors';
import { ShopProductResponse, ShopPurchaseResponse } from '@/types/api';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ShopProductResponse | null>(null);
  const [purchase, setPurchase] = useState<ShopPurchaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadProduct();
    checkPurchase();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: ShopProductResponse }>(
        `/marketplace/products/${id}`
      );
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkPurchase = async () => {
    try {
      const response = await apiClient.get<{ data: ShopPurchaseResponse | null }>(
        `/marketplace/purchases/check/${id}`
      );
      setPurchase(response.data);
    } catch (error) {
      console.error('Failed to check purchase:', error);
    }
  };

  const handlePurchase = () => {
    if (!product) return;
    
    router.push({
      pathname: '/marketplace/purchase',
      params: { productId: product.id },
    });
  };

  const handleDownload = async () => {
    if (!product?.fileUrl) {
      Alert.alert('Erreur', 'Fichier non disponible');
      return;
    }

    try {
      // In a real app, this would trigger a download
      Alert.alert(
        'Téléchargement',
        'Le téléchargement va commencer...',
        [
          {
            text: 'OK',
            onPress: () => {
              // Implement actual download logic here
              console.log('Downloading:', product.fileUrl);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to download:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    }
  };

  const getProductTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      BOOK: 'Livre',
      EXAM: 'Épreuve',
      FLASHCARDS: 'Fiches',
      VIDEO: 'Vidéo',
      OTHER: 'Autre',
    };
    return types[type] || type;
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

  const isPurchased = !!purchase;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du produit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        {product.previewUrl ? (
          <Image source={{ uri: product.previewUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="document-text-outline" size={80} color={Colors.textTertiary} />
          </View>
        )}

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{getProductTypeLabel(product.productType)}</Text>
            </View>
            {product.rating > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color={Colors.accent2} />
                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.productTitle}>{product.title}</Text>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{product.subject}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{product.educationLevel}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="download-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{product.downloadsCount} téléchargements</Text>
            </View>
          </View>

          {product.seller && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                {product.seller.avatarUrl ? (
                  <Image source={{ uri: product.seller.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color={Colors.textSecondary} />
                )}
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerLabel}>Vendeur</Text>
                <Text style={styles.sellerName}>
                  {product.seller.firstName} {product.seller.lastName}
                </Text>
              </View>
            </View>
          )}

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {isPurchased && purchase && (
            <View style={styles.purchaseInfo}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <View style={styles.purchaseInfoText}>
                <Text style={styles.purchaseInfoTitle}>Déjà acheté</Text>
                <Text style={styles.purchaseInfoDate}>
                  Le {new Date(purchase.purchasedAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Prix</Text>
          <Text style={styles.priceValue}>{product.price.toLocaleString()} FCFA</Text>
        </View>
        {isPurchased ? (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            activeOpacity={0.8}
          >
            <Ionicons name="download" size={20} color={Colors.white} />
            <Text style={styles.downloadButtonText}>Télécharger</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            disabled={purchasing}
            activeOpacity={0.8}
          >
            {purchasing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="cart" size={20} color={Colors.white} />
                <Text style={styles.purchaseButtonText}>Acheter</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: Colors.bgSecondary,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.bgSecondary,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    ...Shadows.small,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  metaInfo: {
    gap: 12,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    marginBottom: 20,
    ...Shadows.small,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  purchaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    padding: 16,
    borderRadius: BorderRadius.large,
    gap: 12,
  },
  purchaseInfoText: {
    flex: 1,
  },
  purchaseInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 2,
  },
  purchaseInfoDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 20,
    paddingBottom: 30,
    ...Shadows.medium,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.large,
    gap: 8,
    ...Shadows.primary,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.large,
    gap: 8,
    ...Shadows.medium,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
