import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Camera, 
  User as UserIcon, 
  MapPin, 
  BookOpen,
  Check,
  Globe,
  GraduationCap,
  Home,
  Briefcase,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { fcfaToEur, eurToFcfa } from '@/utils/currency';
import { StyledModal } from '@/components/ui/StyledModal';
import { useModal } from '@/hooks/useModal';
import { PageHeader } from '@/components/PageHeader';
import { Ionicons } from '@expo/vector-icons';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  experienceYears: string;
  hourlyRate: string;
  educationSystemId: string;
  levelIds: string[];
  streamIds: string[];
  subjectIds: string[];
  languages: string[];
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius: string;
}

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

const TEACHING_MODES = [
  { value: 'IN_PERSON', label: 'En présentiel', icon: Home },
  { value: 'ONLINE', label: 'En ligne', icon: Globe },
  { value: 'BOTH', label: 'Les deux', icon: GraduationCap },
];

const EXPERIENCE_RANGES = ['0-1', '1-3', '3-5', '5-10', '10+'];

// Convert numeric experience to range
const getExperienceRange = (years: number): string => {
  if (years <= 1) return '0-1';
  if (years <= 3) return '1-3';
  if (years <= 5) return '3-5';
  if (years <= 10) return '5-10';
  return '10+';
};

// Convert range to numeric (middle of range for storage)
const getRangeMiddle = (range: string): number => {
  if (range === '0-1') return 0;
  if (range === '1-3') return 2;
  if (range === '3-5') return 4;
  if (range === '5-10') return 7;
  if (range === '10+') return 10;
  return 0;
};

