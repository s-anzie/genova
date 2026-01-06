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
  BookOpen,
  MapPin,
  Wallet,
  Globe,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
} from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { REGIONS, getAllRegions, formatPhoneNumber, validatePhoneNumber } from '@/constants/regions';

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

const EDUCATION_LEVELS = [
  'Primaire',
  'Collège',
  'Lycée',
  'Supérieur',
  'Professionnel',
];

const TEACHING_MODES = [
  { value: 'IN_PERSON', label: 'En présentiel', icon: '🏠' },
  { value: 'ONLINE', label: 'En ligne', icon: '💻' },
  { value: 'BOTH', label: 'Les deux', icon: '🔄' },
];

const LANGUAGES = [
  'Français',
  'Anglais',
  'Espagnol',
  'Allemand',
  'Arabe',
  'Wolof',
  'Pulaar',
  'Serer',
  'Dioula',
  'Ewondo',
  'Duala',
];

interface OnboardingData {
  region: string;
  city: string;
  bio: string;
  experienceYears: string;
  subjects: string[];
  educationLevels: string[];
  languages: string[];
  teachingMode: string;
  hourlyRate: string;
  serviceRadius: string;
}

export default function TutorOnboardingScreen() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    region: 'SN', // Default to Senegal
    city: '',
    bio: '',
    experienceYears: '',
    subjects: [],
    educationLevels: [],
    languages: ['Français'],
    teachingMode: '',
    hourlyRate: '',
    serviceRadius: '',
  });

  const totalSteps = 6;
  const selectedRegion = REGIONS[formData.region];

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleItem = (field: 'subjects' | 'educationLevels' | 'languages', item: string) => {
    const items = formData[field];
    const updated = items.includes(item)
      ? items.filter((i) => i !== item)
      : [...items, item];
    updateField(field, updated);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.region && formData.city;
      case 2:
        return formData.bio.trim().length >= 50;
      case 3:
        return formData.subjects.length > 0 && formData.educationLevels.length > 0;
      case 4:
        return formData.languages.length > 0;
      case 5:
        return formData.teachingMode && formData.hourlyRate;
      case 6:
        return formData.experienceYears;
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

      const profileData = {
        bio: formData.bio,
        experienceYears: parseInt(formData.experienceYears) || 0,
        hourlyRate: parseFloat(formData.hourlyRate),
        subjects: formData.subjects,
        educationLevels: formData.educationLevels,
        languages: formData.languages,
        teachingMode: formData.teachingMode,
        serviceRadius: formData.teachingMode !== 'ONLINE' ? parseInt(formData.serviceRadius) || null : null,
        diplomas: [],
        availability: {},
        onboardingCompleted: true,
      };

      // Update user's city, country, and countryCode
      await apiClient.put('/users/profile', {
        city: formData.city,
        country: selectedRegion.name,
        countryCode: formData.region, // Save the ISO country code
      });

      // Create tutor profile
      await apiClient.post('/profiles/tutor', profileData);

      Alert.alert(
        'Bienvenue! 🎉',
        'Votre profil de tuteur a été créé avec succès. Vous pouvez maintenant commencer à enseigner!',
        [
          {
            text: 'Commencer',
            onPress: () => router.replace('/(tutor)/(tabs)/home'),
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
        return renderLocationStep();
      case 2:
        return renderBioStep();
      case 3:
        return renderSubjectsStep();
      case 4:
        return renderLanguagesStep();
      case 5:
        return renderTeachingStep();
      case 6:
        return renderExperienceStep();
      default:
        return null;
    }
  };

  const renderLocationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <MapPin size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Votre localisation</Text>
      <Text style={styles.stepDescription}>
        Sélectionnez votre pays et votre ville
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Pays</Text>
        <View style={styles.optionsGrid}>
          {getAllRegions().map((region) => (
            <TouchableOpacity
              key={region.code}
              style={[
                styles.optionCard,
                formData.region === region.code && styles.optionCardActive,
              ]}
              onPress={() => {
                updateField('region', region.code);
                updateField('city', '');
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.region === region.code && styles.optionTextActive,
                ]}
              >
                {region.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.region && (
        <View style={styles.section}>
          <Text style={styles.label}>Ville</Text>
          <ScrollView style={styles.cityScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsGrid}>
              {selectedRegion.cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.optionCard,
                    formData.city === city && styles.optionCardActive,
                  ]}
                  onPress={() => updateField('city', city)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.city === city && styles.optionTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          📍 Votre localisation aide les étudiants à vous trouver facilement
        </Text>
      </View>
    </View>
  );

  const renderBioStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <User size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Présentez-vous</Text>
      <Text style={styles.stepDescription}>
        Décrivez votre parcours et votre approche pédagogique
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>
          Biographie ({formData.bio.length}/500 caractères)
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Parlez de votre expérience, vos méthodes d'enseignement, vos réussites..."
          value={formData.bio}
          onChangeText={(text) => updateField('bio', text.slice(0, 500))}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
        {formData.bio.length < 50 && (
          <Text style={styles.helperText}>
            Minimum 50 caractères ({50 - formData.bio.length} restants)
          </Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💡 Une bonne biographie augmente vos chances d'être choisi par les étudiants
        </Text>
      </View>
    </View>
  );

  const renderSubjectsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <BookOpen size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Matières et niveaux</Text>
      <Text style={styles.stepDescription}>
        Sélectionnez les niveaux et matières que vous pouvez enseigner
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Niveaux d'enseignement ({formData.educationLevels.length})</Text>
        <View style={styles.subjectsGrid}>
          {EDUCATION_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.subjectChip,
                formData.educationLevels.includes(level) && styles.subjectChipActive,
              ]}
              onPress={() => toggleItem('educationLevels', level)}
            >
              {formData.educationLevels.includes(level) && (
                <Check size={16} color={Colors.white} strokeWidth={3} />
              )}
              <Text
                style={[
                  styles.subjectChipText,
                  formData.educationLevels.includes(level) && styles.subjectChipTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Matières enseignées ({formData.subjects.length})</Text>
        <View style={styles.subjectsGrid}>
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectChip,
                formData.subjects.includes(subject) && styles.subjectChipActive,
              ]}
              onPress={() => toggleItem('subjects', subject)}
            >
              {formData.subjects.includes(subject) && (
                <Check size={16} color={Colors.white} strokeWidth={3} />
              )}
              <Text
                style={[
                  styles.subjectChipText,
                  formData.subjects.includes(subject) && styles.subjectChipTextActive,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💡 Sélectionnez tous les niveaux et matières que vous maîtrisez pour maximiser vos opportunités
        </Text>
      </View>
    </View>
  );

  const renderLanguagesStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Globe size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Langues parlées</Text>
      <Text style={styles.stepDescription}>
        Sélectionnez les langues dans lesquelles vous pouvez enseigner
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Langues ({formData.languages.length})</Text>
        <View style={styles.subjectsGrid}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language}
              style={[
                styles.subjectChip,
                formData.languages.includes(language) && styles.subjectChipActive,
              ]}
              onPress={() => toggleItem('languages', language)}
            >
              {formData.languages.includes(language) && (
                <Check size={16} color={Colors.white} strokeWidth={3} />
              )}
              <Text
                style={[
                  styles.subjectChipText,
                  formData.languages.includes(language) && styles.subjectChipTextActive,
                ]}
              >
                {language}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTeachingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Wallet size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Mode et tarif</Text>
      <Text style={styles.stepDescription}>
        Définissez votre mode d'enseignement et votre tarif horaire
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Mode d'enseignement</Text>
        <View style={styles.teachingModeGrid}>
          {TEACHING_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.teachingModeCard,
                formData.teachingMode === mode.value && styles.teachingModeCardActive,
              ]}
              onPress={() => updateField('teachingMode', mode.value)}
            >
              <Text style={styles.teachingModeIcon}>{mode.icon}</Text>
              <Text
                style={[
                  styles.teachingModeText,
                  formData.teachingMode === mode.value && styles.teachingModeTextActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.teachingMode && formData.teachingMode !== 'ONLINE' && (
        <View style={styles.section}>
          <Text style={styles.label}>Rayon de déplacement (km)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 10"
            value={formData.serviceRadius}
            onChangeText={(text) => updateField('serviceRadius', text)}
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            Distance maximale que vous êtes prêt à parcourir
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Tarif horaire ({selectedRegion.currency.symbol})</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 5000"
          value={formData.hourlyRate}
          onChangeText={(text) => updateField('hourlyRate', text)}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>
          Tarif recommandé: 3000-10000 {selectedRegion.currency.symbol}/heure
        </Text>
      </View>
    </View>
  );

  const renderExperienceStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <GraduationCap size={48} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.stepTitle}>Votre expérience</Text>
      <Text style={styles.stepDescription}>
        Indiquez votre expérience en tant qu'enseignant
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Années d'expérience</Text>
        <View style={styles.experienceGrid}>
          {['0-1', '1-3', '3-5', '5-10', '10+'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.optionCard,
                formData.experienceYears === range && styles.optionCardActive,
              ]}
              onPress={() => updateField('experienceYears', range)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.experienceYears === range && styles.optionTextActive,
                ]}
              >
                {range} {range === '10+' ? 'ans' : range === '0-1' ? 'an' : 'ans'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💡 Après validation, vous pourrez ajouter vos diplômes et certifications
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
    minHeight: 150,
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
    position: 'relative',
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
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cityScroll: {
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
  teachingModeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  teachingModeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.large,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  teachingModeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  teachingModeIcon: {
    fontSize: 32,
  },
  teachingModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  teachingModeTextActive: {
    color: Colors.white,
  },
  experienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
