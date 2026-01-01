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
import { ShopPurchaseResponse } from '@/types/api';

export default function DownloadsScreen() {
  const [purchases, setPurchases] = useState<ShopPurchaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: ShopPurchaseResponse[] }>(
        '/marketplace/purchases'
      );
      setPurchases(response.data);
    } catch (error) {
      console.error('Failed to load purchases:', error);
      Alert.alert('Erreur', 'Impossible de charger vos achats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPurchases();
  };

  const handleDownload = async (purchase: ShopPurchaseResponse) => {
    if (!purchase.product?.fileUrl) {
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
              console.log('Downloading:', purchase.product?.fileUrl);
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

  const renderPurchaseCard = (purchase: ShopPurchaseResponse) => {
    if (!purchase.product) return null;

    return (
      <View key={purchase.id} style={styles.purchaseCard}>
        <View style={styles.purchaseHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {getProductTypeLabel(purchase.product.productType)}
            </Text>
          </View>
          <Text style={styles.purchaseDate}>
            {new Date(purchase.purchasedAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/marketplace/${purchase.product?.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.productTitle}>{purchase.product.title}</Text>
          <Text style={styles.productMeta}>
            {purchase.product.subject} • {purchase.product.educationLevel}
          </Text>
        </TouchableOpacity>

        <View style={styles.purchaseFooter}>
          <Text style={styles.purchasePrice}>
            {purchase.amountPaid.toLocaleString()} FCFA
          </Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownload(purchase)}
            activeOpacity={0.7}
          >
            <Ionicons name="download" size={18} color={Colors.white} />
            <Text style={styles.downloadButtonText}>Télécharger</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes téléchargements</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {purchases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="download-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>Aucun achat</Text>
            <Text style={styles.emptyStateText}>
              Vous n'avez pas encore acheté de ressources
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/marketplace')}
            >
              <Text style={styles.browseButtonText}>Parcourir le marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{purchases.length}</Text>
                <Text style={styles.statLabel}>Achats</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {purchases.reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>FCFA dépensés</Text>
              </View>
            </View>

            <View style={styles.purchasesList}>
              {purchases.map((purchase) => renderPurchaseCard(purchase))}
            </View>
          </>
        )}

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
  scrollContent: {
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: BorderRadius.large,
    marginBottom: 20,
    ...Shadows.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  purchasesList: {
    gap: 16,
  },
  purchaseCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  purchaseHeader: {
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
  purchaseDate: {
    fontSize: 12,
    color: Colors.textTertiary,
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
  purchaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchasePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.medium,
    gap: 6,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
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
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.large,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
