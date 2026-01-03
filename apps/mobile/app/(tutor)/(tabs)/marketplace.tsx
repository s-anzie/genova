import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Download, Star, ShoppingBag, DollarSign, Edit2, Eye, EyeOff, Trash2, Package, ShoppingCart } from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/colors';
import { SellerDashboard, ShopProductResponse } from '@/types/api';
import { PageHeader } from '@/components/PageHeader';

export default function SellerDashboardScreen() {
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading seller dashboard...');
      const response = await apiClient.get<SellerDashboard>(
        '/marketplace/seller/dashboard'
      );
      
      console.log('✅ Dashboard loaded:', response);
      
      // The API returns the dashboard directly, not wrapped in { data: ... }
      setDashboard(response as SellerDashboard);
    } catch (error: any) {
      console.error('❌ Failed to load dashboard:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Impossible de charger le tableau de bord';
      setError(errorMessage);
      
      // Set empty dashboard to avoid null issues
      setDashboard({
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        topProducts: [],
        recentSales: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleToggleProduct = async (productId: string, isActive: boolean) => {
    try {
      await apiClient.put(`/marketplace/products/${productId}`, {
        isActive: !isActive,
      });
      loadDashboard();
    } catch (error) {
      console.error('Failed to toggle product:', error);
      Alert.alert('Erreur', 'Impossible de modifier le produit');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/marketplace/products/${productId}`);
              loadDashboard();
            } catch (error) {
              console.error('Failed to delete product:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
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

  const renderProductCard = (product: ShopProductResponse) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{getProductTypeLabel(product.productType)}</Text>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tutor)/marketplace/edit-product',
                params: { productId: product.id },
              } as any)
            }
            style={styles.actionButton}
          >
            <Edit2 size={18} color={Colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggleProduct(product.id, product.isActive)}
            style={styles.actionButton}
          >
            {product.isActive ? (
              <Eye size={18} color={Colors.success} strokeWidth={2} />
            ) : (
              <EyeOff size={18} color={Colors.textTertiary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteProduct(product.id)}
            style={styles.actionButton}
          >
            <Trash2 size={18} color={Colors.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.productTitle}>{product.title}</Text>
      <Text style={styles.productMeta}>
        {product.subject} • {product.educationLevel}
      </Text>

      <View style={styles.productStats}>
        <View style={styles.statItem}>
          <Download size={16} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.statText}>{product.downloadsCount}</Text>
        </View>
        {product.rating > 0 && (
          <View style={styles.statItem}>
            <Star size={16} color={Colors.accent2} fill={Colors.accent2} strokeWidth={2} />
            <Text style={styles.statText}>{product.rating.toFixed(1)}</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={styles.productPrice}>{product.price.toLocaleString()} FCFA</Text>
        </View>
      </View>

      {!product.isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Désactivé</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Marketplace"
          variant="primary"
        />
        <View style={styles.errorContainer}>
          <ShoppingBag size={64} color={Colors.error} strokeWidth={1.5} />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Marketplace"
        subtitle={`${dashboard.totalProducts} produit${dashboard.totalProducts > 1 ? 's' : ''}`}
        variant="primary"
        rightElement={
          <TouchableOpacity
            onPress={() => router.push('/(tutor)/marketplace/create-product')}
            style={styles.headerAddButton}
          >
            <Plus size={24} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Package size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{dashboard.totalProducts}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <ShoppingCart size={24} color={Colors.success} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{dashboard.totalSales}</Text>
            <Text style={styles.statLabel}>Ventes</Text>
          </View>

          <View style={[styles.statCard, styles.statCardWide]}>
            <View style={styles.statIcon}>
              <DollarSign size={24} color={Colors.accent2} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{dashboard.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>FCFA de revenus</Text>
          </View>
        </View>

        {/* Recent Sales */}
        {dashboard.recentSales.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ventes récentes</Text>
            <View style={styles.salesList}>
              {dashboard.recentSales.map((sale) => (
                <View key={sale.id} style={styles.saleCard}>
                  <View style={styles.saleInfo}>
                    <Text style={styles.saleProduct} numberOfLines={1}>
                      {sale.product?.title}
                    </Text>
                    <Text style={styles.saleDate}>
                      {new Date(sale.purchasedAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={styles.saleAmount}>
                    +{(sale.amountPaid * 0.7).toLocaleString()} FCFA
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Products List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes produits</Text>
          {dashboard.topProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>Aucun produit</Text>
              <Text style={styles.emptyStateText}>
                Commencez à vendre vos ressources éducatives
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(tutor)/marketplace/create-product')}
              >
                <Plus size={20} color={Colors.white} strokeWidth={2} />
                <Text style={styles.createButtonText}>Créer un produit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productsList}>
              {dashboard.topProducts.map((product) => renderProductCard(product))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerAddButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    ...Shadows.small,
  },
  statCardWide: {
    minWidth: '100%',
  },
  statIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  salesList: {
    gap: 8,
  },
  saleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
  },
  saleInfo: {
    flex: 1,
    marginRight: 12,
  },
  saleProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  saleDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  saleAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
  },
  productsList: {
    gap: 16,
  },
  productCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.medium,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  productStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  inactiveBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.textTertiary + '20',
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.large,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: BorderRadius.large,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
