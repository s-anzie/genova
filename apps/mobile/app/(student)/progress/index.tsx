import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Clock,
  Calendar,
  Award,
  Plus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useProgress } from '@/hooks/useProgress';

const { width } = Dimensions.get('window');

export default function StudentProgressScreen() {
  const router = useRouter();
  const { dashboard, subjects, isLoading, isRefreshing, error, refresh } = useProgress();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Ma Progression" variant="primary" />
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
        <PageHeader title="Ma Progression" variant="primary" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filteredProgress = selectedSubject
    ? dashboard?.progressBySubject.filter(p => p.subject === selectedSubject)
    : dashboard?.progressBySubject;

  return (
    <View style={styles.container}>
      <PageHeader title="Ma Progression" variant="primary" />

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
        {/* Statistics Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Clock size={24} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.statValue}>
              {dashboard?.totalHoursTutored.toFixed(1) || '0'}h
            </Text>
            <Text style={styles.statLabel}>Heures de tutorat</Text>
          </View>

          <View style={styles.statCard}>
            <Calendar size={24} color={Colors.secondary} strokeWidth={2} />
            <Text style={styles.statValue}>{dashboard?.upcomingSessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions à venir</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color={Colors.success} strokeWidth={2} />
            <Text style={styles.statValue}>
              {dashboard?.overallImprovement !== null
                ? `${(dashboard?.overallImprovement || 0) > 0 ? '+' : ''}${dashboard?.overallImprovement.toFixed(1)}%`
                : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Amélioration</Text>
          </View>
        </View>

        {/* Subject Filter */}
        {subjects.length > 0 && (
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filtrer par matière:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedSubject && styles.filterChipActive,
                ]}
                onPress={() => setSelectedSubject(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !selectedSubject && styles.filterChipTextActive,
                  ]}
                >
                  Toutes
                </Text>
              </TouchableOpacity>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.filterChip,
                    selectedSubject === subject && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedSubject(subject)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedSubject === subject && styles.filterChipTextActive,
                    ]}
                  >
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Progress by Subject */}
        {filteredProgress && filteredProgress.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progression par matière</Text>
              <TouchableOpacity
                onPress={() => router.push('/progress/charts' as any)}
              >
                <Text style={styles.sectionLink}>Voir graphiques</Text>
              </TouchableOpacity>
            </View>

            {filteredProgress.map((progress) => (
              <TouchableOpacity
                key={progress.subject}
                style={styles.progressCard}
                onPress={() =>
                  router.push({
                    pathname: '/progress/subject' as any,
                    params: { subject: progress.subject },
                  })
                }
              >
                <View style={styles.progressHeader}>
                  <View style={styles.progressTitleContainer}>
                    <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.progressSubject}>{progress.subject}</Text>
                  </View>
                  {getTrendIcon(progress.trend)}
                </View>

                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatLabel}>Moyenne</Text>
                    <Text style={styles.progressStatValue}>
                      {progress.averageScore.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatLabel}>Amélioration</Text>
                    <Text
                      style={[
                        styles.progressStatValue,
                        progress.improvement !== null &&
                          progress.improvement > 0 &&
                          styles.progressStatValuePositive,
                        progress.improvement !== null &&
                          progress.improvement < 0 &&
                          styles.progressStatValueNegative,
                      ]}
                    >
                      {progress.improvement !== null
                        ? `${progress.improvement > 0 ? '+' : ''}${progress.improvement.toFixed(1)}%`
                        : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatLabel}>Résultats</Text>
                    <Text style={styles.progressStatValue}>{progress.results.length}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(progress.averageScore, 100)}%` },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Award size={48} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
            <Text style={styles.emptyStateText}>
              Ajoutez vos résultats académiques pour suivre votre progression
            </Text>
          </View>
        )}

        {/* Recent Results */}
        {dashboard?.recentResults && dashboard.recentResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Résultats récents</Text>
              <TouchableOpacity
                onPress={() => router.push('/progress/results' as any)}
              >
                <Text style={styles.sectionLink}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {dashboard.recentResults.slice(0, 5).map((result) => (
              <View key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultSubject}>{result.subject}</Text>
                  <Text style={styles.resultDate}>
                    {new Date(result.examDate).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={styles.resultExam}>{result.examName}</Text>
                <View style={styles.resultScoreContainer}>
                  <Text style={styles.resultScore}>
                    {result.score} / {result.maxScore}
                  </Text>
                  <Text style={styles.resultPercentage}>
                    {((result.score / result.maxScore) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/progress/add-result' as any)}
          >
            <Plus size={20} color={Colors.white} strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Ajouter un résultat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/progress/goals' as any)}
          >
            <Award size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.secondaryButtonText}>Mes objectifs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function getTrendIcon(trend: 'improving' | 'declining' | 'stable') {
  switch (trend) {
    case 'improving':
      return <TrendingUp size={20} color={Colors.success} strokeWidth={2} />;
    case 'declining':
      return <TrendingDown size={20} color={Colors.error} strokeWidth={2} />;
    case 'stable':
      return <Minus size={20} color={Colors.textSecondary} strokeWidth={2} />;
  }
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.small,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressStatValuePositive: {
    color: Colors.success,
  },
  progressStatValueNegative: {
    color: Colors.error,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  resultCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultExam: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  resultScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  actionButtons: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

