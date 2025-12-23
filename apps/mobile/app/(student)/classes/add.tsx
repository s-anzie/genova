import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';

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
  const [subjects, setSubjects] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    loadClassSubjects();
  }, [id]);

  const loadClassSubjects = async () => {
    try {
      const response = await apiClient.get(`/classes/${id}`);
      const classSubjects = response.data.subjects || [];
      
      if (classSubjects.length === 0) {
        Alert.alert(
          'Aucune matière',
          'Cette classe n\'a pas encore de matières définies. Veuillez d\'abord ajouter des matières à la classe.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      setSubjects(classSubjects);
      // Set first subject as default
      setFormData(prev => ({ ...prev, subject: classSubjects[0] }));
    } catch (error: any) {
      console.error('Error loading class subjects:', error);
      Alert.alert('Erreur', 'Impossible de charger les matières de la classe');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.subject) {
      Alert.alert('Erreur', 'Veuillez sélectionner une matière');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      Alert.alert('Erreur', 'Veuillez entrer les heures de début et de fin');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.startTime) || !timeRegex.test(formData.endTime)) {
      Alert.alert('Erreur', 'Format d\'heure invalide. Utilisez HH:MM (ex: 14:00)');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/classes/${id}/schedule/time-slots`, formData);
      Alert.alert('Succès', 'Créneau ajouté avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating time slot:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer le créneau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un créneau</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          {/* Subject */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Matière *</Text>
            <View style={styles.optionsGrid}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.optionButton,
                    formData.subject === subject && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, subject })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.subject === subject && styles.optionButtonTextActive,
                    ]}
                  >
                    {subject}
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
            <Text style={styles.label}>Heure de début * (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="14:00"
              placeholderTextColor={Colors.textTertiary}
              value={formData.startTime}
              onChangeText={(text) => setFormData({ ...formData, startTime: text })}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* End Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Heure de fin * (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="16:00"
              placeholderTextColor={Colors.textTertiary}
              value={formData.endTime}
              onChangeText={(text) => setFormData({ ...formData, endTime: text })}
              keyboardType="numbers-and-punctuation"
            />
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
