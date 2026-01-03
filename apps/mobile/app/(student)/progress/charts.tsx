import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart3, TrendingUp } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useProgress } from '@/hooks/useProgress';
import { ProgressVisualizationData } from '@/types/api';

const { width } = Dimensions.get('window');
const chartWidth = width - Spacing.md * 2;

export default function ChartsScreen() {
  const router = useRouter();
  const { subjects, getVisualizationData } = useProgress();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ProgressVisualizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [selectedSubject]);

  const loadChartData = async () => {
    try {
      setIsLoading(true);
      const data = await getVisualizationData(selectedSubject || undefined);
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSimpleChart = () => {
    if (!chartData || chartData.scores.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <BarChart3 size={48} color={Colors.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyChartText}>
            Aucune donnée à afficher
          </Text>
        </View>
      );
    }

    const maxScore = Math.max(...chartData.scores, ...chartData.averages);
    const chartHeight = 200;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {selectedSubject || 'Toutes les matières'}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScroll}
        >
          {chartData.scores.map((score, index) => {
            const barHeight = (score / maxScore) * chartHeight;
            const avgHeight = (chartData.averages[index] / maxScore) * chartHeight;
            const isAboveAverage = score >= chartData.averages[index];

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  {/* Average line */}
                  <View
                    style={[
                      styles.averageLine,
                      { bottom: avgHeight },
                    ]}
                  />

                  {/* Score bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isAboveAverage
                          ? Colors.success
                          : Colors.warning,
                      },
                    ]}
                  >
                    <Text style={styles.barValue}>{score.toFixed(0)}%</Text>
                  </View>
                </View>

                <Text style={styles.barLabel} numberOfLines={2}>
                  {chartData.labels[index].split('(')[0].trim()}
                </Text>
                <Text style={styles.barDate}>
                  {chartData.labels[index].match(/\((.*?)\)/)?.[1] || ''}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Au-dessus de la moyenne</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendText}>En-dessous de la moyenne</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine]} />
            <Text style={styles.legendText}>Moyenne mobile</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Graphiques"
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

  return (
    <View style={styles.container}>
      <PageHeader
        title="Graphiques"
        variant="primary"
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Subject Filter */}
      {subjects.length > 0 && (
        <View style={styles.filterContainer}>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderSimpleChart()}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <TrendingUp size={24} color={Colors.primary} strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Suivez votre évolution</Text>
            <Text style={styles.infoText}>
              Ce graphique montre vos résultats au fil du temps. La ligne pointillée représente votre moyenne mobile.
            </Text>
          </View>
        </View>
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
  filterContainer: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgSecondary,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  chartScroll: {
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  barContainer: {
    alignItems: 'center',
    width: 80,
  },
  barWrapper: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  bar: {
    width: 40,
    borderRadius: BorderRadius.small,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    width: '100%',
  },
  barDate: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  legend: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.small,
  },
  legendLine: {
    width: 16,
    height: 2,
    backgroundColor: Colors.primary,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyChart: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyChartText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Shadows.small,
  },
  infoContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
