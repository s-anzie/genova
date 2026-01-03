import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Save, Target } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useGoals } from '@/hooks/useGoals';
import { UpdateLearningGoalData } from '@/types/api';
import { apiClient } from '@/utils/api-client';

export default function EditGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateGoal } = useGoals();

  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    try {
      setIsLoadingGoal(true);
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/goals/${id}/progress`
      );

      const { goal } = response.data;
      setSubject(goal.subject);
      setTitle(goal.title);
      setDescription(goal.description || '');
      setTargetScore(goal.targetScore.toString());
      setDeadline(new Date(goal.deadline));
    } catch (error: any) {
      console.error('Error loading goal:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'objectif', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setIsLoadingGoal(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour votre objectif');
      return;
    }

    const targetScoreNum = parseFloat(targetScore);

    if (isNaN(targetScoreNum) || targetScoreNum < 0 || targetScoreNum > 100) {
      Alert.alert('Erreur', 'Le score cible doit être entre 0 et 100');
      return;
    }

    if (deadline <= new Date()) {
      Alert.alert('Erreur', 'La date limite doit être dans le futur');
      return;
    }

    try {
      setIsSubmitting(true);

      const data: UpdateLearningGoalData = {
        title: title.trim(),
        description: description.trim() || undefined,
        targetScore: targetScoreNum,
        deadline,
      };

      await updateGoal(id, data);

      Alert.alert('Succès', 'Objectif modifié avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de modifier l\'objectif');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  if (isLoadingGoal) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Modifier l'objectif"
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

  return (
    <View style={styles.container}>
      <PageHeader
        title="Modifier l'objectif"
        variant="primary"
        showBackButton
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Save size={24} color={Colors.white} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Subject (Read-only) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Matière</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{subject}</Text>
            </View>
            <Text style={styles.hint}>
              La matière ne peut pas être modifiée
            </Text>
          </View>

          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Titre de l'objectif *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Atteindre 15/20 au prochain contrôle"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre objectif en détail..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Target Score */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Score cible (%) *</Text>
            <TextInput
              style={styles.input}
              value={targetScore}
              onChangeText={setTargetScore}
              placeholder="Ex: 75"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>
              Entrez le pourcentage que vous souhaitez atteindre (0-100)
            </Text>
          </View>

          {/* Deadline */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date limite *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.dateButtonText}>
                {deadline.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              Date à laquelle vous souhaitez atteindre cet objectif
            </Text>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Preview */}
          {title && targetScore && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Aperçu</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Target size={24} color={Colors.primary} strokeWidth={2} />
                  <View style={styles.previewTitleContainer}>
                    <Text style={styles.previewSubject}>{subject}</Text>
                    <Text style={styles.previewTitle}>{title}</Text>
                  </View>
                </View>

                {description && (
                  <Text style={styles.previewDescription} numberOfLines={3}>
                    {description}
                  </Text>
                )}

                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Score cible</Text>
                    <Text style={styles.previewStatValue}>{targetScore}%</Text>
                  </View>

                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Date limite</Text>
                    <Text style={styles.previewStatValue}>
                      {deadline.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                  </View>

                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Jours restants</Text>
                    <Text style={styles.previewStatValue}>
                      {Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
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
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  formGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.sm,
  },
  readOnlyField: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  readOnlyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  dateButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  preview: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  previewTitleContainer: {
    flex: 1,
  },
  previewSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  previewDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  previewStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
