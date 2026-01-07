import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  GraduationCap,
  BookOpen,
  MapPin,
  Wallet,
  Globe,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Laptop,
  Home,
  RefreshCw,
} from 'lucide-react-native';
import { apiClient } from '@/utils/api-client';
import { fcfaToEur } from '@/utils/currency';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { REGIONS, getAllRegions } from '@/constants/regions';
import { StyledModal } from '@/components/ui/StyledModal';

const TEACHING_MODES = [
  { value: 'IN_PERSON', label: 'En présentiel', icon: Home },
  { value: 'ONLINE', label: 'En ligne', icon: Laptop },
  { value: 'BOTH', label: 'Les deux', icon: RefreshCw },
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

interface EducationSystem {
  id: string;
  name: string;
  country: {
    code: string;
    name: string;
  } | string;
}

interface EducationLevel {
  id: string;
  name: string;
  systemId: string;
  hasStreams: boolean;
}

interface EducationStream {
  id: string;
  name: string;
  levelId: string;
}

interface Subject {
  id: string;
  name: string;
  icon?: string;
}

interface OnboardingData {
  region: string;
  city: string;
  bio: string;
  experienceYears: string;
  educationSystemId: string;
  levelIds: string[];
  streamIds: string[];
  subjectIds: string[];
  languages: string[];
  teachingMode: string;
  hourlyRate: string;
  serviceRadius: string;
}

export default function TutorOnboardingScreen() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Education data from DB
  const [educationSystems, setEducationSystems] = useState<EducationSystem[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [educationStreams, setEducationStreams] = useState<EducationStream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [formData, setFormData] = useState<OnboardingData>({
    region: 'SN', // Default to Senegal
    city: '',
    bio: '',
    experienceYears: '',
    educationSystemId: '',
    levelIds: [],
    streamIds: [],
    subjectIds: [],
    languages: ['Français'],
    teachingMode: '',
    hourlyRate: '',
    serviceRadius: '',
  });

  const totalSteps = 6;
  const selectedRegion = REGIONS[formData.region];
  const selectedSystem = educationSystems.find(s => s.id === formData.educationSystemId);
  const availableLevels = educationLevels.filter(l => l.systemId === formData.educationSystemId);
  
  // Get streams for selected levels that have streams
  const selectedLevelsWithStreams = availableLevels.filter(
    l => formData.levelIds.includes(l.id) && l.hasStreams
  );
  const availableStreams = educationStreams.filter(
    s => selectedLevelsWithStreams.some(l => l.id === s.levelId)
  );

  useEffect(() => {
    loadEducationData();
  }, []);

  const loadEducationData = async () => {
    try {
      setDataLoading(true);
      
      // Load education systems
      const systemsResponse = await apiClient.get('/education/systems');
      console.log('Systems response:', systemsResponse);
      const systemsData = systemsResponse.data || systemsResponse;
      console.log('Systems data:', systemsData);
      setEducationSystems(Array.isArray(systemsData) ? systemsData : []);
      
      // Load all subjects
      const subjectsResponse = await apiClient.get('/education/subjects');
      console.log('Subjects response:', subjectsResponse);
      const subjectsData = subjectsResponse.data || subjectsResponse;
      console.log('Subjects data:', subjectsData);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      
    } catch (error) {
      console.error('Failed to load education data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données éducatives');
    } finally {
      setDataLoading(false);
    }
  };

  // Load levels when system is selected
  useEffect(() => {
    if (formData.educationSystemId) {
      console.log('Loading levels for system:', formData.educationSystemId);
      loadLevelsForSystem(formData.educationSystemId);
    } else {
      setEducationLevels([]);
    }
  }, [formData.educationSystemId]);

  // Load streams when levels are selected
  useEffect(() => {
    if (formData.levelIds.length > 0) {
      console.log('Loading streams for levels:', formData.levelIds);
      loadStreamsForLevels(formData.levelIds);
    } else {
      setEducationStreams([]);
    }
  }, [formData.levelIds]);

  const loadLevelsForSystem = async (systemId: string) => {
    try {
      console.log('Fetching levels for system:', systemId);
      const levelsResponse = await apiClient.get(`/education/systems/${systemId}/levels`);
      console.log('Levels response:', levelsResponse);
      const levelsData = levelsResponse.data || levelsResponse;
      console.log('Levels data:', levelsData);
      
      // Add systemId to each level since it's not returned by the API
      const levelsWithSystemId = Array.isArray(levelsData) 
        ? levelsData.map(level => ({ ...level, systemId }))
        : [];
      
      console.log('Levels with systemId:', levelsWithSystemId);
      setEducationLevels(levelsWithSystemId);
    } catch (error) {
      console.error('Failed to load levels:', error);
      setEducationLevels([]);
    }
  };

  const loadStreamsForLevels = async (levelIds: string[]) => {
    try {
      console.log('Fetching streams for levels:', levelIds);
      // Load streams for each level that has streams
      const streamsPromises = levelIds.map(levelId =>
        apiClient.get(`/education/levels/${levelId}/streams`)
          .then(res => {
            const data = res.data || res;
            console.log(`Streams for level ${levelId}:`, data);
            return Array.isArray(data) ? data : [];
          })
          .catch(err => {
            console.error(`Failed to load streams for level ${levelId}:`, err);
            return [];
          })
      );
      
      const streamsArrays = await Promise.all(streamsPromises);
      const allStreams = streamsArrays.flat();
      console.log('All streams:', allStreams);
      setEducationStreams(allStreams);
    } catch (error) {
      console.error('Failed to load streams:', error);
      setEducationStreams([]);
    }
  };

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleItem = (field: 'levelIds' | 'streamIds' | 'subjectIds' | 'languages', item: string) => {
    setFormData(prev => {
      const items = prev[field];
      const updated = items.includes(item)
        ? items.filter((i) => i !== item)
        : [...items, item];
      return { ...prev, [field]: updated };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.region && formData.city;
      case 2:
        return formData.bio.trim().length >= 50;
      case 3:
        return formData.educationSystemId && formData.levelIds.length > 0 && formData.subjectIds.length > 0;
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

      // Parse experience years from range to number
      const experienceYears = formData.experienceYears === '10+' ? 10 
        : formData.experienceYears === '0-1' ? 0
        : parseInt(formData.experienceYears.split('-')[0]) || 0;

      // Convert hourly rate from FCFA to EUR for storage
      const hourlyRateInEur = fcfaToEur(parseFloat(formData.hourlyRate));

      const profileData = {
        bio: formData.bio,
        experienceYears,
        hourlyRate: hourlyRateInEur, // Send in EUR
        // Use new structured format
        educationSystemId: formData.educationSystemId,
        levelIds: formData.levelIds,
        streamIds: formData.streamIds,
        subjectIds: formData.subjectIds,
        languages: formData.languages,
        teachingMode: formData.teachingMode,
        serviceRadius: formData.teachingMode !== 'ONLINE' ? parseInt(formData.serviceRadius) || null : null,
        diplomas: [],
      };

      console.log('📤 Submitting tutor profile:', JSON.stringify(profileData, null, 2));
      console.log('💰 Hourly rate: FCFA', formData.hourlyRate, '→ EUR', hourlyRateInEur);

      // Update user's city and countryCode
      console.log('📤 Updating user profile...');
      await apiClient.put('/profiles/me', {
        city: formData.city,
        countryCode: formData.region,
      });
      console.log('✅ User profile updated');

      // Create tutor profile
      console.log('📤 Creating/updating tutor profile...');
      const response = await apiClient.post('/profiles/tutor', profileData);
      console.log('✅ Tutor profile created/updated:', response);

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('❌ Failed to create profile:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      setErrorMessage(error.message || 'Impossible de créer votre profil');
      setShowErrorModal(true);
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
        <View style={styles.countriesGrid}>
          {getAllRegions().map((region) => (
            <TouchableOpacity
              key={region.code}
              style={[
                styles.countryCard,
                formData.region === region.code && styles.countryCardActive,
              ]}
              onPress={() => {
                updateField('region', region.code);
                updateField('city', '');
              }}
            >
              <View style={styles.countryIconBox}>
                <Globe size={24} color={formData.region === region.code ? Colors.white : Colors.primary} strokeWidth={2} />
              </View>
              <Text
                style={[
                  styles.countryName,
                  formData.region === region.code && styles.countryNameActive,
                ]}
              >
                {region.name}
              </Text>
              {formData.region === region.code && (
                <View style={styles.checkmark}>
                  <Check size={16} color={Colors.white} strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.region && (
        <View style={styles.section}>
          <Text style={styles.label}>Ville</Text>
          <View style={styles.citiesContainer}>
            {selectedRegion.cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.cityChip,
                  formData.city === city && styles.cityChipActive,
                ]}
                onPress={() => updateField('city', city)}
              >
                {formData.city === city && (
                  <Check size={14} color={Colors.white} strokeWidth={3} />
                )}
                <Text
                  style={[
                    styles.cityChipText,
                    formData.city === city && styles.cityChipTextActive,
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          <MapPin size={16} color={Colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.infoText}>
          Votre localisation aide les étudiants à vous trouver facilement
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
        <View style={styles.infoIconBox}>
          <User size={16} color={Colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.infoText}>
          Une bonne biographie augmente vos chances d'être choisi par les étudiants
        </Text>
      </View>
    </View>
  );

  const renderSubjectsStep = () => {
    if (dataLoading) {
      return (
        <View style={styles.stepContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <View style={styles.iconContainer}>
          <BookOpen size={48} color={Colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.stepTitle}>Enseignement</Text>
        <Text style={styles.stepDescription}>
          Sélectionnez votre système éducatif, les niveaux et matières que vous enseignez
        </Text>

        {/* Education System Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Système éducatif</Text>
          <View style={styles.systemsGrid}>
            {educationSystems.map((system) => (
              <TouchableOpacity
                key={system.id}
                style={[
                  styles.systemCard,
                  formData.educationSystemId === system.id && styles.systemCardActive,
                ]}
                onPress={() => {
                  updateField('educationSystemId', system.id);
                  updateField('levelIds', []); // Reset levels when system changes
                }}
              >
                <View style={styles.systemCardContent}>
                  <Text
                    style={[
                      styles.systemName,
                      formData.educationSystemId === system.id && styles.systemNameActive,
                    ]}
                  >
                    {system.name}
                  </Text>
                  <Text
                    style={[
                      styles.systemCountry,
                      formData.educationSystemId === system.id && styles.systemCountryActive,
                    ]}
                  >
                    {typeof system.country === 'string' ? system.country : system.country?.name}
                  </Text>
                </View>
                {formData.educationSystemId === system.id && (
                  <View style={styles.checkmark}>
                    <Check size={16} color={Colors.white} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Education Levels Selection */}
        {formData.educationSystemId && availableLevels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Niveaux d'enseignement</Text>
              {formData.levelIds.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{formData.levelIds.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.levelsGrid}>
              {availableLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelCard,
                    formData.levelIds.includes(level.id) && styles.levelCardActive,
                  ]}
                  onPress={() => toggleItem('levelIds', level.id)}
                >
                  {formData.levelIds.includes(level.id) && (
                    <View style={styles.levelCheckmark}>
                      <Check size={14} color={Colors.white} strokeWidth={3} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.levelName,
                      formData.levelIds.includes(level.id) && styles.levelNameActive,
                    ]}
                  >
                    {level.name}
                  </Text>
                  {level.hasStreams && (
                    <Text
                      style={[
                        styles.levelHint,
                        formData.levelIds.includes(level.id) && styles.levelHintActive,
                      ]}
                    >
                      + Filières
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Education Streams Selection */}
        {availableStreams.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Filières</Text>
              {formData.streamIds.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{formData.streamIds.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.helperText}>
              Sélectionnez les filières spécifiques que vous enseignez
            </Text>
            <View style={styles.streamsGrid}>
              {availableStreams.map((stream) => (
                <TouchableOpacity
                  key={stream.id}
                  style={[
                    styles.streamChip,
                    formData.streamIds.includes(stream.id) && styles.streamChipActive,
                  ]}
                  onPress={() => toggleItem('streamIds', stream.id)}
                >
                  {formData.streamIds.includes(stream.id) && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                  <Text
                    style={[
                      styles.streamChipText,
                      formData.streamIds.includes(stream.id) && styles.streamChipTextActive,
                    ]}
                  >
                    {stream.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Subjects Selection */}
        {subjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Matières enseignées</Text>
              {formData.subjectIds.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{formData.subjectIds.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.subjectsGrid}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectChip,
                    formData.subjectIds.includes(subject.id) && styles.subjectChipActive,
                  ]}
                  onPress={() => toggleItem('subjectIds', subject.id)}
                >
                  {formData.subjectIds.includes(subject.id) && (
                    <Check size={16} color={Colors.white} strokeWidth={3} />
                  )}
                  {subject.icon && (
                    <Text style={styles.subjectIcon}>{subject.icon}</Text>
                  )}
                  <Text
                    style={[
                      styles.subjectChipText,
                      formData.subjectIds.includes(subject.id) && styles.subjectChipTextActive,
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <BookOpen size={16} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.infoText}>
            Sélectionnez tous les niveaux et matières que vous maîtrisez pour maximiser vos opportunités
          </Text>
        </View>
      </View>
    );
  };

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
              <View style={[
                styles.teachingModeIconBox,
                formData.teachingMode === mode.value && styles.teachingModeIconBoxActive,
              ]}>
                <mode.icon 
                  size={24} 
                  color={formData.teachingMode === mode.value ? Colors.white : Colors.primary} 
                  strokeWidth={2} 
                />
              </View>
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
        <View style={styles.infoIconBox}>
          <GraduationCap size={16} color={Colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.infoText}>
          Après validation, vous pourrez ajouter vos diplômes et certifications
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
        message="Votre profil de tuteur a été créé avec succès. Vous pouvez maintenant commencer à enseigner!"
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/(tutor)/(tabs)/home');
        }}
        primaryButton={{
          text: 'Commencer',
          onPress: () => {
            setShowSuccessModal(false);
            router.replace('/(tutor)/(tabs)/home');
          },
        }}
      />

      {/* Error Modal */}
      <StyledModal
        visible={showErrorModal}
        type="error"
        title="Erreur"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
        primaryButton={{
          text: 'Réessayer',
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
  // Country cards styles
  countriesGrid: {
    gap: 12,
  },
  countryCard: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    ...Shadows.small,
  },
  countryCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.primary,
  },
  countryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  countryNameActive: {
    color: Colors.white,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Cities styles
  citiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    ...Shadows.small,
  },
  cityChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cityChipTextActive: {
    color: Colors.white,
  },
  cityScroll: {
    maxHeight: 300,
  },
  // System cards styles
  systemsGrid: {
    gap: 12,
  },
  systemCard: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    ...Shadows.small,
  },
  systemCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.primary,
  },
  systemCardContent: {
    flex: 1,
  },
  systemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  systemNameActive: {
    color: Colors.white,
  },
  systemCountry: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  systemCountryActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Section header with count
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  // Levels grid styles
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelCard: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: '30%',
    alignItems: 'center',
    position: 'relative',
    ...Shadows.small,
  },
  levelCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  levelCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  levelNameActive: {
    color: Colors.white,
  },
  levelHint: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  levelHintActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Streams grid styles
  streamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  streamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    ...Shadows.small,
  },
  streamChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  streamChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  streamChipTextActive: {
    color: Colors.white,
  },
  // Subjects grid styles (improved)
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
    ...Shadows.small,
  },
  subjectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subjectIcon: {
    fontSize: 16,
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
    gap: 12,
  },
  teachingModeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  teachingModeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teachingModeIconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
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
