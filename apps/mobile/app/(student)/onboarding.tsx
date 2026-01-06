import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  Globe,
} from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { StyledModal } from '@/components/ui/StyledModal';
import { fcfaToEur } from '@/utils/currency';
import {
  useCountries,
  useEducationSystems,
  useEducationLevels,
  useEducationStreams,
  useLevelSubjects,
  useStreamSubjects,
  type Country,
  type EducationSystem,
  type EducationLevel,
  type EducationStream,
  type LevelSubject,
} from '@/hooks/useEducation';

interface OnboardingData {
  countryCode: string;
  educationSystemId: string;
  educationLevelId: string;
  educationStreamId: string;
  schoolName: string;
  preferredLevelSubjectIds: string[];
  preferredStreamSubjectIds: string[];
  parentEmail: string;
  parentPhone: string;
  budgetPerHour: string;
}

export default function StudentOnboardingScreen() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    countryCode: '',
    educationSystemId: '',
    educationLevelId: '',
    educationStreamId: '',
    schoolName: '',
    preferredLevelSubjectIds: [],
    preferredStreamSubjectIds: [],
    parentEmail: '',
    parentPhone: '',
    budgetPerHour: '',
  });

  // Fetch data using hooks
  const { countries, loading: countriesLoading, error: countriesError } = useCountries();
  const { systems, loading: systemsLoading, error: systemsError } = useEducationSystems(formData.countryCode);
  const { levels, loading: levelsLoading, error: levelsError } = useEducationLevels(formData.educationSystemId);
  const { streams, loading: streamsLoading, error: streamsError } = useEducationStreams(formData.educationLevelId);
  
  // Get selected level to check if it has streams
  const selectedLevel = levels.find(l => l.id === formData.educationLevelId);
  const hasStreams = selectedLevel?.hasStreams || false;
  
  // Fetch subjects based on whether level has streams or not
  const { subjects: levelSubjects, loading: levelSubjectsLoading, error: levelSubjectsError } = useLevelSubjects(
    hasStreams ? undefined : formData.educationLevelId
  );
  const { subjects: streamSubjects, loading: streamSubjectsLoading, error: streamSubjectsError } = useStreamSubjects(
    hasStreams ? formData.educationStreamId : undefined
  );
  
  // Use the appropriate subjects list and selected IDs
  const availableSubjects = hasStreams ? streamSubjects : levelSubjects;
  const subjectsLoading = hasStreams ? streamSubjectsLoading : levelSubjectsLoading;
  const subjectsError = hasStreams ? streamSubjectsError : levelSubjectsError;
  const selectedSubjectIds = hasStreams ? formData.preferredStreamSubjectIds : formData.preferredLevelSubjectIds;

  const totalSteps = 5;

  // Get selected data
  const selectedCountry = countries.find(c => c.code === formData.countryCode);
  const selectedSystem = systems.find(s => s.id === formData.educationSystemId);
  const selectedStream = streams.find(s => s.id === formData.educationStreamId);

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  const toggleSubject = (subjectId: string) => {
    if (hasStreams) {
      // Toggle stream subject
      setFormData(prev => {
        const subjects = prev.preferredStreamSubjectIds.includes(subjectId)
          ? prev.preferredStreamSubjectIds.filter((s) => s !== subjectId)
          : [...prev.preferredStreamSubjectIds, subjectId];
        return { ...prev, preferredStreamSubjectIds: subjects };
      });
    } else {
      // Toggle level subject
      setFormData(prev => {
        const subjects = prev.preferredLevelSubjectIds.includes(subjectId)
          ? prev.preferredLevelSubjectIds.filter((s) => s !== subjectId)
          : [...prev.preferredLevelSubjectIds, subjectId];
        return { ...prev, preferredLevelSubjectIds: subjects };
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.countryCode && formData.educationSystemId && formData.educationLevelId;
      case 2:
        return formData.schoolName.trim().length > 0;
      case 3:
        return selectedSubjectIds.length > 0;
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

      // Prepare subject data based on whether level has streams
      const subjectData = hasStreams 
        ? { preferredStreamSubjectIds: formData.preferredStreamSubjectIds }
        : { preferredLevelSubjectIds: formData.preferredLevelSubjectIds };

      // Convert budget from FCFA to EUR for backend
      const budgetInEur = formData.budgetPerHour ? fcfaToEur(parseFloat(formData.budgetPerHour)) : null;

      const profileData = {
        educationSystemId: formData.educationSystemId,
        educationLevelId: formData.educationLevelId,
        educationStreamId: formData.educationStreamId || null,
        schoolName: formData.schoolName,
        ...subjectData,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
        budgetPerHour: budgetInEur,
      };

      await apiClient.post('/profiles/student', profileData);

      // Refresh profile context to update onboarding status
      console.log('🔄 Refreshing profile after onboarding...');
      
      // Wait a bit for the backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowSuccessModal(true);
    } catch (error: any) {
      const message = error?.message || (typeof error === 'string' ? error : 'Impossible de créer votre profil');
      setErrorMessage(message);
      setShowErrorModal(true);
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
      <View style={styles.stepHeader}>
        <GraduationCap size={40} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Votre niveau d'études</Text>
        <Text style={styles.stepDescription}>
          Sélectionnez votre pays, système éducatif et niveau actuel
        </Text>
      </View>

      {/* Country Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pays *</Text>
        {countriesLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : countriesError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>❌ Erreur: {countriesError}</Text>
          </View>
        ) : countries.length === 0 ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ Aucun pays disponible</Text>
          </View>
        ) : (
          <View style={styles.selectList}>
            {countries.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={[
                  styles.selectItem,
                  formData.countryCode === country.code && styles.selectItemActive,
                ]}
                onPress={() => {
                  updateField('countryCode', country.code);
                  updateField('educationSystemId', '');
                  updateField('educationLevelId', '');
                  updateField('educationStreamId', '');
                }}
              >
                <Text
                  style={[
                    styles.selectItemText,
                    formData.countryCode === country.code && styles.selectItemTextActive,
                  ]}
                >
                  {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Education System Selection */}
      {formData.countryCode && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Système éducatif *</Text>
          {systemsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : systemsError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>❌ Erreur: {systemsError}</Text>
            </View>
          ) : systems.length === 0 ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>⚠️ Aucun système éducatif disponible pour ce pays</Text>
            </View>
          ) : (
            <View style={styles.selectList}>
              {systems.map((system) => (
                <TouchableOpacity
                  key={system.id}
                  style={[
                    styles.selectItem,
                    formData.educationSystemId === system.id && styles.selectItemActive,
                  ]}
                  onPress={() => {
                    updateField('educationSystemId', system.id);
                    updateField('educationLevelId', '');
                    updateField('educationStreamId', '');
                  }}
                >
                  <Text
                    style={[
                      styles.selectItemText,
                      formData.educationSystemId === system.id && styles.selectItemTextActive,
                    ]}
                  >
                    {system.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Education Level Selection */}
      {formData.educationSystemId && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Niveau *</Text>
          {levelsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : levelsError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>❌ Erreur: {levelsError}</Text>
            </View>
          ) : levels.length === 0 ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>⚠️ Aucun niveau disponible pour ce système</Text>
            </View>
          ) : (
            <View style={styles.selectList}>
              {levels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.selectItem,
                    formData.educationLevelId === level.id && styles.selectItemActive,
                  ]}
                  onPress={() => {
                    updateField('educationLevelId', level.id);
                    updateField('educationStreamId', '');
                  }}
                >
                  <Text
                    style={[
                      styles.selectItemText,
                      formData.educationLevelId === level.id && styles.selectItemTextActive,
                    ]}
                  >
                    {level.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Stream Selection (if applicable) */}
      {formData.educationLevelId && hasStreams && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Filière (optionnel)</Text>
          {streamsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : streamsError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>❌ Erreur: {streamsError}</Text>
            </View>
          ) : (
            <View style={styles.selectList}>
              {streams.map((stream) => (
                <TouchableOpacity
                  key={stream.id}
                  style={[
                    styles.selectItem,
                    formData.educationStreamId === stream.id && styles.selectItemActive,
                  ]}
                  onPress={() => updateField('educationStreamId', stream.id)}
                >
                  <Text
                    style={[
                      styles.selectItemText,
                      formData.educationStreamId === stream.id && styles.selectItemTextActive,
                    ]}
                  >
                    {stream.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderSchoolStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <School size={40} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Votre établissement</Text>
        <Text style={styles.stepDescription}>
          Indiquez le nom de votre école ou université
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Nom de l'établissement *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Lycée Blaise Diagne"
          placeholderTextColor={Colors.textTertiary}
          value={formData.schoolName}
          onChangeText={(text) => updateField('schoolName', text)}
          autoCapitalize="words"
        />
      </View>
    </View>
  );

  const renderSubjectsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <BookOpen size={40} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Matières préférées</Text>
        <Text style={styles.stepDescription}>
          Sélectionnez les matières dans lesquelles vous souhaitez progresser
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Matières sélectionnées ({selectedSubjectIds.length})
        </Text>
        {subjectsLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : subjectsError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>❌ Erreur: {subjectsError}</Text>
          </View>
        ) : availableSubjects.length === 0 ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              ⚠️ Aucune matière disponible {hasStreams ? 'pour cette filière' : 'pour ce niveau'}
            </Text>
          </View>
        ) : (
          <View style={styles.subjectsGrid}>
            {availableSubjects.map((levelSubject) => (
              <TouchableOpacity
                key={levelSubject.id}
                style={[
                  styles.subjectChip,
                  selectedSubjectIds.includes(levelSubject.id) && styles.subjectChipActive,
                ]}
                onPress={() => toggleSubject(levelSubject.id)}
              >
                {selectedSubjectIds.includes(levelSubject.id) && (
                  <Check size={16} color={Colors.white} strokeWidth={3} />
                )}
                <Text
                  style={[
                    styles.subjectChipText,
                    selectedSubjectIds.includes(levelSubject.id) && styles.subjectChipTextActive,
                  ]}
                >
                  {levelSubject.subject.icon && `${levelSubject.subject.icon} `}
                  {levelSubject.subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💡 Ces matières nous aident à vous proposer les meilleurs tuteurs
        </Text>
      </View>
    </View>
  );

  const renderParentStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Users size={40} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Contact des parents</Text>
        <Text style={styles.stepDescription}>
          Ces informations sont optionnelles mais recommandées pour les mineurs
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Email du parent/tuteur</Text>
        <TextInput
          style={styles.input}
          placeholder="parent@example.com"
          placeholderTextColor={Colors.textTertiary}
          value={formData.parentEmail}
          onChangeText={(text) => updateField('parentEmail', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Téléphone du parent/tuteur</Text>
        <TextInput
          style={styles.input}
          placeholder="+221 XX XXX XX XX"
          placeholderTextColor={Colors.textTertiary}
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
      <View style={styles.stepHeader}>
        <Wallet size={40} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Budget horaire</Text>
        <Text style={styles.stepDescription}>
          Indiquez votre budget approximatif par heure de cours (optionnel)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Budget par heure (FCFA)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 7000"
          placeholderTextColor={Colors.textTertiary}
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

      {/* Success Modal */}
      <StyledModal
        visible={showSuccessModal}
        type="success"
        title="Bienvenue! 🎉"
        message="Votre profil a été créé avec succès. Vous pouvez maintenant commencer à apprendre!"
        primaryButton={{
          text: 'Commencer',
          onPress: () => {
            if (isRedirecting) return;
            setIsRedirecting(true);
            setShowSuccessModal(false);
            // Force a small delay to ensure state updates
            setTimeout(() => {
              router.replace('/(student)/(tabs)/home');
            }, 100);
          },
        }}
        showCloseButton={false}
      />

      {/* Error Modal */}
      <StyledModal
        visible={showErrorModal}
        type="error"
        title="Erreur"
        message={errorMessage}
        primaryButton={{
          text: 'OK',
          onPress: () => setShowErrorModal(false),
        }}
      />
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
    paddingBottom: 16,
    backgroundColor: Colors.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: Colors.white,
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
  stepHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  selectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectItem: {
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
  selectItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  selectItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  selectItemTextActive: {
    color: Colors.white,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -4,
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
    backgroundColor: Colors.secondary + '15',
    padding: 16,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: '#ff000010',
    padding: 16,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: '#ff000030',
  },
  errorText: {
    fontSize: 13,
    color: '#cc0000',
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.large,
    gap: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.large,
    gap: 6,
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
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
