import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Save, X } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useProgress } from '@/hooks/useProgress';
import { CreateAcademicResultData } from '@/types/api';

export default function AddResultScreen() {
  const router = useRouter();
  const { addResult } = useProgress();

  const [subject, setSubject] = useState('');
  const [examName, setExamName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [examDate, setExamDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une matière');
      return;
    }

    if (!examName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de l\'examen');
      return;
    }

    const scoreNum = parseFloat(score);
    const maxScoreNum = parseFloat(maxScore);

    if (isNaN(scoreNum) || scoreNum < 0) {
      Alert.alert('Erreur', 'Veuillez entrer une note valide');
      return;
    }

    if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une note maximale valide');
      return;
    }

    if (scoreNum > maxScoreNum) {
      Alert.alert('Erreur', 'La note ne peut pas dépasser la note maximale');
      return;
    }

    if (examDate > new Date()) {
      Alert.alert('Erreur', 'La date de l\'examen ne peut pas être dans le futur');
      return;
    }

    try {
      setIsSubmitting(true);

      const data: CreateAcademicResultData = {
        subject: subject.trim(),
        examName: examName.trim(),
        score: scoreNum,
        maxScore: maxScoreNum,
        examDate,
      };

      await addResult(data);

      Alert.alert('Succès', 'Résultat ajouté avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le résultat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExamDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Ajouter un résultat"
        variant="primary"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Subject */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Matière *</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Ex: Mathématiques"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          {/* Exam Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom de l'examen *</Text>
            <TextInput
              style={styles.input}
              value={examName}
              onChangeText={setExamName}
              placeholder="Ex: Contrôle Chapitre 3"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          {/* Score */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Note obtenue *</Text>
              <TextInput
                style={styles.input}
                value={score}
                onChangeText={setScore}
                placeholder="Ex: 15"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Note maximale *</Text>
              <TextInput
                style={styles.input}
                value={maxScore}
                onChangeText={setMaxScore}
                placeholder="Ex: 20"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Exam Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de l'examen *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.dateButtonText}>
                {examDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={examDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Preview */}
          {score && maxScore && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Aperçu</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewSubject}>{subject || 'Matière'}</Text>
                <Text style={styles.previewExam}>{examName || 'Nom de l\'examen'}</Text>
                <View style={styles.previewScoreContainer}>
                  <Text style={styles.previewScore}>
                    {score || '0'} / {maxScore || '0'}
                  </Text>
                  <Text style={styles.previewPercentage}>
                    {score && maxScore
                      ? `${((parseFloat(score) / parseFloat(maxScore)) * 100).toFixed(1)}%`
                      : '0%'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <X size={20} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Save size={20} color={Colors.white} strokeWidth={2} />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  formGroup: {
    gap: Spacing.sm,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
  },
  previewSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  previewExam: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  previewScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewScore: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  previewPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.medium,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
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
