import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Users, DollarSign, TrendingUp, Star } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/PageHeader';

export default function TutorHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader 
        title={`Bonjour, ${user?.firstName} 👋`}
        subtitle="Tableau de bord tuteur"
        rightElement={
          <View style={styles.verifiedBadge}>
            <Star size={16} color={Colors.accent2} fill={Colors.accent2} />
            <Text style={styles.verifiedText}>Tuteur</Text>
          </View>
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Calendar size={24} color={Colors.primary} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Sessions à venir</Text>
            </View>
            <View style={styles.statCard}>
              <Users size={24} color={Colors.primary} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Étudiants actifs</Text>
            </View>
            <View style={styles.statCard}>
              <DollarSign size={24} color={Colors.primary} />
              <Text style={styles.statValue}>0 €</Text>
              <Text style={styles.statLabel}>Revenus ce mois</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color={Colors.primary} />
              <Text style={styles.statValue}>0h</Text>
              <Text style={styles.statLabel}>Heures enseignées</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tutor)/(tabs)/sessions')}
            >
              <Calendar size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Mes sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => router.push('/(tutor)/profile/availability')}
            >
              <Text style={styles.actionButtonTextSecondary}>
                Gérer disponibilités
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prochaines sessions</Text>
            <TouchableOpacity onPress={() => router.push('/(tutor)/(tabs)/sessions')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Aucune session à venir</Text>
            <Text style={styles.emptySubtext}>
              Les sessions réservées apparaîtront ici
            </Text>
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Note moyenne</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color={Colors.accent2} fill={Colors.accent2} />
                <Text style={styles.ratingText}>0.0</Text>
              </View>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Taux de complétion</Text>
              <Text style={styles.performanceValue}>0%</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Taux de réponse</Text>
              <Text style={styles.performanceValue}>0%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 217, 61, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quickActions: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.large,
    ...Shadows.primary,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.small,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.small,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  performanceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.small,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
