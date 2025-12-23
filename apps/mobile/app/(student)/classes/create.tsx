import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Globe } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { CreateClassData } from '@/types/api';

const EDUCATION_LEVELS = [
  { 
    value: 'primary', 
    label: 'Primaire',
    subLevels: {
      francophone: [
        { value: 'SIL', label: 'SIL' },
        { value: 'CP', label: 'Préparatoire (CP)' },
        { value: 'CE1', label: 'CE1' },
        { value: 'CE2', label: 'CE2' },
        { value: 'CM1', label: 'CM1' },
        { value: 'CM2', label: 'CM2' },
      ],
      anglophone: [
        { value: 'Class1', label: 'Class 1' },
        { value: 'Class2', label: 'Class 2' },
        { value: 'Class3', label: 'Class 3' },
        { value: 'Class4', label: 'Class 4' },
        { value: 'Class5', label: 'Class 5' },
        { value: 'Class6', label: 'Class 6' },
      ],
    },
  },
  { 
    value: 'middle_school', 
    label: 'Collège',
    subLevels: {
      francophone_general: [
        { value: '6eme', label: '6ème' },
        { value: '5eme', label: '5ème' },
        { value: '4eme', label: '4ème' },
        { value: '3eme', label: '3ème' },
      ],
      francophone_technical: [
        { value: '1ere_annee', label: '1ère année', streams: ['F4', 'F5', 'F3', 'F7', 'MA'] },
        { value: '2eme_annee', label: '2ème année', streams: ['F4', 'F5', 'F3', 'F7', 'MA'] },
        { value: '3eme_annee', label: '3ème année', streams: ['F4', 'F5', 'F3', 'F7', 'MA'] },
        { value: '4eme_annee', label: '4ème année', streams: ['F4', 'F5', 'F3', 'F7', 'MA'] },
      ],
      anglophone: [
        { value: 'Form1', label: 'Form 1' },
        { value: 'Form2', label: 'Form 2' },
        { value: 'Form3', label: 'Form 3' },
        { value: 'Form4', label: 'Form 4' },
      ],
    },
  },
  { 
    value: 'high_school', 
    label: 'Lycée',
    subLevels: {
      francophone_general: [
        { value: '2nde', label: 'Seconde', streams: ['C', 'A', 'E'] },
        { value: '1ere', label: 'Première', streams: ['C', 'D', 'E', 'A', 'TI'] },
        { value: 'Tle', label: 'Terminale', streams: ['C', 'D', 'E', 'A', 'TI'] },
      ],
      francophone_technical: [
        { value: '2nde_tech', label: 'Seconde', streams: ['F4', 'F5', 'F3', 'F7', 'MA'] },
        { value: '1ere_tech', label: 'Première', streams: ['F4', 'F5', 'F3', 'F7', 'MA'] },
        { value: 'Tle_tech', label: 'Terminale', streams: ['F4', 'F5', 'F3', 'F7', 'MA'] },
      ],
      anglophone: [
        { value: 'Form5', label: 'Form 5' },
        { value: 'LowerSixth', label: 'Lower Sixth' },
        { value: 'UpperSixth', label: 'Upper Sixth' },
      ],
    },
  },
  { 
    value: 'university', 
    label: 'Université',
    subLevels: {
      licence: [
        { value: 'L1', label: 'Licence 1 (L1)' },
        { value: 'L2', label: 'Licence 2 (L2)' },
        { value: 'L3', label: 'Licence 3 (L3)' },
      ],
      master: [
        { value: 'M1', label: 'Master 1 (M1)' },
        { value: 'M2', label: 'Master 2 (M2)' },
      ],
    },
  },
];

const UNIVERSITY_STREAMS = [
  'Informatique',
  'Mathématiques',
  'Physique',
  'Chimie',
  'Biologie',
  'Médecine',
  'Droit',
  'Économie',
  'Gestion',
  'Lettres',
  'Sciences Sociales',
  'Ingénierie',
  'Architecture',
  'Autre',
];

const SUBJECTS = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Biologie',
  'Français',
  'Anglais',
  'Histoire',
  'Géographie',
  'Philosophie',
  'Économie',
  'Informatique',
];

