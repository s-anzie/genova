import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyledModal } from '@/components/ui/StyledModal';
import { PageHeader } from '@/components/PageHeader';

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export default function AddTimeSlotScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; isLevelSubject: boolean }>>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Initialize with default times (14:00 and 16:00)
  const [startTime, setStartTime] = useState(() => {
    const date = new Date();
    date.setHours(14, 0, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    date.setHours(16, 0, 0, 0);
    return date;
  });
  
  const [formData, setFormData] = useState({
    subjectId: '',
    isLevelSubject: true,
    dayOfWeek: 1,
  });

  useEffect(() => {
    loadClassSubjects();
  }, [id]);

  const loadClassSubjects = async () => {
    try {
      const response = await apiClient.get(`/classes/${id}`);
      const classData = response.data;
      
      // Extract subjects from classSubjects relations
      const subjectsList: Array<{ id: string; name: string; isLevelSubject: boolean }> = [];
      
      if (classData.classSubjects && Array.isArray(classData.classSubjects)) {
        classData.classSubjects.forEach((cs: any) => {
          if (cs.levelSubject?.subject) {
            subjectsList.push({
              id: cs.levelSubject.id,
              name: cs.levelSubject.subject.name,
              isLevelSubject: true,
            });
          } else if (cs.streamSubject?.subject) {
            subjectsList.push({
              id: cs.streamSubject.id,
              name: cs.streamSubject.subject.name,
              isLevelSubject: false,
            });
          }
        });
      }
      
      if (subjectsList.length === 0) {
        setErrorMessage('Cette classe n\'a pas encore de matières définies. Veuillez d\'abord ajouter des matières à la classe.');
        setShowErrorModal(true);
        return;
      }
      
      setSubjects(subjectsList);
      // Set first subject as default
      setFormData(prev => ({ ...prev, subjectId: subjectsList[0].id, isLevelSubject: subjectsList[0].isLevelSubject }));
    } catch (error: any) {
      console.error('Error loading class subjects:', error);
      setErrorMessage('Impossible de charger les matières de la classe');
      setShowErrorModal(true);
    }
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.subjectId) {
      setErrorMessage('Veuillez sélectionner une matière');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        dayOfWeek: formData.dayOfWeek,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        ...(formData.isLevelSubject 
          ? { levelSubjectId: formData.subjectId }
          : { streamSubjectId: formData.subjectId }
        ),
      };
      
      await apiClient.post(`/classes/${id}/schedule/time-slots`, payload);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating time slot:', error);
      setErrorMessage(error.message || 'Impossible de créer le créneau');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        variant='primary'
        title='Ajouter un créneau'
        centerTitle={true}
        showBackButton={true}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          {/* Subject */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Matière *</Text>
            <View style={styles.optionsGrid}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.optionButton,
                    formData.subjectId === subject.id && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, subjectId: subject.id, isLevelSubject: subject.isLevelSubject })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.subjectId === subject.id && styles.optionButtonTextActive,
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Day of Week */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Jour de la semaine *</Text>
            <View style={styles.optionsGrid}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.optionButton,
                    formData.dayOfWeek === day.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, dayOfWeek: day.value })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.dayOfWeek === day.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Heure de début *</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Clock size={20} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartTimeChange}
              />
            )}
          </View>

          {/* End Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Heure de fin *</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Clock size={20} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndTimeChange}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Ajout...' : 'Ajouter le créneau'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <StyledModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        type="success"
        title="Créneau ajouté!"
        message="Le créneau a été ajouté avec succès à l'emploi du temps."
        primaryButton={{
          text: 'OK',
          onPress: () => {
            setShowSuccessModal(false);
            router.back();
          },
        }}
      />

      {/* Error Modal */}
      <StyledModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Erreur"
        message={errorMessage}
        primaryButton={{
          text: 'OK',
          onPress: () => setShowErrorModal(false),
        }}
      />
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
  form: {
    gap: Spacing.lg,
  },
  formGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  timeButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 100,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
