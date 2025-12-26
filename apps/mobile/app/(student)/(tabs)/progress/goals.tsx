import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Plus, TrendingUp } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';

export default function GoalsScreen() {
  const router = useRouter();

  // Placeholder for future implementation
  const goals: any[] = [];

  return (
    <View style={styles.container}>
      <PageHeader
        title="Mes Objectifs"
        variant="primary"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {goals.length > 0 ? (
          <View style={styles.goalsContainer}>
            {/* Goals will be displayed here */}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Target size={64} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun objectif défini</Text>
            <Text style={styles.emptyStateText}>
              Définissez des objectifs académiques pour suivre votre progression et rester motivé
            </Text>

            <View style={styles.exampleCard}>
              <Text style={styles.exampleTitle}>Exemples d'objectifs :</Text>
              <View style={styles.exampleItem}>
                <TrendingUp size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.exampleText}>
                  Atteindre 15/20 en Mathématiques d'ici la fin du trimestre
                </Text>
              </View>
              <View style={styles.exampleItem}>
                <TrendingUp size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.exampleText}>
                  Améliorer ma moyenne de 2 points en Physique
                </Text>
              </View>
              <View style={styles.exampleItem}>
                <TrendingUp size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.exampleText}>
                  Obtenir plus de 80% à mon prochain examen d'Anglais
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Goal Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Future: Navigate to add goal screen
            alert('Fonctionnalité à venir : Définir un nouvel objectif');
          }}
        >
          <Plus size={20} color={Colors.white} strokeWidth={2} />
          <Text style={styles.addButtonText}>Définir un objectif</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  goalsContainer: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.lg,
    width: '100%',
    ...Shadows.small,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.medium,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