export default function CreateClassScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    educationLevel: '',
    educationSystem: '', // francophone, anglophone, etc.
    specificLevel: '', // 6eme, CE1, etc.
    stream: '', // C, D, E, A, TI, F4, etc.
    subjects: [] as string[], // Multiple subjects
    maxStudents: '',
    meetingType: 'ONLINE' as 'ONLINE' | 'IN_PERSON',
    meetingLocation: '',
  });

  // Get available education systems based on selected level
  const getEducationSystems = () => {
    const level = EDUCATION_LEVELS.find(l => l.value === formData.educationLevel);
    if (!level || !level.subLevels) return [];
    return Object.keys(level.subLevels);
  };

  // Get available specific levels based on selected system
  const getSpecificLevels = () => {
    const level = EDUCATION_LEVELS.find(l => l.value === formData.educationLevel);
    if (!level || !level.subLevels) return [];
    const system = formData.educationSystem;
    const subLevels = level.subLevels as Record<string, any>;
    return subLevels[system] || [];
  };

  // Get available streams for selected level
  const getStreams = () => {
    const specificLevels = getSpecificLevels();
    const selectedLevel = specificLevels.find((l: any) => l.value === formData.specificLevel);
    if (selectedLevel && 'streams' in selectedLevel) {
      return selectedLevel.streams;
    }
    if (formData.educationLevel === 'university') {
      return UNIVERSITY_STREAMS;
    }
    return [];
  };

  // Reset dependent fields when parent selection changes
  const handleEducationLevelChange = (value: string) => {
    setFormData({
      ...formData,
      educationLevel: value,
      educationSystem: '',
      specificLevel: '',
      stream: '',
    });
  };

  const handleEducationSystemChange = (value: string) => {
    setFormData({
      ...formData,
      educationSystem: value,
      specificLevel: '',
      stream: '',
    });
  };

  const handleSpecificLevelChange = (value: string) => {
    setFormData({
      ...formData,
      specificLevel: value,
      stream: '',
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la classe');
      return;
    }
    if (!formData.educationLevel) {
      Alert.alert('Erreur', 'Veuillez sélectionner un niveau d\'éducation');
      return;
    }
    if (!formData.specificLevel) {
      Alert.alert('Erreur', 'Veuillez sélectionner un niveau spécifique');
      return;
    }
    if (formData.subjects.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une matière');
      return;
    }
    if (formData.meetingType === 'IN_PERSON' && !formData.meetingLocation.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un lieu de rencontre pour les cours en présentiel');
      return;
    }

    setLoading(true);
    try {
      const classData: CreateClassData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        educationLevel: {
          level: formData.educationLevel,
          system: formData.educationSystem || undefined,
          specificLevel: formData.specificLevel || undefined,
          stream: formData.stream || undefined,
        },
        subjects: formData.subjects, // Array of subjects
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
        meetingType: formData.meetingType,
        meetingLocation: formData.meetingLocation.trim() || undefined,
      };

      const response = await ApiClient.post<{ success: boolean; data: any }>(
        '/classes',
        classData
      );

      // API returns { success: true, data: ClassResponse }
      const classId = (response as any).data.id;

      // Propose to create schedule immediately
      Alert.alert(
        'Succès', 
        'Classe créée avec succès! Voulez-vous créer l\'emploi du temps maintenant?',
        [
          {
            text: 'Plus tard',
            style: 'cancel',
            onPress: () => router.push(`/classes/${classId}`),
          },
          {
            text: 'Créer l\'emploi du temps',
            onPress: () => router.push(`/classes/${classId}/schedule`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create class:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer la classe');
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
        <Text style={styles.headerTitle}>Créer une classe</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de la classe *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Groupe de Mathématiques"
                placeholderTextColor={Colors.textTertiary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez les objectifs de la classe..."
                placeholderTextColor={Colors.textTertiary}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Education Level */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Niveau d'éducation *</Text>
              <View style={styles.optionsGrid}>
                {EDUCATION_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.optionButton,
                      formData.educationLevel === level.value && styles.optionButtonActive,
                    ]}
                    onPress={() => handleEducationLevelChange(level.value)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        formData.educationLevel === level.value && styles.optionButtonTextActive,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Education System (if applicable) */}
            {formData.educationLevel && getEducationSystems().length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Système éducatif *</Text>
                <View style={styles.optionsGrid}>
                  {getEducationSystems().map((system) => (
                    <TouchableOpacity
                      key={system}
                      style={[
                        styles.optionButton,
                        formData.educationSystem === system && styles.optionButtonActive,
                      ]}
                      onPress={() => handleEducationSystemChange(system)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          formData.educationSystem === system && styles.optionButtonTextActive,
                        ]}
                      >
                        {system === 'francophone' ? 'Francophone' : 
                         system === 'anglophone' ? 'Anglophone' :
                         system === 'francophone_general' ? 'Général (Francophone)' :
                         system === 'francophone_technical' ? 'Technique (Francophone)' :
                         system === 'licence' ? 'Licence' :
                         system === 'master' ? 'Master' : system}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Specific Level */}
            {formData.educationSystem && getSpecificLevels().length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Niveau spécifique *</Text>
                <View style={styles.optionsGrid}>
                  {getSpecificLevels().map((level: any) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.optionButton,
                        formData.specificLevel === level.value && styles.optionButtonActive,
                      ]}
                      onPress={() => handleSpecificLevelChange(level.value)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          formData.specificLevel === level.value && styles.optionButtonTextActive,
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Stream/Filière (if applicable) */}
            {formData.specificLevel && getStreams().length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Filière {formData.educationLevel !== 'university' ? '(optionnel)' : '*'}</Text>
                <View style={styles.optionsGrid}>
                  {getStreams().map((stream: string) => (
                    <TouchableOpacity
                      key={stream}
                      style={[
                        styles.optionButton,
                        formData.stream === stream && styles.optionButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, stream })}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          formData.stream === stream && styles.optionButtonTextActive,
                        ]}
                      >
                        {stream}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Subject - Multiple Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Matières * (sélection multiple)</Text>
              <View style={styles.optionsGrid}>
                {SUBJECTS.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.optionButton,
                      formData.subjects.includes(subject) && styles.optionButtonActive,
                    ]}
                    onPress={() => {
                      if (formData.subjects.includes(subject)) {
                        // Remove subject
                        setFormData({
                          ...formData,
                          subjects: formData.subjects.filter(s => s !== subject),
                        });
                      } else {
                        // Add subject
                        setFormData({
                          ...formData,
                          subjects: [...formData.subjects, subject],
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        formData.subjects.includes(subject) && styles.optionButtonTextActive,
                      ]}
                    >
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Meeting Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Type de cours *</Text>
              <View style={styles.meetingTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.meetingTypeButton,
                    formData.meetingType === 'ONLINE' && styles.meetingTypeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, meetingType: 'ONLINE' })}
                >
                  <Globe
                    size={20}
                    color={formData.meetingType === 'ONLINE' ? Colors.white : Colors.primary}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.meetingTypeText,
                      formData.meetingType === 'ONLINE' && styles.meetingTypeTextActive,
                    ]}
                  >
                    En ligne
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.meetingTypeButton,
                    formData.meetingType === 'IN_PERSON' && styles.meetingTypeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, meetingType: 'IN_PERSON' })}
                >
                  <MapPin
                    size={20}
                    color={formData.meetingType === 'IN_PERSON' ? Colors.white : Colors.primary}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.meetingTypeText,
                      formData.meetingType === 'IN_PERSON' && styles.meetingTypeTextActive,
                    ]}
                  >
                    Présentiel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Meeting Location (if in-person) */}
            {formData.meetingType === 'IN_PERSON' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Lieu de rencontre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Bibliothèque municipale"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.meetingLocation}
                  onChangeText={(text) => setFormData({ ...formData, meetingLocation: text })}
                />
              </View>
            )}

            {/* Max Students */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre maximum d'étudiants (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 10"
                placeholderTextColor={Colors.textTertiary}
                value={formData.maxStudents}
                onChangeText={(text) => setFormData({ ...formData, maxStudents: text.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
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
              {loading ? 'Création...' : 'Créer la classe'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 60, // Status bar spacing
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
  meetingTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  meetingTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  meetingTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  meetingTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  meetingTypeTextActive: {
    color: Colors.white,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
