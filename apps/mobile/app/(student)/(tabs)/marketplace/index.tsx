import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Download } from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { ShopProductResponse, ProductFilters } from '@/types/api';
import { PageHeader } from '@/components/PageHeader';

const PRODUCT_TYPES = [
  { value: 'ALL', label: 'Tous' },
  { value: 'BOOK', label: 'Livres' },
  { value: 'EXAM', label: 'Épreuves' },
  { value: 'FLASHCARDS', label: 'Fiches' },
  { value: 'VIDEO', label: 'Vidéos' },
  { value: 'OTHER', label: 'Autres' },
];

export default function MarketplaceTabScreen() {
  const [products, setProducts] = useState<ShopProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [filters, setFilters] = useState<ProductFilters>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.educationLevel) params.append('educationLevel', filters.educationLevel);
      if (filters.productType) params.append('productType', filters.productType);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.minRating) params.append('minRating', filters.minRating.toString());
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get<{ success: boolean; data: ShopProductResponse[] }>(
        `/marketplace/products?${params.toString()}`
      );
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Impossible de charger les ressources');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleSearch = () => {
    loadProducts();
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    if (type === 'ALL') {
      const { productType, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, productType: type as any });
    }
  };

  const renderProductCard = (product: ShopProductResponse) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => router.push(`/marketplace/${product.id}`)}
      activeOpacity={0.7}
    >
      {product.previewUrl ? (
        <Image source={{ uri: product.previewUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="document-text-outline" size={40} color={Colors.textTertiary} />
        </View>
      )}

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productType}>{getProductTypeLabel(product.productType)}</Text>
          {product.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={Colors.accent2} />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>

        <Text style={styles.productSubject} numberOfLines={1}>
          {product.subject} • {product.educationLevel}
        </Text>

        {product.seller && (
          <Text style={styles.sellerName} numberOfLines={1}>
            Par {product.seller.firstName} {product.seller.lastName}
          </Text>
        )}

        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{product.price.toLocaleString()} FCFA</Text>
          <View style={styles.downloadsBadge}>
            <Ionicons name="download-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.downloadsText}>{product.downloadsCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getProductTypeLabel = (type: string) => {
    const typeObj = PRODUCT_TYPES.find((t) => t.value === type);
    return typeObj?.label || type;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <PageHeader title="Marketplace" variant="primary" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Marketplace" 
        variant="primary"
        rightElement={
          <TouchableOpacity
            onPress={() => router.push('/marketplace/downloads')}
            style={styles.downloadsButton}
          >
            <Download size={24} color={Colors.white} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des ressources..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeFilters}
          contentContainerStyle={styles.typeFiltersContent}
        >
          {PRODUCT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeFilterButton,
                selectedType === type.value && styles.typeFilterButtonActive,
              ]}
              onPress={() => handleTypeFilter(type.value)}
            >
              <Text
                style={[
                  styles.typeFilterText,
                  selectedType === type.value && styles.typeFilterTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
              <Text style={styles.emptyStateTitle}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>Aucune ressource trouvée</Text>
              <Text style={styles.emptyStateText}>
                Essayez de modifier vos filtres de recherche
              </Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => renderProductCard(product))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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
  header: {
    backgroundColor: Colors.white,
    paddingTop: 60,
    paddingBottom: 16,
    ...Shadows.small,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  downloadsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  typeFilters: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  typeFiltersContent: {
    gap: 6,
    paddingRight: 40,
  },
  typeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeFilterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  typeFilterTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Shadows.small,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.bgSecondary,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productSubject: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  downloadsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
