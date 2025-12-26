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
import { useRouter } from 'expo-router';
import { Trash2, Edit, BookOpen } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useProgress } from '@/hooks/useProgress';
import { AcademicResultResponse } from '@/types/api';
import { apiClient } from '@/utils/api-client';

export default function ResultsListScreen() {
  const router = useRouter();
  const { refresh } = useProgress();
  const [results, setResults] = useState<AcademicResultResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    loadResults();
  }, [selectedSubject]);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      
      const url = selectedSubject
        ? `/progress/results?subject=${encodeURIComponent(selectedSubject)}`
        : '/progress/results';
      
      const res = await apiClient.get<{ data: AcademicResultResponse[] }>(url);
      setResults(res.data || []);

      // Get unique subjects
      const uniqueSubjects = [...new Set((res.data || []).map(r => r.subject))];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, examName: string) => {
    Alert.alert(
      'Supprimer le résultat',
      `Êtes-vous sûr de vouloir supprimer "${examName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/progress/results/${id}`);
              await loadResults();
              await refresh();
              Alert.alert('Succès', 'Résultat supprimé');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le résultat');
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
          title="Tous les résultats"
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
        title="Tous les résultats"
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
        {results.length > 0 ? (
          results.map((result) => {
            const percentage = (result.score / result.maxScore) * 100;

            return (
              <View key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultTitleContainer}>
                    <BookOpen size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.resultSubject}>{result.subject}</Text>
                  </View>
                  <Text style={styles.resultDate}>
                    {new Date(result.examDate).toLocaleDateString('fr-FR')}
                  </Text>
                </View>

                <Text style={styles.resultExam}>{result.examName}</Text>

                <View style={styles.resultScoreContainer}>
                  <View>
                    <Text style={styles.resultScore}>
                      {result.score} / {result.maxScore}
                    </Text>
                    <Text
                      style={[
                        styles.resultPercentage,
                        percentage >= 50
                          ? styles.resultPercentageGood
                          : styles.resultPercentageBad,
                      ]}
                    >
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(result.id, result.examName)}
                    >
                      <Trash2 size={18} color={Colors.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor:
                          percentage >= 50 ? Colors.success : Colors.warning,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <BookOpen size={48} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
            <Text style={styles.emptyStateText}>
              {selectedSubject
                ? `Aucun résultat pour ${selectedSubject}`
                : 'Ajoutez vos résultats académiques pour les voir ici'}
            </Text>
          </View>
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
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
    marginBottom: Spacing.sm,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultPercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  resultPercentageGood: {
    color: Colors.success,
  },
  resultPercentageBad: {
    color: Colors.warning,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.bgSecondary,
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
});
