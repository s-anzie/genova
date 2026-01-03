import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useProgress } from '@/hooks/useProgress';

export default function ProgressTab() {
  const router = useRouter();
  const { dashboard, subjects, isLoading, isRefreshing, error, refresh } = useProgress();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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

  const filteredProgress = selectedSubject
    ? dashboard?.progressBySubject.filter(p => p.subject === selectedSubject)
    : dashboard?.progressBySubject;

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
        {/* Compact Statistics */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Clock size={18} color={Colors.primary} strokeWidth={2} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {dashboard?.totalHoursTutored.toFixed(1) || '0'}h
              </Text>
              <Text style={styles.statLabel}>Heures</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Calendar size={18} color={Colors.secondary} strokeWidth={2} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{dashboard?.upcomingSessions || 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <TrendingUp size={18} color={Colors.success} strokeWidth={2} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {dashboard?.overallImprovement !== null
                  ? `${(dashboard?.overallImprovement || 0) > 0 ? '+' : ''}${dashboard?.overallImprovement.toFixed(1)}%`
                  : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Progrès</Text>
            </View>
          </View>
        </View>

        {/* Subject Filter */}
        {subjects.length > 0 && (
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
        )}

        {/* Progress by Subject */}
        {filteredProgress && filteredProgress.length > 0 ? (
          <>
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
                  <View style={styles.progressTitleRow}>
                    <BookOpen size={18} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.progressSubject}>{progress.subject}</Text>
                  </View>
                  {getTrendIcon(progress.trend)}
                </View>

                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>
                      {progress.averageScore.toFixed(1)}%
                    </Text>
                    <Text style={styles.progressStatLabel}>Moyenne</Text>
                  </View>

                  <View style={styles.progressStat}>
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
                    <Text style={styles.progressStatLabel}>Évolution</Text>
                  </View>

                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{progress.results.length}</Text>
                    <Text style={styles.progressStatLabel}>Résultats</Text>
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
          </>
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

            {dashboard.recentResults.slice(0, 3).map((result) => (
              <View key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultSubject}>{result.subject}</Text>
                  <Text style={styles.resultDate}>
                    {new Date(result.examDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Text style={styles.resultExam} numberOfLines={1}>{result.examName}</Text>
                <View style={styles.resultScoreRow}>
                  <Text style={styles.resultScore}>
                    {result.score}/{result.maxScore}
                  </Text>
                  <Text style={styles.resultPercentage}>
                    {((result.score / result.maxScore) * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={() => router.push('/(student)/(tabs)/learn/goals' as any)}
        >
          <Award size={20} color={Colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/progress/add-result' as any)}
        >
          <Plus size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
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
    fontSize: 15,
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
    fontSize: 15,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  progressCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  progressSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  progressStatValuePositive: {
    color: Colors.success,
  },
  progressStatValueNegative: {
    color: Colors.error,
  },
  progressStatLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
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
    paddingVertical: 60,
    gap: Spacing.sm,
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
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.xs,
    ...Shadows.small,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resultExam: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  resultScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultScore: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
    elevation: 8,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
