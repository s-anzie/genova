import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  BookOpen,
} from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useGoals } from '@/hooks/useGoals';
import { GoalProgress } from '@/types/api';
import { apiClient } from '@/utils/api-client';

export default function GoalDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteGoal } = useGoals();

  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoalProgress();
  }, [id]);

  const loadGoalProgress = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{ success: boolean; data: GoalProgress }>(
        `/goals/${id}/progress`
      );

      setGoalProgress(response.data);
    } catch (err: any) {
      console.error('Failed to load goal progress:', err);
      setError(err.message || 'Impossible de charger les détails de l\'objectif');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!goalProgress) return;

    Alert.alert(
      'Supprimer l\'objectif',
      `Êtes-vous sûr de vouloir supprimer "${goalProgress.goal.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(id);
              Alert.alert('Succès', 'Objectif supprimé avec succès', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Erreur', err.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Détails de l'objectif"
          variant="primary"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error || !goalProgress) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Détails de l'objectif"
          variant="primary"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Objectif introuvable'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGoalProgress}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { goal, progressPercentage, daysRemaining, isOverdue, recentResults } = goalProgress;

  return (
    <View style={styles.container}>
      <PageHeader
        title="Détails de l'objectif"
        variant="primary"
        showBackButton
        onBackPress={() => router.back()}
        rightElement={
          !goal.isCompleted && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() =>
                  router.push({
                    pathname: '/(student)/progress/edit-goal',
                    params: { id: goal.id },
                  } as any)
                }
              >
                <Edit size={20} color={Colors.white} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                <Trash2 size={20} color={Colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Goal Header */}
        <View
          style={[
            styles.goalHeader,
            goal.isCompleted && styles.goalHeaderCompleted,
            isOverdue && !goal.isCompleted && styles.goalHeaderOverdue,
          ]}
        >
          <View style={styles.goalIconContainer}>
            {goal.isCompleted ? (
              <CheckCircle
                size={32}
                color={Colors.success}
                strokeWidth={2}
                fill={Colors.success}
              />
            ) : isOverdue ? (
              <AlertCircle size={32} color={Colors.error} strokeWidth={2} />
            ) : (
              <Target size={32} color={Colors.primary} strokeWidth={2} />
            )}
          </View>

          <View style={styles.goalHeaderContent}>
            <Text style={styles.goalSubject}>{goal.subject}</Text>
            <Text style={styles.goalTitle}>{goal.title}</Text>

            {goal.description && (
              <Text style={styles.goalDescription}>{goal.description}</Text>
            )}
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Progression</Text>

          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>
                {Number(progressPercentage).toFixed(0)}%
              </Text>
              <Text style={styles.progressLabel}>Complété</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(Number(progressPercentage), 100)}%`,
                  backgroundColor: goal.isCompleted
                    ? Colors.success
                    : isOverdue
                    ? Colors.error
                    : Colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Score actuel</Text>
              <Text style={styles.progressStatValue}>
                {Number(goal.currentScore).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Score cible</Text>
              <Text style={styles.progressStatValue}>
                {Number(goal.targetScore).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Reste à faire</Text>
              <Text
                style={[
                  styles.progressStatValue,
                  Number(goal.currentScore) >= Number(goal.targetScore) && styles.progressStatValueSuccess,
                ]}
              >
                {Math.max(0, Number(goal.targetScore) - Number(goal.currentScore)).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Échéance</Text>

          <View style={styles.timelineContent}>
            <View style={styles.timelineItem}>
              <Calendar size={20} color={Colors.primary} strokeWidth={2} />
              <View style={styles.timelineItemContent}>
                <Text style={styles.timelineItemLabel}>Date limite</Text>
                <Text style={styles.timelineItemValue}>
                  {new Date(goal.deadline).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <TrendingUp size={20} color={Colors.secondary} strokeWidth={2} />
              <View style={styles.timelineItemContent}>
                <Text style={styles.timelineItemLabel}>Temps restant</Text>
                <Text
                  style={[
                    styles.timelineItemValue,
                    isOverdue && !goal.isCompleted && styles.timelineItemValueOverdue,
                    goal.isCompleted && styles.timelineItemValueSuccess,
                  ]}
                >
                  {goal.isCompleted
                    ? 'Objectif atteint !'
                    : isOverdue
                    ? `En retard de ${Math.abs(daysRemaining)} jours`
                    : `${daysRemaining} jours restants`}
                </Text>
              </View>
            </View>

            {goal.completedAt && (
              <View style={styles.timelineItem}>
                <CheckCircle size={20} color={Colors.success} strokeWidth={2} />
                <View style={styles.timelineItemContent}>
                  <Text style={styles.timelineItemLabel}>Complété le</Text>
                  <Text style={styles.timelineItemValue}>
                    {new Date(goal.completedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <View style={styles.resultsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Résultats récents</Text>
              <Text style={styles.sectionSubtitle}>
                {recentResults.length} résultat{recentResults.length > 1 ? 's' : ''}
              </Text>
            </View>

            {recentResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultIcon}>
                  <BookOpen size={16} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultName}>{result.examName}</Text>
                  <Text style={styles.resultDate}>
                    {new Date(result.examDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.resultScore}>
                  <Text style={styles.resultScoreValue}>
                    {result.score} / {result.maxScore}
                  </Text>
                  <Text
                    style={[
                      styles.resultScorePercentage,
                      (result.score / result.maxScore) * 100 >= goal.targetScore &&
                        styles.resultScorePercentageSuccess,
                    ]}
                  >
                    {((result.score / result.maxScore) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Result Button */}
        {!goal.isCompleted && (
          <TouchableOpacity
            style={styles.addResultButton}
            onPress={() =>
              router.push({
                pathname: '/(student)/progress/add-result',
                params: { goalId: goal.id, subject: goal.subject },
              } as any)
            }
          >
            <Text style={styles.addResultButtonText}>
              Ajouter un résultat pour mettre à jour la progression
            </Text>
          </TouchableOpacity>
        )}
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
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  goalHeader: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  goalHeaderCompleted: {
    backgroundColor: Colors.success + '15',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  goalHeaderOverdue: {
    backgroundColor: Colors.error + '15',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  goalIconContainer: {
    marginBottom: Spacing.md,
  },
  goalHeaderContent: {
    gap: Spacing.sm,
  },
  goalSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  goalDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  progressCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '15',
    borderWidth: 8,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressStatValueSuccess: {
    color: Colors.success,
  },
  timelineCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  timelineContent: {
    gap: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timelineItemContent: {
    flex: 1,
  },
  timelineItemLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  timelineItemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timelineItemValueOverdue: {
    color: Colors.error,
  },
  timelineItemValueSuccess: {
    color: Colors.success,
  },
  resultsCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  resultDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultScore: {
    alignItems: 'flex-end',
  },
  resultScoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  resultScorePercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  resultScorePercentageSuccess: {
    color: Colors.success,
  },
  addResultButton: {
    backgroundColor: Colors.primary + '15',
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  addResultButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
});
