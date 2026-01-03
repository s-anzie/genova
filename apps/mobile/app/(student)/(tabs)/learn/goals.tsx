import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle,
  Circle,
  AlertCircle,
  ChevronRight,
  Trash2,
  GraduationCap,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useGoals } from '@/hooks/useGoals';
import { formatEducationLevel } from '@/utils/education-level-parser';

export default function GoalsTab() {
  const router = useRouter();
  const { goals, statistics, isLoading, isRefreshing, error, refresh, deleteGoal, completeGoal } = useGoals();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleDeleteGoal = (id: string, title: string) => {
    Alert.alert(
      'Supprimer l\'objectif',
      `Êtes-vous sûr de vouloir supprimer "${title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(id);
              Alert.alert('Succès', 'Objectif supprimé avec succès');
            } catch (err: any) {
              Alert.alert('Erreur', err.message);
            }
          },
        },
      ]
    );
  };

  const handleCompleteGoal = (id: string, title: string) => {
    Alert.alert(
      'Marquer comme complété',
      `Félicitations ! Avez-vous atteint l'objectif "${title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, complété !',
          onPress: async () => {
            try {
              await completeGoal(id);
              Alert.alert('🎉 Félicitations !', 'Objectif atteint avec succès !');
            } catch (err: any) {
              Alert.alert('Erreur', err.message);
            }
          },
        },
      ]
    );
  };

  const handleGoalPress = (goalId: string) => {
    router.push(`/progress/goal-details?id=${goalId}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return !goal.isCompleted;
    if (filter === 'completed') return goal.isCompleted;
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Statistics */}
        {statistics && statistics.totalGoals > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Target size={20} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.statValue}>{statistics.totalGoals}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.statCard}>
              <Circle size={20} color={Colors.accent2} strokeWidth={2} />
              <Text style={styles.statValue}>{statistics.activeGoals}</Text>
              <Text style={styles.statLabel}>En cours</Text>
            </View>

            <View style={styles.statCard}>
              <CheckCircle size={20} color={Colors.success} strokeWidth={2} />
              <Text style={styles.statValue}>{statistics.completedGoals}</Text>
              <Text style={styles.statLabel}>Complétés</Text>
            </View>

            <View style={styles.statCard}>
              <AlertCircle size={20} color={Colors.error} strokeWidth={2} />
              <Text style={styles.statValue}>{statistics.overdueGoals}</Text>
              <Text style={styles.statLabel}>En retard</Text>
            </View>
          </View>
        )}

        {/* Completion Rate */}
        {statistics && statistics.totalGoals > 0 && (
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Taux de réussite</Text>
              <Text style={styles.completionPercentage}>
                {statistics.completionRate.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${statistics.completionRate}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        {goals.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === 'all' && styles.filterTabTextActive,
                ]}
              >
                Tous ({goals.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
              onPress={() => setFilter('active')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === 'active' && styles.filterTabTextActive,
                ]}
              >
                Actifs ({statistics?.activeGoals || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
              onPress={() => setFilter('completed')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === 'completed' && styles.filterTabTextActive,
                ]}
              >
                Complétés ({statistics?.completedGoals || 0})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Goals List */}
        {filteredGoals.length > 0 ? (
          <View style={styles.goalsContainer}>
            {filteredGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  goal.isCompleted && styles.goalCardCompleted,
                  goal.isOverdue && !goal.isCompleted && styles.goalCardOverdue,
                ]}
                onPress={() => handleGoalPress(goal.id)}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleContainer}>
                    {goal.isCompleted ? (
                      <CheckCircle size={24} color={Colors.success} strokeWidth={2} />
                    ) : goal.isOverdue ? (
                      <AlertCircle size={24} color={Colors.error} strokeWidth={2} />
                    ) : (
                      <Circle size={24} color={Colors.primary} strokeWidth={2} />
                    )}
                    <View style={styles.goalTitleTextContainer}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <View style={styles.goalSubjectContainer}>
                        <GraduationCap size={14} color={Colors.primary} strokeWidth={2} />
                        <Text style={styles.goalSubject}>
                          {goal.subject}
                          {goal.educationLevel && ` - ${formatEducationLevel(goal.educationLevel)}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={20} color={Colors.textSecondary} />
                </View>

                {goal.description && (
                  <Text style={styles.goalDescription} numberOfLines={2}>
                    {goal.description}
                  </Text>
                )}

                <View style={styles.goalStats}>
                  <View style={styles.goalStat}>
                    <TrendingUp size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.goalStatText}>
                      {Number(goal.currentScore).toFixed(0)} / {Number(goal.targetScore).toFixed(0)}
                    </Text>
                  </View>

                  <View style={styles.goalStat}>
                    <Calendar size={16} color={Colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={[
                        styles.goalStatText,
                        goal.isOverdue && !goal.isCompleted && styles.goalStatTextOverdue,
                      ]}
                    >
                      {goal.isCompleted
                        ? 'Complété'
                        : goal.isOverdue
                        ? `En retard de ${Math.abs(goal.daysRemaining)} j`
                        : `${goal.daysRemaining} jours restants`}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.goalProgressContainer}>
                  <View
                    style={[
                      styles.goalProgressBar,
                      {
                        width: `${Math.min(Number(goal.progressPercentage), 100)}%`,
                        backgroundColor: goal.isCompleted
                          ? Colors.success
                          : goal.isOverdue
                          ? Colors.error
                          : Colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.goalProgressText}>
                  {Number(goal.progressPercentage).toFixed(0)}% complété
                </Text>

                {/* Actions */}
                {!goal.isCompleted && (
                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCompleteGoal(goal.id, goal.title);
                      }}
                    >
                      <CheckCircle size={16} color={Colors.success} strokeWidth={2} />
                      <Text style={styles.completeButtonText}>Marquer complété</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id, goal.title);
                      }}
                    >
                      <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Target size={56} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>
              {filter === 'all'
                ? 'Aucun objectif défini'
                : filter === 'active'
                ? 'Aucun objectif actif'
                : 'Aucun objectif complété'}
            </Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'Définissez des objectifs académiques pour suivre votre progression et rester motivé'
                : filter === 'active'
                ? 'Tous vos objectifs sont complétés !'
                : 'Commencez à atteindre vos objectifs'}
            </Text>

            {filter === 'all' && (
              <View style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>Exemples d'objectifs</Text>
                <View style={styles.exampleItem}>
                  <View style={styles.exampleDot} />
                  <Text style={styles.exampleText}>
                    Atteindre 15/20 en Mathématiques d'ici la fin du trimestre
                  </Text>
                </View>
                <View style={styles.exampleItem}>
                  <View style={styles.exampleDot} />
                  <Text style={styles.exampleText}>
                    Améliorer ma moyenne de 2 points en Physique
                  </Text>
                </View>
                <View style={styles.exampleItem}>
                  <View style={styles.exampleDot} />
                  <Text style={styles.exampleText}>
                    Obtenir plus de 80% à mon prochain examen d'Anglais
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB for adding goal */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/progress/add-goal' as any)}
        activeOpacity={0.8}
      >
        <Plus size={24} color={Colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
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
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    gap: 4,
    ...Shadows.small,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  completionCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  completionPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: 4,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    borderRadius: BorderRadius.small,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  goalsContainer: {
    gap: Spacing.md,
  },
  goalCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
  },
  goalCardCompleted: {
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  goalCardOverdue: {
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  goalTitleTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  goalSubjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  goalDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  goalStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  goalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  goalStatTextOverdue: {
    color: Colors.error,
    fontWeight: '600',
  },
  goalProgressContainer: {
    height: 5,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginBottom: 4,
  },
  goalProgressBar: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  goalProgressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  goalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.success + '15',
    borderRadius: BorderRadius.small,
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  deleteButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 17,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
    marginTop: Spacing.md,
    width: '100%',
    ...Shadows.small,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  exampleText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
    elevation: 8,
  },
});
