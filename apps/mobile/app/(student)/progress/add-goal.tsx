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
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Save, Target, BookOpen, GraduationCap } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useGoals } from '@/hooks/useGoals';
import { CreateLearningGoalData } from '@/types/api';
import { ApiClient } from '@/utils/api';
import { formatEducationLevel } from '@/utils/education-level-parser';

interface ClassSubject {
  classId: string;
  className: string;
  subject: string;
  educationLevel: any;
  displayName: string; // "Mathématiques - Terminale C"
}

export default function AddGoalScreen() {
  const router = useRouter();
  const { createGoal } = useGoals();

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [availableSubjects, setAvailableSubjects] = useState<ClassSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ClassSubject | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEnrolledClasses();
  }, []);

  const loadEnrolledClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const response = await ApiClient.get<{ success: boolean; data: any[] }>('/classes');
      
      // Extract all unique subject-class combinations
      const subjects: ClassSubject[] = [];
      
      response.data.forEach((classItem: any) => {
        const educationLevelStr = formatEducationLevel(classItem.educationLevel);
        
        classItem.subjects.forEach((subject: string) => {
          subjects.push({
            classId: classItem.id,
            className: classItem.name,
            subject,
            educationLevel: classItem.educationLevel,
            displayName: `${subject} - ${educationLevelStr}`,
          });
        });
      });

      setAvailableSubjects(subjects);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      Alert.alert('Erreur', 'Impossible de charger vos classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedSubject) {
      Alert.alert('Erreur', 'Veuillez sélectionner une matière');
      return;
    }

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

      const data: CreateLearningGoalData = {
        classId: selectedSubject.classId,
        subject: selectedSubject.subject,
        educationLevel: selectedSubject.educationLevel,
        title: title.trim(),
        description: description.trim() || undefined,
        targetScore: targetScoreNum,
        deadline,
      };

      await createGoal(data);

      Alert.alert('Succès', 'Objectif créé avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'objectif');
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

  if (isLoadingClasses) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Nouvel objectif"
          variant="primary"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement de vos matières...</Text>
        </View>
      </View>
    );
  }

  if (availableSubjects.length === 0) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Nouvel objectif"
          variant="primary"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={Colors.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Aucune classe inscrite</Text>
          <Text style={styles.emptyText}>
            Vous devez d'abord rejoindre une classe pour définir des objectifs d'apprentissage
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(student)/classes' as any)}
          >
            <Text style={styles.emptyButtonText}>Voir mes classes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Nouvel objectif"
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
          {/* Subject Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Matière *</Text>
            <Text style={styles.hint}>
              Sélectionnez la matière pour laquelle vous souhaitez définir un objectif
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subjectsScroll}
            >
              {availableSubjects.map((subj, index) => (
                <TouchableOpacity
                  key={`${subj.classId}-${subj.subject}-${index}`}
                  style={[
                    styles.subjectChip,
                    selectedSubject?.classId === subj.classId &&
                      selectedSubject?.subject === subj.subject &&
                      styles.subjectChipActive,
                  ]}
                  onPress={() => setSelectedSubject(subj)}
                >
                  <GraduationCap
                    size={16}
                    color={
                      selectedSubject?.classId === subj.classId &&
                      selectedSubject?.subject === subj.subject
                        ? Colors.white
                        : Colors.primary
                    }
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.subjectChipText,
                      selectedSubject?.classId === subj.classId &&
                        selectedSubject?.subject === subj.subject &&
                        styles.subjectChipTextActive,
                    ]}
                  >
                    {subj.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedSubject && (
            <>
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
                        <Text style={styles.previewSubject}>{selectedSubject.displayName}</Text>
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
            </>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
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
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  subjectsScroll: {
    flexGrow: 0,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  subjectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  subjectChipTextActive: {
    color: Colors.white,
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