export default function TutorEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  const [educationSystems, setEducationSystems] = useState<any[]>([]);
  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [educationStreams, setEducationStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    experienceYears: '',
    hourlyRate: '',
    educationSystemId: '',
    levelIds: [],
    streamIds: [],
    subjectIds: [],
    languages: ['Français'],
    teachingMode: 'BOTH',
    serviceRadius: '',
  });

  const availableLevels = educationLevels.filter(l => l.systemId === formData.educationSystemId);
  
  const selectedLevelsWithStreams = availableLevels.filter(
    l => formData.levelIds.includes(l.id) && l.hasStreams
  );
  const availableStreams = educationStreams.filter(
    s => selectedLevelsWithStreams.some(l => l.id === s.levelId)
  );

  // Filter subjects to only show those available for selected levels
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (formData.educationSystemId) {
      loadLevelsForSystem(formData.educationSystemId);
    } else {
      setEducationLevels([]);
    }
  }, [formData.educationSystemId]);

  useEffect(() => {
    if (formData.levelIds.length > 0) {
      loadStreamsForLevels(formData.levelIds);
      loadSubjectsForLevels(formData.levelIds);
    } else {
      setEducationStreams([]);
      setAvailableSubjects([]);
    }
  }, [formData.levelIds]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      const systemsResponse = await apiClient.get('/education/systems');
      const systemsData = Array.isArray(systemsResponse.data) ? systemsResponse.data : systemsResponse;
      setEducationSystems(systemsData);
      
      const subjectsResponse = await apiClient.get('/education/subjects');
      const subjectsData = Array.isArray(subjectsResponse.data) ? subjectsResponse.data : subjectsResponse;
      setSubjects(subjectsData);
      
      const userResponse = await apiClient.get(`/profiles/user/${user?.id}`);
      const userData = userResponse.data;
      
      const profileResponse = await apiClient.get(`/profiles/tutor/${user?.id}`);
      const profile = profileResponse.data;
      
      console.log('📊 Loaded profile:', {
        experienceYears: profile.experienceYears,
        teachingSubjectsCount: profile.teachingSubjects?.length,
        teachingLanguagesCount: profile.teachingLanguages?.length,
      });
      
      setAvatarUri(userData.avatarUrl);
      
      const teachingSubjects = profile.teachingSubjects || [];
      const teachingLanguages = profile.teachingLanguages || [];
      
      const systemIds = new Set<string>();
      const levelIds = new Set<string>();
      const subjectIds = new Set<string>();
      
      teachingSubjects.forEach((ts: any) => {
        const levelSubject = ts.levelSubject;
        if (levelSubject) {
          if (levelSubject.level?.systemId) systemIds.add(levelSubject.level.systemId);
          if (levelSubject.levelId) levelIds.add(levelSubject.levelId);
          if (levelSubject.subjectId) subjectIds.add(levelSubject.subjectId);
        }
      });
      
      console.log('🎯 Extracted IDs:', {
        systemIds: Array.from(systemIds),
        levelIds: Array.from(levelIds),
        subjectIds: Array.from(subjectIds),
      });
      
      const languageNames = teachingLanguages.map((tl: any) => tl.teachingLanguage?.name).filter(Boolean);
      
      const systemId = Array.from(systemIds)[0] || '';
      
      // Load levels for the system before setting form data
      if (systemId) {
        const levelsResponse = await apiClient.get(`/education/systems/${systemId}/levels`);
        const levelsData = levelsResponse.data || levelsResponse;
        const levelsWithSystemId = Array.isArray(levelsData) 
          ? levelsData.map(level => ({ ...level, systemId }))
          : [];
        setEducationLevels(levelsWithSystemId);
        
        console.log('📖 Available levels:', levelsWithSystemId.map(l => ({ id: l.id, name: l.name })));
      }
      
      console.log('📚 Available subjects:', subjectsData.map((s: any) => ({ id: s.id, name: s.name })));
      
      const extractedLevelIds = Array.from(levelIds);
      const extractedSubjectIds = Array.from(subjectIds);
      
      console.log('✅ Setting form data with:', {
        levelIds: extractedLevelIds,
        subjectIds: extractedSubjectIds,
        languages: languageNames,
      });
      
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        bio: profile.bio || '',
        experienceYears: profile.experienceYears !== null && profile.experienceYears !== undefined 
          ? getExperienceRange(profile.experienceYears) 
          : '0-1',
        hourlyRate: profile.hourlyRate ? eurToFcfa(Number(profile.hourlyRate)).toString() : '',
        educationSystemId: systemId,
        levelIds: extractedLevelIds,
        streamIds: [],
        subjectIds: extractedSubjectIds,
        languages: languageNames.length > 0 ? languageNames : ['Français'],
        teachingMode: profile.teachingMode || 'BOTH',
        serviceRadius: profile.serviceRadius ? profile.serviceRadius.toString() : '',
      });
    } catch (error: any) {
      console.error('❌ Failed to load profile:', error);
      showError('Erreur', error.message || 'Impossible de charger le profil');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLevelsForSystem = async (systemId: string) => {
    try {
      const levelsResponse = await apiClient.get(`/education/systems/${systemId}/levels`);
      const levelsData = levelsResponse.data || levelsResponse;
      const levelsWithSystemId = Array.isArray(levelsData) 
        ? levelsData.map(level => ({ ...level, systemId }))
        : [];
      setEducationLevels(levelsWithSystemId);
    } catch (error) {
      console.error('Failed to load levels:', error);
      setEducationLevels([]);
    }
  };

  const loadStreamsForLevels = async (levelIds: string[]) => {
    try {
      const streamsPromises = levelIds.map(levelId =>
        apiClient.get(`/education/levels/${levelId}/streams`)
          .then(res => Array.isArray(res.data) ? res.data : res)
          .catch(() => [])
      );
      const streamsArrays = await Promise.all(streamsPromises);
      setEducationStreams(streamsArrays.flat());
    } catch (error) {
      console.error('Failed to load streams:', error);
      setEducationStreams([]);
    }
  };

  const loadSubjectsForLevels = async (levelIds: string[]) => {
    try {
      // Get all LevelSubjects for the selected levels
      const levelSubjectsPromises = levelIds.map(levelId =>
        apiClient.get(`/education/levels/${levelId}/subjects`)
          .then(res => Array.isArray(res.data) ? res.data : res)
          .catch(() => [])
      );
      const levelSubjectsArrays = await Promise.all(levelSubjectsPromises);
      const allLevelSubjects = levelSubjectsArrays.flat();
      
      // Get all streams for the selected levels
      const streamsPromises = levelIds.map(levelId =>
        apiClient.get(`/education/levels/${levelId}/streams`)
          .then(res => Array.isArray(res.data) ? res.data : res)
          .catch(() => [])
      );
      const streamsArrays = await Promise.all(streamsPromises);
      const allStreams = streamsArrays.flat();
      
      // Get all StreamSubjects for the streams
      const streamSubjectsPromises = allStreams.map((stream: any) =>
        apiClient.get(`/education/streams/${stream.id}/subjects`)
          .then(res => Array.isArray(res.data) ? res.data : res)
          .catch(() => [])
      );
      const streamSubjectsArrays = await Promise.all(streamSubjectsPromises);
      const allStreamSubjects = streamSubjectsArrays.flat();
      
      // Extract unique subject IDs from both LevelSubjects and StreamSubjects
      const subjectIds = new Set<string>();
      allLevelSubjects.forEach((ls: any) => {
        if (ls.subjectId) subjectIds.add(ls.subjectId);
      });
      allStreamSubjects.forEach((ss: any) => {
        if (ss.subjectId) subjectIds.add(ss.subjectId);
      });
      
      // Filter subjects to only show those available for selected levels (deduplicated)
      const filtered = subjects.filter(s => subjectIds.has(s.id));
      setAvailableSubjects(filtered);
      
      console.log('📚 Available subjects for selected levels (including streams):', {
        levelSubjectsCount: allLevelSubjects.length,
        streamSubjectsCount: allStreamSubjects.length,
        uniqueSubjectsCount: filtered.length,
        subjects: filtered.map(s => s.name),
      });
    } catch (error) {
      console.error('Failed to load subjects for levels:', error);
      setAvailableSubjects([]);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showError('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const updateField = (field: keyof ProfileData, value: any) => {
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

  const handleSave = async () => {
    try {
      setIsSaving(true);

      console.log('💾 Saving profile with data:', {
        experienceYears: formData.experienceYears,
        levelIds: formData.levelIds,
        subjectIds: formData.subjectIds,
        languages: formData.languages,
      });

      await apiClient.put('/profiles/me', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      if (avatarUri && avatarUri !== user?.avatarUrl) {
        await apiClient.post('/profiles/me/avatar', { avatarUrl: avatarUri });
      }

      const hourlyRateInEur = fcfaToEur(parseFloat(formData.hourlyRate));
      const experienceYearsNumeric = getRangeMiddle(formData.experienceYears);

      const profileData = {
        bio: formData.bio,
        experienceYears: experienceYearsNumeric,
        hourlyRate: hourlyRateInEur,
        educationSystemId: formData.educationSystemId,
        levelIds: formData.levelIds,
        streamIds: formData.streamIds,
        subjectIds: formData.subjectIds,
        languages: formData.languages,
        teachingMode: formData.teachingMode,
        serviceRadius: formData.serviceRadius ? parseInt(formData.serviceRadius) : null,
      };

      console.log('📤 Sending profile data:', profileData);

      const response = await apiClient.put('/profiles/tutor', profileData);
      
      console.log('✅ Profile updated successfully:', response);

      showSuccess('Succès', 'Profil mis à jour avec succès', () => router.back());
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      showError('Erreur', error.message || 'Échec de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Modifier le profil" 
        variant='primary'
        showBackButton 
        centerTitle
        rightElement={
          <TouchableOpacity 
            style={styles.saveHeaderButton} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name='checkmark' size={24} color={Colors.white} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSaving}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.cameraButton}>
              <Camera size={18} color={Colors.white} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <UserIcon size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Entrez votre prénom"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Entrez votre nom"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Entrez votre numéro"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Briefcase size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Informations professionnelles</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => updateField('bio', text)}
              placeholder="Décrivez votre expérience..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Années d'expérience</Text>
            <View style={styles.experienceGrid}>
              {EXPERIENCE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.experienceCard,
                    formData.experienceYears === range && styles.experienceCardActive,
                  ]}
                  onPress={() => updateField('experienceYears', range)}
                >
                  <Text
                    style={[
                      styles.experienceText,
                      formData.experienceYears === range && styles.experienceTextActive,
                    ]}
                  >
                    {range} {range === '10+' ? 'ans' : range === '0-1' ? 'an' : 'ans'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tarif horaire (FCFA)</Text>
            <TextInput
              style={styles.input}
              value={formData.hourlyRate}
              onChangeText={(text) => updateField('hourlyRate', text)}
              placeholder="Ex: 10000"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Système éducatif</Text>
          </View>
          
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
                  updateField('levelIds', []);
                }}
              >
                <Text
                  style={[
                    styles.systemName,
                    formData.educationSystemId === system.id && styles.systemNameActive,
                  ]}
                >
                  {system.name}
                </Text>
                {formData.educationSystemId === system.id && (
                  <View style={styles.checkmark}>
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {formData.educationSystemId && availableLevels.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <GraduationCap size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.cardTitle}>Niveaux d'enseignement</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formData.levelIds.length}</Text>
              </View>
            </View>
            
            <View style={styles.chipsGrid}>
              {availableLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.chip,
                    formData.levelIds.includes(level.id) && styles.chipActive,
                  ]}
                  onPress={() => toggleItem('levelIds', level.id)}
                >
                  {formData.levelIds.includes(level.id) && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      formData.levelIds.includes(level.id) && styles.chipTextActive,
                    ]}
                  >
                    {level.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {availableStreams.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.cardTitle}>Filières</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formData.streamIds.length}</Text>
              </View>
            </View>
            
            <View style={styles.chipsGrid}>
              {availableStreams.map((stream) => (
                <TouchableOpacity
                  key={stream.id}
                  style={[
                    styles.chip,
                    formData.streamIds.includes(stream.id) && styles.chipActive,
                  ]}
                  onPress={() => toggleItem('streamIds', stream.id)}
                >
                  {formData.streamIds.includes(stream.id) && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      formData.streamIds.includes(stream.id) && styles.chipTextActive,
                    ]}
                  >
                    {stream.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {availableSubjects.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.cardTitle}>Matières enseignées</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formData.subjectIds.length}</Text>
              </View>
            </View>
            
            <View style={styles.chipsGrid}>
              {availableSubjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.chip,
                    formData.subjectIds.includes(subject.id) && styles.chipActive,
                  ]}
                  onPress={() => toggleItem('subjectIds', subject.id)}
                >
                  {formData.subjectIds.includes(subject.id) && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                  {subject.icon && (
                    <Text style={styles.subjectIcon}>{subject.icon}</Text>
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      formData.subjectIds.includes(subject.id) && styles.chipTextActive,
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Globe size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Langues parlées</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formData.languages.length}</Text>
            </View>
          </View>
          
          <View style={styles.chipsGrid}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.chip,
                  formData.languages.includes(language) && styles.chipActive,
                ]}
                onPress={() => toggleItem('languages', language)}
              >
                {formData.languages.includes(language) && (
                  <Check size={14} color={Colors.white} strokeWidth={3} />
                )}
                <Text
                  style={[
                    styles.chipText,
                    formData.languages.includes(language) && styles.chipTextActive,
                  ]}
                >
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <MapPin size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Mode d'enseignement</Text>
          </View>
          
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
                    size={22} 
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

          {formData.teachingMode !== 'ONLINE' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rayon de déplacement (km)</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceRadius}
                onChangeText={(text) => updateField('serviceRadius', text)}
                placeholder="Ex: 10"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                Distance maximale que vous êtes prêt à parcourir
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <StyledModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButton={modalState.primaryButton}
        secondaryButton={modalState.secondaryButton}
        onClose={hideModal}
      />

      {isSaving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.savingTitle}>Mise à jour en cours...</Text>
            <Text style={styles.savingText}>
              Nous enregistrons vos modifications{'\n'}
              Veuillez patienter quelques instants
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  saveHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: 20,
    marginBottom: 16,
    ...Shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bgCream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  experienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  experienceCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  experienceCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  experienceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  experienceTextActive: {
    color: Colors.white,
  },
  systemsGrid: {
    gap: 12,
  },
  systemCard: {
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  systemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  systemNameActive: {
    color: Colors.white,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  subjectIcon: {
    fontSize: 14,
  },
  teachingModeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  teachingModeCard: {
    flex: 1,
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  teachingModeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  teachingModeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teachingModeIconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  teachingModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  teachingModeTextActive: {
    color: Colors.white,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  savingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
    ...Shadows.large,
  },
  savingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  savingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
