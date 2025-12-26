import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useProgress } from '@/hooks/useProgress';
import { ProgressData } from '@/types/api';

const { width } = Dimensions.get('window');

export default function SubjectProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const subject = params.subject as string;
  const { getSubjectProgress } = useProgress();

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [subject]);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      const data = await getSubjectProgress(subject);
      setProgress(data);
    } catch (error) {
      console.error('Error loading subject progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title={subject}
          variant="primary"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!progress) {
    return (
      <View style={styles.container}>
        <PageHeader
          title={subject}
          variant="primary"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune donnée disponible</Text>
        </View>
      </View>
    );
  }

  const getTrendIcon = () => {
    switch (progress.trend) {
      case 'improving':
        return <TrendingUp size={24} color={Colors.success} strokeWidth={2} />;
      case 'declining':
        return <TrendingDown size={24} color={Colors.error} strokeWidth={2} />;
      case 'stable':
        return <Minus size={24} color={Colors.textSecondary} strokeWidth={2} />;
    }
  };

  const getTrendText = () => {
    switch (progress.trend) {
      case 'improving':
        return 'En amélioration';
      case 'declining':
        return 'En baisse';
      case 'stable':
        return 'Stable';
    }
  };

  const getTrendColor = () => {
    switch (progress.trend) {
      case 'improving':
        return Colors.success;
      case 'declining':
        return Colors.error;
      case 'stable':
        return Colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title={subject}
        variant="primary"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <BookOpen size={32} color={Colors.primary} strokeWidth={2} />
            <View style={styles.trendBadge}>
              {getTrendIcon()}
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {getTrendText()}
              </Text>
            </View>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>
                {progress.averageScore.toFixed(1)}%
              </Text>
              <Text style={styles.summaryStatLabel}>Moyenne</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStat}>
              <Text
                style={[
                  styles.summaryStatValue,
                  progress.improvement !== null &&
                    progress.improvement > 0 &&
                    styles.summaryStatValuePositive,
                  progress.improvement !== null &&
                    progress.improvement < 0 &&
                    styles.summaryStatValueNegative,
                ]}
              >
                {progress.improvement !== null
                  ? `${progress.improvement > 0 ? '+' : ''}${progress.improvement.toFixed(1)}%`
                  : 'N/A'}
              </Text>
              <Text style={styles.summaryStatLabel}>Amélioration</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{progress.results.length}</Text>
              <Text style={styles.summaryStatLabel}>Résultats</Text>
            </View>
          </View>
        </View>

        {/* Results List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des résultats</Text>

          {progress.results.length > 0 ? (
            progress.results.map((result, index) => {
              const percentage = (result.score / result.maxScore) * 100;
              const isAboveAverage = percentage >= progress.averageScore;

              return (
                <View key={result.id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultNumber}>
                      <Text style={styles.resultNumberText}>
                        #{progress.results.length - index}
                      </Text>
                    </View>
                    <Text style={styles.resultDate}>
                      {new Date(result.examDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <Text style={styles.resultExam}>{result.examName}</Text>

                  <View style={styles.resultScoreRow}>
                    <View style={styles.resultScoreContainer}>
                      <Text style={styles.resultScore}>
                        {result.score} / {result.maxScore}
                      </Text>
                      <Text
                        style={[
                          styles.resultPercentage,
                          isAboveAverage
                            ? styles.resultPercentageGood
                            : styles.resultPercentageBad,
                        ]}
                      >
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>

                    {isAboveAverage ? (
                      <View style={styles.badgeGood}>
                        <Text style={styles.badgeGoodText}>Au-dessus de la moyenne</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeBad}>
                        <Text style={styles.badgeBadText}>En-dessous de la moyenne</Text>
                      </View>
                    )}
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isAboveAverage
                            ? Colors.success
                            : Colors.warning,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyResults}>
              <Text style={styles.emptyResultsText}>
                Aucun résultat pour cette matière
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/progress/add-result' as any)}
        >
          <Text style={styles.addButtonText}>Ajouter un résultat</Text>
        </TouchableOpacity>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.round,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryStat: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryStatValuePositive: {
    color: Colors.success,
  },
  summaryStatValueNegative: {
    color: Colors.error,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  resultNumber: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  resultNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  resultDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultExam: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  resultScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultPercentageGood: {
    color: Colors.success,
  },
  resultPercentageBad: {
    color: Colors.warning,
  },
  badgeGood: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  badgeGoodText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  badgeBad: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  badgeBadText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  emptyResults: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadows.medium,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
