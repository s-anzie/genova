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
import { router } from 'expo-router';
import { 
  GraduationCap, 
  School, 
  BookOpen, 
  Target, 
  Users, 
  Wallet,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';

const EDUCATION_SYSTEMS = [
  { value: 'FRENCH', label: 'Système Français' },
  { value: 'SENEGALESE', label: 'Système Sénégalais' },
  { value: 'INTERNATIONAL', label: 'International' },
  { value: 'OTHER', label: 'Autre' },
];

const EDUCATION_LEVELS = {
  FRENCH: [
    'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale',
    'Licence', 'Master', 'Doctorat',
  ],
  SENEGALESE: [
    'CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale',
    'Licence', 'Master', 'Doctorat',
  ],
  INTERNATIONAL: [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
    'Grade 10', 'Grade 11', 'Grade 12',
    'Undergraduate', 'Graduate', 'Postgraduate',
  ],
  OTHER: ['Autre'],
};

const SERIES = {
  Seconde: ['Générale', 'Technologique', 'Professionnelle'],
  Première: ['Générale', 'Technologique', 'Professionnelle', 'L', 'ES', 'S'],
  Terminale: ['Générale', 'Technologique', 'Professionnelle', 'L', 'ES', 'S'],
};

const SUBJECTS = [
  'Mathématiques',
  'Physique-Chimie',
  'SVT',
  'Français',
  'Anglais',
  'Espagnol',
  'Allemand',
  'Histoire-Géographie',
  'Philosophie',
  'Économie',
  'Informatique',
  'Arts',
  'Musique',
  'Sport',
];

interface OnboardingData {
  educationSystem: string;
  educationLevel: string;
  series?: string;
  schoolName: string;
  learningGoals: string;
  preferredSubjects: string[];
  parentEmail: string;
  parentPhone: string;
  budgetPerHour: string;
}

export default function StudentOnboardingScreen() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    educationSystem: '',
    educationLevel: '',
    series: '',
    schoolName: '',
    learningGoals: '',
    preferredSubjects: [],
    parentEmail: '',
    parentPhone: '',
    budgetPerHour: '',
  });

  const totalSteps = 5;

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleSubject = (subject: string) => {
    const subjects = formData.preferredSubjects.includes(subject)
      ? formData.preferredSubjects.filter((s) => s !== subject)
      : [...formData.preferredSubjects, subject];
    updateField('preferredSubjects', subjects);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.educationSystem && formData.educationLevel;
      case 2:
        return formData.schoolName.trim().length > 0;
      case 3:
        return formData.preferredSubjects.length > 0;
      case 4:
        return true; // Parent info is optional
      case 5:
        return true; // Budget is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const educationDetails = {
        system: formData.educationSystem,
        level: formData.educationLevel,
        ...(formData.series && { series: formData.series }),
      };

      const profileData = {
        educationLevel: formData.educationLevel,
        educationDetails,
        schoolName: formData.schoolName,
        learningGoals: formData.learningGoals || null,
        preferredSubjects: formData.preferredSubjects,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
        budgetPerHour: formData.budgetPerHour ? parseFloat(formData.budgetPerHour) : null,
        onboardingCompleted: true,
      };

      await apiClient.post('/profiles/student', profileData);

      Alert.alert(
        'Bienvenue! 🎉',
        'Votre profil a été créé avec succès. Vous pouvez maintenant commencer à apprendre!',
        [
          {
            text: 'Commencer',
            onPress: () => router.replace('/(student)/(tabs)/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create profile:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer votre profil');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderEducationStep();
      case 2:
        return renderSchoolStep();
      case 3:
        return renderSubjectsStep();
      case 4:
        return renderParentStep();
      case 5:
        return renderBudgetStep();
      default:
        return null;
    }
  };

  const renderEducationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <GraduationCap size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Votre niveau d'études</Text>
      <Text style={styles.stepDescription}>
        Sélectionnez votre système éducatif et votre niveau actuel
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Système éducatif</Text>
        <View style={styles.optionsGrid}>
          {EDUCATION_SYSTEMS.map((system) => (
            <TouchableOpacity
              key={system.value}
              style={[
                styles.optionCard,
                formData.educationSystem === system.value && styles.optionCardActive,
              ]}
              onPress={() => {
                updateField('educationSystem', system.value);
                updateField('educationLevel', '');
                updateField('series', '');
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.educationSystem === system.value && styles.optionTextActive,
                ]}
              >
                {system.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.educationSystem && (
        <View style={styles.section}>
          <Text style={styles.label}>Niveau</Text>
          <ScrollView style={styles.levelScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsGrid}>
              {EDUCATION_LEVELS[formData.educationSystem as keyof typeof EDUCATION_LEVELS]?.map(
                (level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionCard,
                      formData.educationLevel === level && styles.optionCardActive,
                    ]}
                    onPress={() => updateField('educationLevel', level)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.educationLevel === level && styles.optionTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {formData.educationLevel &&
        SERIES[formData.educationLevel as keyof typeof SERIES] && (
          <View style={styles.section}>
            <Text style={styles.label}>Série (optionnel)</Text>
            <View style={styles.optionsGrid}>
              {SERIES[formData.educationLevel as keyof typeof SERIES].map((serie) => (
                <TouchableOpacity
                  key={serie}
                  style={[
                    styles.optionCard,
                    formData.series === serie && styles.optionCardActive,
                  ]}
                  onPress={() => updateField('series', serie)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.series === serie && styles.optionTextActive,
                    ]}
                  >
                    {serie}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
    </View>
  );

  const renderSchoolStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <School size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Votre établissement</Text>
      <Text style={styles.stepDescription}>
        Indiquez le nom de votre école ou université
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Nom de l'établissement</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Lycée Blaise Diagne"
          value={formData.schoolName}
          onChangeText={(text) => updateField('schoolName', text)}
          autoCapitalize="words"
        />
      </View>
    </View>
  );

  const renderSubjectsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <BookOpen size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Matières préférées</Text>
      <Text style={styles.stepDescription}>
        Sélectionnez les matières dans lesquelles vous souhaitez progresser
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Matières ({formData.preferredSubjects.length})</Text>
        <View style={styles.subjectsGrid}>
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectChip,
                formData.preferredSubjects.includes(subject) && styles.subjectChipActive,
              ]}
              onPress={() => toggleSubject(subject)}
            >
              {formData.preferredSubjects.includes(subject) && (
                <Check size={16} color={Colors.white} strokeWidth={3} />
              )}
              <Text
                style={[
                  styles.subjectChipText,
                  formData.preferredSubjects.includes(subject) && styles.subjectChipTextActive,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Objectifs d'apprentissage (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ex: Améliorer mes notes en maths, préparer le bac..."
          value={formData.learningGoals}
          onChangeText={(text) => updateField('learningGoals', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderParentStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Users size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Contact des parents</Text>
      <Text style={styles.stepDescription}>
        Ces informations sont optionnelles mais recommandées pour les mineurs
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Email du parent/tuteur</Text>
        <TextInput
          style={styles.input}
          placeholder="parent@example.com"
          value={formData.parentEmail}
          onChangeText={(text) => updateField('parentEmail', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Téléphone du parent/tuteur</Text>
        <TextInput
          style={styles.input}
          placeholder="+221 XX XXX XX XX"
          value={formData.parentPhone}
          onChangeText={(text) => updateField('parentPhone', text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💡 Ces informations permettent de tenir vos parents informés de votre progression
        </Text>
      </View>
    </View>
  );

  const renderBudgetStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Wallet size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Budget horaire</Text>
      <Text style={styles.stepDescription}>
        Indiquez votre budget approximatif par heure de cours (optionnel)
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Budget par heure (FCFA)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 5000"
          value={formData.budgetPerHour}
          onChangeText={(text) => updateField('budgetPerHour', text)}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>
          Cela nous aide à vous proposer des tuteurs adaptés à votre budget
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💡 Vous pourrez modifier ces informations à tout moment dans votre profil
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Étape {currentStep} sur {totalSteps}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <ChevronLeft size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
            currentStep === 1 && styles.nextButtonFull,
          ]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === totalSteps ? 'Terminer' : 'Suivant'}
          </Text>
          {currentStep < totalSteps && (
            <ChevronRight size={20} color={Colors.white} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.large,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  optionCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  optionTextActive: {
    color: Colors.white,
  },
  levelScroll: {
    maxHeight: 300,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  subjectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subjectChipTextActive: {
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: BorderRadius.large,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: Colors.white,
    ...Shadows.medium,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.large,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.large,
    gap: 8,
    ...Shadows.primary,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    ...Shadows.small,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
