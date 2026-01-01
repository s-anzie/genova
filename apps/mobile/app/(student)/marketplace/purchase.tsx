import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { ShopProductResponse } from '@/types/api';

export default function PurchaseScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<ShopProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productResponse, walletResponse] = await Promise.all([
        apiClient.get<{ data: ShopProductResponse }>(`/marketplace/products/${productId}`),
        apiClient.get<{ data: { totalBalance: number } }>('/payments/wallet'),
      ]);
      setProduct(productResponse.data);
      setWalletBalance(walletResponse.data.totalBalance);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;

    if (walletBalance < product.price) {
      Alert.alert(
        'Solde insuffisant',
        'Votre solde est insuffisant pour effectuer cet achat. Veuillez recharger votre portefeuille.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Recharger',
            onPress: () => router.push('/wallet/add-funds'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirmer l\'achat',
      `Voulez-vous acheter "${product.title}" pour ${product.price.toLocaleString()} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: processPurchase,
        },
      ]
    );
  };

  const processPurchase = async () => {
    if (!product) return;

    try {
      setProcessing(true);
      await apiClient.post('/marketplace/purchase', {
        productId: product.id,
      });

      Alert.alert(
        'Achat réussi',
        'Votre achat a été effectué avec succès. Vous pouvez maintenant télécharger le produit.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              router.push(`/marketplace/${product.id}`);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to purchase:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de finaliser l\'achat'
      );
    } finally {
      setProcessing(false);
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

  const platformFee = product.price * 0.3;
  const sellerAmount = product.price * 0.7;
  const hasEnoughBalance = walletBalance >= product.price;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finaliser l'achat</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produit</Text>
          <View style={styles.productCard}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productMeta}>
              {product.subject} • {product.educationLevel}
            </Text>
          </View>
        </View>

        {/* Wallet Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solde du portefeuille</Text>
          <View style={[styles.balanceCard, !hasEnoughBalance && styles.balanceCardError]}>
            <View style={styles.balanceInfo}>
              <Ionicons
                name="wallet"
                size={24}
                color={hasEnoughBalance ? Colors.primary : Colors.error}
              />
              <View style={styles.balanceText}>
                <Text style={styles.balanceLabel}>Solde disponible</Text>
                <Text
                  style={[
                    styles.balanceValue,
                    !hasEnoughBalance && styles.balanceValueError,
                  ]}
                >
                  {walletBalance.toLocaleString()} FCFA
                </Text>
              </View>
            </View>
            {!hasEnoughBalance && (
              <TouchableOpacity
                style={styles.addFundsButton}
                onPress={() => router.push('/wallet/add-funds')}
              >
                <Text style={styles.addFundsText}>Recharger</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du paiement</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Prix du produit</Text>
              <Text style={styles.breakdownValue}>{product.price.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabelSmall}>Commission plateforme (30%)</Text>
              <Text style={styles.breakdownValueSmall}>
                {platformFee.toLocaleString()} FCFA
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabelSmall}>Montant au vendeur (70%)</Text>
              <Text style={styles.breakdownValueSmall}>
                {sellerAmount.toLocaleString()} FCFA
              </Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabelTotal}>Total à payer</Text>
              <Text style={styles.breakdownValueTotal}>
                {product.price.toLocaleString()} FCFA
              </Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <View style={styles.termsCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.termsText}>
              En achetant ce produit, vous acceptez que le paiement soit définitif et non
              remboursable. Vous aurez accès au téléchargement immédiatement après l'achat.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.purchaseButton, (!hasEnoughBalance || processing) && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={!hasEnoughBalance || processing}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="card" size={20} color={Colors.white} />
              <Text style={styles.purchaseButtonText}>
                Payer {product.price.toLocaleString()} FCFA
              </Text>
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  balanceCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  balanceCardError: {
    borderWidth: 2,
    borderColor: Colors.error,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceText: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  balanceValueError: {
    color: Colors.error,
  },
  addFundsButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.medium,
    alignSelf: 'flex-start',
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  breakdownCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  breakdownLabelSmall: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValueSmall: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  breakdownValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  termsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: BorderRadius.large,
    gap: 12,
  },
  termsText: {
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
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.large,
    gap: 8,
    ...Shadows.primary,
  },
  purchaseButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    ...Shadows.small,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
