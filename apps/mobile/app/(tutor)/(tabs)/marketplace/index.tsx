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
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { SellerDashboard, ShopProductResponse } from '@/types/api';

export default function SellerDashboardScreen() {
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: SellerDashboard }>(
        '/marketplace/seller/dashboard'
      );
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger le tableau de bord');
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
                pathname: '/marketplace/edit-product',
                params: { productId: product.id },
              })
            }
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggleProduct(product.id, product.isActive)}
            style={styles.actionButton}
          >
            <Ionicons
              name={product.isActive ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={product.isActive ? Colors.success : Colors.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteProduct(product.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.productTitle}>{product.title}</Text>
      <Text style={styles.productMeta}>
        {product.subject} • {product.educationLevel}
      </Text>

      <View style={styles.productStats}>
        <View style={styles.statItem}>
          <Ionicons name="download-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{product.downloadsCount}</Text>
        </View>
        {product.rating > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color={Colors.accent2} />
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

  if (!dashboard) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes produits</Text>
          <TouchableOpacity
            onPress={() => router.push('/marketplace/create-product')}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cube-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{dashboard.totalProducts}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cart-outline" size={24} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{dashboard.totalSales}</Text>
            <Text style={styles.statLabel}>Ventes</Text>
          </View>

          <View style={[styles.statCard, styles.statCardWide]}>
            <View style={styles.statIcon}>
              <Ionicons name="cash-outline" size={24} color={Colors.accent2} />
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
              <Ionicons name="cube-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>Aucun produit</Text>
              <Text style={styles.emptyStateText}>
                Commencez à vendre vos ressources éducatives
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/marketplace/create-product')}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
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
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    backgroundColor: Colors.bgSecondary,
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
    backgroundColor: Colors.bgSecondary,
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
});
