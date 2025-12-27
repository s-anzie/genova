import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Eye } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { PageHeader } from '@/components/PageHeader';

type RecurrencePattern = 'ROUND_ROBIN' | 'WEEKLY' | 'CONSECUTIVE_DAYS' | 'MANUAL';

const PATTERN_OPTIONS: Array<{ value: RecurrencePattern; label: string; description: string }> = [
  {
    value: 'ROUND_ROBIN',
    label: 'Rotation',
    description: 'Les tuteurs alternent équitablement',
  },
  {
    value: 'WEEKLY',
    label: 'Hebdomadaire',
    description: 'Tuteur assigné à des semaines spécifiques',
  },
  {
    value: 'CONSECUTIVE_DAYS',
    label: 'Jours consécutifs',
    description: 'Tuteur pour N sessions consécutives',
  },
  {
    value: 'MANUAL',
    label: 'Manuel',
    description: 'Pas d\'affectation automatique',
  },
];

interface SessionPreview {
  weekStart: string;
  sessionDate: string;
  tutorId: string | null;
  tutorName: string;
}

export default function EditAssignmentScreen() {
  const router = useRouter();
  const {
    classId,
    timeSlotId,
    assignmentId,
    tutorName,
    recurrencePattern: initialPattern,
    recurrenceConfig: initialConfig,
  } = useLocalSearchParams<{
    classId: string;
    timeSlotId: string;
    assignmentId: string;
    tutorName: string;
    recurrencePattern: string;
    recurrenceConfig: string;
  }>();

  const [submitting, setSubmitting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<RecurrencePattern>(
    (initialPattern as RecurrencePattern) || 'ROUND_ROBIN'
  );
  const [weekNumbers, setWeekNumbers] = useState('');
  const [consecutiveDays, setConsecutiveDays] = useState('5');
  const [sessionPreview, setSessionPreview] = useState<SessionPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Parse initial config
    if (initialConfig) {
      try {
        const config = JSON.parse(initialConfig);
        if (config.weeks) {
          setWeekNumbers(config.weeks.join(','));
        }
        if (config.consecutiveDays) {
          setConsecutiveDays(config.consecutiveDays.toString());
        }
      } catch (error) {
        console.error('Failed to parse initial config:', error);
      }
    }
  }, [initialConfig]);

  const handleLoadPreview = async () => {
    try {
      setLoadingPreview(true);

      let recurrenceConfig: any = null;

      if (selectedPattern === 'WEEKLY') {
        if (!weekNumbers.trim()) {
          Alert.alert('Erreur', 'Veuillez entrer les numéros de semaine');
          return;
        }
        const weeks = weekNumbers.split(',').map((w) => parseInt(w.trim())).filter((w) => !isNaN(w));
        if (weeks.length === 0) {
          Alert.alert('Erreur', 'Format de semaines invalide');
          return;
        }
        recurrenceConfig = { weeks };
      } else if (selectedPattern === 'CONSECUTIVE_DAYS') {
        const days = parseInt(consecutiveDays);
        if (isNaN(days) || days < 1) {
          Alert.alert('Erreur', 'Nombre de jours consécutifs invalide');
          return;
        }
        recurrenceConfig = { consecutiveDays: days };
      }

      const response = await apiClient.post(
        `/classes/${classId}/time-slots/${timeSlotId}/preview`,
        {
          weeksAhead: 4,
        }
      );

      setSessionPreview(response.data.sessions || []);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Failed to load preview:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'aperçu');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      let recurrenceConfig: any = null;

      if (selectedPattern === 'WEEKLY') {
        if (!weekNumbers.trim()) {
          Alert.alert('Erreur', 'Veuillez entrer les numéros de semaine (ex: 1,3,5)');
          return;
        }
        const weeks = weekNumbers.split(',').map((w) => parseInt(w.trim())).filter((w) => !isNaN(w));
        if (weeks.length === 0) {
          Alert.alert('Erreur', 'Format de semaines invalide');
          return;
        }
        recurrenceConfig = { weeks };
      } else if (selectedPattern === 'CONSECUTIVE_DAYS') {
        const days = parseInt(consecutiveDays);
        if (isNaN(days) || days < 1) {
          Alert.alert('Erreur', 'Nombre de jours consécutifs invalide');
          return;
        }
        recurrenceConfig = { consecutiveDays: days };
      }

      await apiClient.put(
        `/classes/${classId}/time-slots/${timeSlotId}/assignments/${assignmentId}`,
        {
          recurrencePattern: selectedPattern,
          recurrenceConfig,
        }
      );

      Alert.alert('Succès', 'Affectation modifiée avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Failed to update assignment:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier l\'affectation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Réaffecter"
        showBackButton={true}
        centerTitle={true}
        showGradient={false}
        variant='primary'
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Tutor Info */}
        <View style={styles.tutorInfoCard}>
          <Text style={styles.tutorInfoLabel}>Tuteur</Text>
          <Text style={styles.tutorInfoValue}>{tutorName}</Text>
        </View>

        {/* Recurrence Pattern Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modèle de récurrence</Text>

          <View style={styles.patternsList}>
            {PATTERN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.patternCard,
                  selectedPattern === option.value && styles.patternCardSelected,
                ]}
                onPress={() => setSelectedPattern(option.value)}
              >
                <View style={styles.patternHeader}>
                  <Text style={styles.patternLabel}>{option.label}</Text>
                  {selectedPattern === option.value && (
                    <View style={styles.selectedDot} />
                  )}
                </View>
                <Text style={styles.patternDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pattern-specific configuration */}
          {selectedPattern === 'WEEKLY' && (
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Numéros de semaine (séparés par des virgules)</Text>
              <TextInput
                style={styles.configInput}
                placeholder="Ex: 1,3,5"
                value={weekNumbers}
                onChangeText={setWeekNumbers}
                keyboardType="numbers-and-punctuation"
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={styles.configHint}>
                Le tuteur sera affecté aux semaines spécifiées
              </Text>
            </View>
          )}

          {selectedPattern === 'CONSECUTIVE_DAYS' && (
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Nombre de jours consécutifs</Text>
              <TextInput
                style={styles.configInput}
                placeholder="Ex: 5"
                value={consecutiveDays}
                onChangeText={setConsecutiveDays}
                keyboardType="number-pad"
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={styles.configHint}>
                Le tuteur sera affecté pour ce nombre de sessions consécutives
              </Text>
            </View>
          )}
        </View>

        {/* Preview Button */}
        <TouchableOpacity
          style={styles.previewButton}
          onPress={handleLoadPreview}
          disabled={loadingPreview}
        >
          {loadingPreview ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Eye size={20} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.previewButtonText}>Aperçu de la distribution</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Preview Results */}
        {showPreview && sessionPreview.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Aperçu des 4 prochaines semaines</Text>
            <View style={styles.previewList}>
              {sessionPreview.map((session, index) => {
                const sessionDate = new Date(session.sessionDate);
                const weekStart = new Date(session.weekStart);

                return (
                  <View key={index} style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <Text style={styles.previewWeek}>
                        Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={styles.previewDate}>
                        {sessionDate.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.previewTutorName,
                        !session.tutorId && styles.previewUnassigned,
                      ]}
                    >
                      {session.tutorName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  tutorInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  tutorInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tutorInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  patternsList: {
    gap: Spacing.sm,
  },
  patternCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.small,
  },
  patternCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patternLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  patternDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  selectedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  configSection: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  configInput: {
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  configHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  previewButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    ...Shadows.small,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  previewSection: {
    marginBottom: Spacing.lg,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  previewList: {
    gap: Spacing.sm,
  },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  previewWeek: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewDate: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  previewTutorName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  previewUnassigned: {
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
