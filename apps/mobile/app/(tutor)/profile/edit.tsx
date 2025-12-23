import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Camera, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Home,
  GraduationCap,
  BookOpen,
  Target,
  DollarSign,
  Check,
  X,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { ApiClient } from '@/utils/api';
import { Colors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import type { UserResponse, TutorProfileResponse } from '@/types/api';

// Education levels with their available systems and teaching types
const EDUCATION_LEVELS = [
  { 
    value: 'primary', 
    label: 'Primaire',
    systems: [
      { value: 'francophone', label: 'Francophone', teachingTypes: [] },
      { value: 'anglophone', label: 'Anglophone', teachingTypes: [] },
    ],
  },
  { 
    value: 'middle_school', 
    label: 'Collège',
    systems: [
      { value: 'francophone', label: 'Francophone', teachingTypes: ['Général', 'Technique'] },
      { value: 'anglophone', label: 'Anglophone', teachingTypes: [] },
    ],
  },
  { 
    value: 'high_school', 
    label: 'Lycée',
    systems: [
      { value: 'francophone', label: 'Francophone', teachingTypes: ['Général', 'Technique'] },
      { value: 'anglophone', label: 'Anglophone', teachingTypes: ['Science', 'Literature'] },
    ],
  },
  { 
    value: 'higher', 
    label: 'Supérieur',
    systems: [], // No system for higher education
  },
];

// Classes per level, system, and teaching type
const CLASSES: Record<string, any> = {
  primary: {
    francophone: {
      default: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    },
    anglophone: {
      default: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'],
    },
  },
  middle_school: {
    francophone: {
      Général: ['6ème', '5ème', '4ème', '3ème'],
      Technique: {
        '1ére A': ['ESF', 'STT', 'STI', 'STG'],
        '2ème A': ['ESF', 'STT', 'STI', 'STG'],
        '3ème A': ['ESF', 'STT', 'STI', 'STG'],
        '4ème A': ['ESF', 'STT', 'STI', 'STG'],
      },
    },
    anglophone: {
      default: ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'],
    },
  },
  high_school: {
    francophone: {
      Général: {
        Seconde: ['C', 'A', 'E'],
        Première: ['C', 'D', 'E', 'A'],
        Terminale: ['C', 'D', 'E', 'A'],
      },
      Technique: {
        Seconde: ['F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3'],
        Première: ['F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3'],
        Terminale: ['F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3'],
      },
    },
    anglophone: {
      Science: ['Lower Sixth', 'Upper Sixth'],
      Literature: ['Lower Sixth', 'Upper Sixth'],
    },
  },
  higher: {
    default: {
      default: ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat'],
    },
  },
};

const SUBJECTS = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Biologie',
  'Anglais',
  'Français',
  'Espagnol',
  'Histoire',
  'Géographie',
  'Informatique',
  'Économie',
  'Philosophie',
];

interface LevelConfig {
  level: string;
  system?: string; // Optional, not present for higher education
  teachingType?: string; // Optional, depends on level and system
  selectedClasses: Record<string, string[]>; // For Général lycée: { Seconde: ['C', 'A'], Première: ['C', 'D'] }
  classes: string[]; // For other levels: simple array
}

interface SubjectTeaching {
  subject: string;
  selectedLevels: string[]; // Multiple levels can be selected
  levelConfigs: LevelConfig[]; // One config per selected level
}

export default function TutorEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Tutor profile data - restructured
  const [tutorData, setTutorData] = useState({
    bio: '',
    experienceYears: '',
    hourlyRate: '',
    subjectTeachings: [] as SubjectTeaching[],
    teachingMode: 'BOTH' as 'IN_PERSON' | 'ONLINE' | 'BOTH',
    serviceRadius: '',
  });

  // Track which class is expanded for series selection
  const [expandedClasses, setExpandedClasses] = useState<Record<string, string | null>>({});
  
  // Track which subject teaching cards are expanded
  const [expandedSubjects, setExpandedSubjects] = useState<Record<number, boolean>>({});

  // User data
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Load user data
      const userResponse = await ApiClient.get<{ success: boolean; data: UserResponse }>(`/profiles/user/${user?.id}`);
      
      const userData = userResponse.data;
      setUserData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        country: userData.country || '',
      });
      setAvatarUri(userData.avatarUrl);

      // Load tutor profile
      const profileResponse = await ApiClient.get<{ success: boolean; data: TutorProfileResponse }>(`/profiles/tutor/${user?.id}`);
      
      const profile = profileResponse.data;
        
        // Convert flat subjects/educationLevels to structured format
        const subjectTeachings: SubjectTeaching[] = [];
        
        // Try to load from detailed data first
        if (profile.teachingSkillsDetails) {
          try {
            const details = JSON.parse(profile.teachingSkillsDetails);
            details.forEach((detail: any) => {
              subjectTeachings.push({
                subject: detail.subject,
                selectedLevels: detail.levelConfigs.map((c: any) => c.level),
                levelConfigs: detail.levelConfigs.map((c: any) => ({
                  level: c.level,
                  system: c.system,
                  teachingType: c.teachingType,
                  classes: c.classes || [],
                  selectedClasses: c.selectedClasses || {},
                })),
              });
            });
          } catch (e) {
            console.error('Failed to parse teachingSkillsDetails:', e);
          }
        }
        
        // Fallback to old format if no detailed data
        if (subjectTeachings.length === 0 && profile.subjects && profile.subjects.length > 0) {
          profile.subjects.forEach(subject => {
            subjectTeachings.push({
              subject,
              selectedLevels: [],
              levelConfigs: [],
            });
          });
        }
        
        // If no subjects yet, start with empty array (user will add)
        setTutorData({
          bio: profile.bio || '',
          experienceYears: profile.experienceYears && profile.experienceYears > 0 ? profile.experienceYears.toString() : '',
          hourlyRate: profile.hourlyRate && parseFloat(profile.hourlyRate.toString()) > 0 ? profile.hourlyRate.toString() : '',
          subjectTeachings: subjectTeachings.length > 0 ? subjectTeachings : [],
          teachingMode: profile.teachingMode || 'BOTH',
          serviceRadius: profile.serviceRadius ? profile.serviceRadius.toString() : '',
        });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      console.error('Error details:', error.message, error.stack);
      Alert.alert('Error', 'Failed to load profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie pour télécharger une photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const addSubjectTeaching = () => {
    setTutorData({
      ...tutorData,
      subjectTeachings: [
        ...tutorData.subjectTeachings,
        { subject: '', selectedLevels: [], levelConfigs: [] },
      ],
    });
  };

  const removeSubjectTeaching = (index: number) => {
    setTutorData({
      ...tutorData,
      subjectTeachings: tutorData.subjectTeachings.filter((_, i) => i !== index),
    });
  };

  const updateSubjectTeaching = (index: number, field: keyof SubjectTeaching, value: any) => {
    const updated = [...tutorData.subjectTeachings];
    updated[index] = { ...updated[index], [field]: value };
    setTutorData({ ...tutorData, subjectTeachings: updated });
  };

  const toggleLevel = (subjectIndex: number, levelValue: string) => {
    const updated = [...tutorData.subjectTeachings];
    const teaching = updated[subjectIndex];
    
    if (teaching.selectedLevels.includes(levelValue)) {
      // Remove level and its config
      teaching.selectedLevels = teaching.selectedLevels.filter(l => l !== levelValue);
      teaching.levelConfigs = teaching.levelConfigs.filter(c => c.level !== levelValue);
    } else {
      // Add level and create a config for it
      teaching.selectedLevels.push(levelValue);
      teaching.levelConfigs.push({
        level: levelValue,
        system: undefined,
        teachingType: undefined,
        selectedClasses: {},
        classes: [],
      });
    }
    
    setTutorData({ ...tutorData, subjectTeachings: updated });
  };

  const updateLevelConfig = (subjectIndex: number, levelValue: string, field: keyof LevelConfig, value: any) => {
    const updated = [...tutorData.subjectTeachings];
    const config = updated[subjectIndex].levelConfigs.find(c => c.level === levelValue);
    
    if (!config) return;
    
    if (field === 'system') {
      // Reset dependent fields when system changes
      config.system = value;
      config.teachingType = undefined;
      config.selectedClasses = {};
      config.classes = [];
    } else if (field === 'teachingType') {
      // Reset classes when teaching type changes
      config.teachingType = value;
      config.selectedClasses = {};
      config.classes = [];
    } else {
      (config as any)[field] = value;
    }
    
    setTutorData({ ...tutorData, subjectTeachings: updated });
  };

  const toggleClass = (subjectIndex: number, levelValue: string, className: string) => {
    const updated = [...tutorData.subjectTeachings];
    const config = updated[subjectIndex].levelConfigs.find(c => c.level === levelValue);
    
    if (!config) return;
    
    if (config.classes.includes(className)) {
      config.classes = config.classes.filter(c => c !== className);
    } else {
      config.classes.push(className);
    }
    
    setTutorData({ ...tutorData, subjectTeachings: updated });
  };

  const toggleSerie = (subjectIndex: number, levelValue: string, className: string, serie: string) => {
    const updated = [...tutorData.subjectTeachings];
    const config = updated[subjectIndex].levelConfigs.find(c => c.level === levelValue);
    
    if (!config) return;
    
    if (!config.selectedClasses[className]) {
      config.selectedClasses[className] = [];
    }
    
    if (config.selectedClasses[className].includes(serie)) {
      config.selectedClasses[className] = config.selectedClasses[className].filter(s => s !== serie);
      // Remove class if no series selected
      if (config.selectedClasses[className].length === 0) {
        delete config.selectedClasses[className];
      }
    } else {
      config.selectedClasses[className].push(serie);
    }
    
    setTutorData({ ...tutorData, subjectTeachings: updated });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update user data
      await ApiClient.put(`/profiles/me`, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        postalCode: userData.postalCode,
        country: userData.country,
      });

      // Upload avatar if changed
      if (avatarUri && avatarUri !== user?.avatarUrl) {
        await ApiClient.post(`/profiles/me/avatar`, { avatarUrl: avatarUri });
      }

      // Update tutor profile
      const hourlyRate = parseFloat(tutorData.hourlyRate);
      
      if (!tutorData.hourlyRate || isNaN(hourlyRate) || hourlyRate < 5 || hourlyRate > 500) {
        Alert.alert('Erreur de validation', 'Le tarif horaire doit être entre 5 et 500€');
        setIsSaving(false);
        return;
      }

      // Validate teaching skills
      if (tutorData.subjectTeachings.length === 0) {
        Alert.alert('Erreur de validation', 'Vous devez ajouter au moins une matière enseignée');
        setIsSaving(false);
        return;
      }

      for (let i = 0; i < tutorData.subjectTeachings.length; i++) {
        const teaching = tutorData.subjectTeachings[i];
        if (!teaching.subject) {
          Alert.alert('Erreur de validation', `Matière ${i + 1}: Veuillez sélectionner une matière`);
          setIsSaving(false);
          return;
        }
        if (teaching.selectedLevels.length === 0) {
          Alert.alert('Erreur de validation', `Matière ${i + 1}: Veuillez sélectionner au moins un niveau`);
          setIsSaving(false);
          return;
        }
        
        for (const config of teaching.levelConfigs) {
          const levelData = EDUCATION_LEVELS.find(l => l.value === config.level);
          const levelLabel = levelData?.label || config.level;
          
          // Check if system is required for this level
          if (levelData && levelData.systems.length > 0 && !config.system) {
            Alert.alert('Erreur de validation', `Matière ${i + 1}, ${levelLabel}: Veuillez sélectionner un système`);
            setIsSaving(false);
            return;
          }
          
          if (config.classes.length === 0 && Object.keys(config.selectedClasses).length === 0) {
            Alert.alert('Erreur de validation', `Matière ${i + 1}, ${levelLabel}: Veuillez sélectionner au moins une classe`);
            setIsSaving(false);
            return;
          }
        }
      }

      // Convert structured format back to flat arrays for API (backward compatibility)
      const subjects = Array.from(new Set(tutorData.subjectTeachings.map(st => st.subject).filter(s => s)));
      const educationLevels = Array.from(new Set(
        tutorData.subjectTeachings.flatMap(st => st.levelConfigs.map(c => c.level)).filter(l => l)
      ));

      // Prepare detailed teaching skills data
      const teachingSkillsDetails = tutorData.subjectTeachings.map(teaching => ({
        subject: teaching.subject,
        levelConfigs: teaching.levelConfigs.map(config => ({
          level: config.level,
          system: config.system,
          teachingType: config.teachingType,
          classes: config.classes,
          selectedClasses: config.selectedClasses,
        })),
      }));

      const tutorUpdateData = {
        bio: tutorData.bio || undefined,
        experienceYears: tutorData.experienceYears ? parseInt(tutorData.experienceYears) : undefined,
        hourlyRate,
        subjects,
        educationLevels,
        teachingMode: tutorData.teachingMode,
        serviceRadius: tutorData.serviceRadius ? parseFloat(tutorData.serviceRadius) : undefined,
        teachingSkillsDetails: JSON.stringify(teachingSkillsDetails), // Store as JSON string
      };

      await ApiClient.put(`/profiles/tutor`, tutorUpdateData);

      Alert.alert('Succès', 'Profil mis à jour avec succès');
      router.back();
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      console.error('Error details:', error.message, error.stack);
      Alert.alert('Erreur', error.message || 'Échec de la mise à jour du profil');
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <X size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Check size={24} color={Colors.white} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData.firstName?.[0]}{userData.lastName?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.cameraButton}>
              <Camera size={20} color={Colors.white} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Appuyez pour changer la photo</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <UserIcon size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={userData.firstName}
                onChangeText={(text) => setUserData({ ...userData, firstName: text })}
                placeholder="Entrez votre prénom"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <UserIcon size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={userData.lastName}
                onChangeText={(text) => setUserData({ ...userData, lastName: text })}
                placeholder="Entrez votre nom"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Phone size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={userData.phone}
                onChangeText={(text) => setUserData({ ...userData, phone: text })}
                placeholder="Entrez votre numéro"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Home size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={userData.address}
                onChangeText={(text) => setUserData({ ...userData, address: text })}
                placeholder="Entrez votre adresse"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <View style={styles.inputIcon}>
                <MapPin size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={userData.city}
                  onChangeText={(text) => setUserData({ ...userData, city: text })}
                  placeholder="Ville"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <View style={styles.inputIcon}>
                <Mail size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Code postal</Text>
                <TextInput
                  style={styles.input}
                  value={userData.postalCode}
                  onChangeText={(text) => setUserData({ ...userData, postalCode: text })}
                  placeholder="Code"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <MapPin size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Pays</Text>
              <TextInput
                style={styles.input}
                value={userData.country}
                onChangeText={(text) => setUserData({ ...userData, country: text })}
                placeholder="Entrez votre pays"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Tutor Profile */}
        <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations professionnelles</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={tutorData.bio}
                  onChangeText={(text) => setTutorData({ ...tutorData, bio: text })}
                  placeholder="Décrivez votre expérience et votre approche pédagogique"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Années d'expérience</Text>
                <TextInput
                  style={styles.input}
                  value={tutorData.experienceYears}
                  onChangeText={(text) => setTutorData({ ...tutorData, experienceYears: text })}
                  placeholder="ex: 5"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tarif horaire (€) *</Text>
                <TextInput
                  style={styles.input}
                  value={tutorData.hourlyRate}
                  onChangeText={(text) => setTutorData({ ...tutorData, hourlyRate: text })}
                  placeholder="Entre 5 et 500"
                  keyboardType="numeric"
                />
                <Text style={styles.hint}>Doit être entre 5€ et 500€</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mode d'enseignement</Text>
                <View style={styles.modeContainer}>
                  {[
                    { value: 'IN_PERSON', label: 'En personne' },
                    { value: 'ONLINE', label: 'En ligne' },
                    { value: 'BOTH', label: 'Les deux' },
                  ].map((mode) => (
                    <TouchableOpacity
                      key={mode.value}
                      style={[
                        styles.modeButton,
                        tutorData.teachingMode === mode.value && styles.modeButtonActive,
                      ]}
                      onPress={() =>
                        setTutorData({
                          ...tutorData,
                          teachingMode: mode.value as 'IN_PERSON' | 'ONLINE' | 'BOTH',
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.modeButtonText,
                          tutorData.teachingMode === mode.value && styles.modeButtonTextActive,
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(tutorData.teachingMode === 'IN_PERSON' || tutorData.teachingMode === 'BOTH') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Rayon de service (km, optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    value={tutorData.serviceRadius}
                    onChangeText={(text) => setTutorData({ ...tutorData, serviceRadius: text })}
                    placeholder="ex: 10"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BookOpen size={22} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Matières enseignées</Text>
              </View>
              
              <Text style={styles.fieldLabel}>
                Configurez vos compétences d'enseignement
              </Text>

              {tutorData.subjectTeachings.map((teaching, subjectIndex) => {
                const isExpanded = expandedSubjects[subjectIndex] !== false; // Default to true (expanded)
                
                return (
                  <View key={subjectIndex} style={styles.teachingCard}>
                    {/* Header with subject, chevron and delete */}
                    <TouchableOpacity 
                      style={styles.teachingCardHeader}
                      onPress={() => {
                        setExpandedSubjects(prev => ({
                          ...prev,
                          [subjectIndex]: !isExpanded,
                        }));
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.teachingCardTitle}>
                        <BookOpen size={16} color={Colors.primary} strokeWidth={2} />
                        <Text style={styles.teachingCardTitleText}>
                          {teaching.subject || 'Nouvelle matière'}
                        </Text>
                        {teaching.selectedLevels.length > 0 && (
                          <View style={styles.levelCountBadge}>
                            <Text style={styles.levelCountBadgeText}>
                              {teaching.selectedLevels.length} niveau{teaching.selectedLevels.length > 1 ? 'x' : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.teachingCardActions}>
                        <ChevronDown 
                          size={20} 
                          color={Colors.textSecondary} 
                          strokeWidth={2}
                          style={{
                            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                          }}
                        />
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            removeSubjectTeaching(subjectIndex);
                          }}
                          style={styles.deleteButton}
                        >
                          <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Collapsible content */}
                    {isExpanded && (
                      <View style={styles.inlineForm}>
                        <View style={styles.inlineField}>
                          <Text style={styles.inlineLabel}>Matière</Text>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.horizontalScroll}
                          >
                            {SUBJECTS.map((subject) => (
                              <TouchableOpacity
                                key={subject}
                                style={[
                                  styles.pillButton,
                                  teaching.subject === subject && styles.pillButtonActive,
                                ]}
                                onPress={() => updateSubjectTeaching(subjectIndex, 'subject', subject)}
                              >
                                <Text
                                  style={[
                                    styles.pillButtonText,
                                    teaching.subject === subject && styles.pillButtonTextActive,
                                  ]}
                                >
                                  {subject}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {/* Levels multi-selection */}
                        {teaching.subject && (
                          <>
                            <View style={styles.inlineField}>
                            <Text style={styles.inlineLabel}>Niveaux (plusieurs possibles)</Text>
                            <View style={styles.pillGrid}>
                              {EDUCATION_LEVELS.map((level) => (
                                <TouchableOpacity
                                  key={level.value}
                                  style={[
                                    styles.pillButton,
                                    teaching.selectedLevels.includes(level.value) && styles.pillButtonActive,
                                  ]}
                                  onPress={() => toggleLevel(subjectIndex, level.value)}
                                >
                                  <Text
                                    style={[
                                      styles.pillButtonText,
                                      teaching.selectedLevels.includes(level.value) && styles.pillButtonTextActive,
                                    ]}
                                  >
                                    {level.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          {/* Configuration for each selected level */}
                          {teaching.selectedLevels.map((levelValue) => {
                            const levelData = EDUCATION_LEVELS.find(l => l.value === levelValue);
                            const config = teaching.levelConfigs.find(c => c.level === levelValue);
                            
                            if (!levelData || !config) return null;

                            const hasSystems = levelData.systems.length > 0;
                            const selectedSystem = hasSystems ? levelData.systems.find(s => s.value === config.system) : null;
                            const hasTeachingTypes = selectedSystem && selectedSystem.teachingTypes.length > 0;
                            
                            // Get available classes
                            let availableClasses: any = [];
                            let hasSeriesSelection = false;
                            
                            if (levelValue === 'higher') {
                              // Higher education has no system
                              availableClasses = CLASSES.higher.default.default;
                            } else if (config.system) {
                              if (hasTeachingTypes && config.teachingType) {
                                const classData = CLASSES[levelValue]?.[config.system]?.[config.teachingType];
                                if (typeof classData === 'object' && !Array.isArray(classData)) {
                                  // Has series selection (Général lycée, Technique collège/lycée)
                                  availableClasses = classData;
                                  hasSeriesSelection = true;
                                } else {
                                  // Simple array
                                  availableClasses = classData || [];
                                }
                              } else if (!hasTeachingTypes) {
                                availableClasses = CLASSES[levelValue]?.[config.system]?.default || [];
                     }
                            }

                            return (
                              <View key={levelValue} style={styles.levelConfigCard}>
                                <Text style={styles.levelConfigTitle}>{levelData.label}</Text>

                                {/* System selection (if applicable) */}
                                {hasSystems && (
                                  <View style={styles.inlineField}>
                                    <Text style={styles.inlineLabel}>Système</Text>
                                    <View style={styles.pillGrid}>
                                      {levelData.systems.map((system) => (
                                        <TouchableOpacity
                                          key={system.value}
                                          style={[
                                            styles.pillButton,
                                            config.system === system.value && styles.pillButtonActive,
                                          ]}
                                          onPress={() => updateLevelConfig(subjectIndex, levelValue, 'system', system.value)}
                                        >
                                          <Text
                                            style={[
                                              styles.pillButtonText,
                                              config.system === system.value && styles.pillButtonTextActive,
                                            ]}
                                          >
                                            {system.label}
                                          </Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  </View>
                                )}

                                {/* Teaching type selection (if applicable) */}
                                {hasTeachingTypes && (
                                  <View style={styles.inlineField}>
                                    <Text style={styles.inlineLabel}>Enseignement</Text>
                                    <View style={styles.pillGrid}>
                                      {selectedSystem.teachingTypes.map((type) => (
                                        <TouchableOpacity
                                          key={type}
                                          style={[
                                            styles.pillButton,
                                            config.teachingType === type && styles.pillButtonActive,
                                          ]}
                                          onPress={() => updateLevelConfig(subjectIndex, levelValue, 'teachingType', type)}
                                        >
                                          <Text
                                            style={[
                                              styles.pillButtonText,
                                              config.teachingType === type && styles.pillButtonTextActive,
                                            ]}
                                          >
                                            {type}
                                          </Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  </View>
                                )}

                                {/* Classes selection */}
                                {availableClasses && (
                                  <View style={styles.inlineField}>
                                    <Text style={styles.inlineLabel}>Classes</Text>
                                    {hasSeriesSelection ? (
                                      // Classes with series (Général lycée, Technique collège/lycée)
                                      <View style={styles.classesWithSeriesContainer}>
                                        <ScrollView 
                                          horizontal 
                                          showsHorizontalScrollIndicator={false}
                                          style={styles.classesScrollView}
                                        >
                                          <View style={styles.classesRow}>
                                            {Object.entries(availableClasses).map(([className, series]: [string, any]) => {
                                              const selectedSeries = config.selectedClasses[className] || [];
                                              const hasSelectedSeries = selectedSeries.length > 0;
                                              const expandKey = `${subjectIndex}-${levelValue}`;
                                              const isExpanded = expandedClasses[expandKey] === className;
                                              
                                              return (
                                                <TouchableOpacity
                                                  key={className}
                                                  style={[
                                                    styles.classButton,
                                                    hasSelectedSeries && styles.classButtonActive,
                                                  ]}
                                                  onPress={() => {
                                                    // Toggle expansion for this class
                                                    setExpandedClasses(prev => ({
                                                      ...prev,
                                                      [expandKey]: isExpanded ? null : className,
                                                    }));
                                                  }}
                                                >
                                                  <Text style={[
                                                    styles.classButtonText,
                                                    hasSelectedSeries && styles.classButtonTextActive,
                                                  ]}>
                                                    {className}
                                                  </Text>
                                                  {hasSelectedSeries && (
                                                    <View style={styles.selectedBadge}>
                                                      <Text style={styles.selectedBadgeText}>
                                                        {selectedSeries.length}
                                                      </Text>
                                                    </View>
                                                  )}
                                                </TouchableOpacity>
                                              );
                                            })}
                                          </View>
                                        </ScrollView>
                                        
                                        {/* Series for expanded class */}
                                        {Object.entries(availableClasses).map(([className, series]: [string, any]) => {
                                          const expandKey = `${subjectIndex}-${levelValue}`;
                                          const isExpanded = expandedClasses[expandKey] === className;
                                          const selectedSeries = config.selectedClasses[className] || [];
                                          
                                          if (!isExpanded) return null;
                                          
                                          return (
                                            <View key={`series-${className}`} style={styles.seriesSection}>
                                              <Text style={styles.seriesSectionTitle}>
                                                Séries pour {className}
                                              </Text>
                                              <ScrollView 
                                                horizontal 
                                                showsHorizontalScrollIndicator={false}
                                                style={styles.seriesScrollView}
                                              >
                                                <View style={styles.seriesContainer}>
                                                  {series.map((serie: string) => {
                                                    const isSelected = selectedSeries.includes(serie);
                                                    return (
                                                      <TouchableOpacity
                                                        key={serie}
                                                        style={[
                                                          styles.pillButton,
                                                          styles.serieButton,
                                                          isSelected && styles.pillButtonActive,
                                                        ]}
                                                        onPress={() => toggleSerie(subjectIndex, levelValue, className, serie)}
                                                      >
                                                        <Text
                                                          style={[
                                                            styles.pillButtonText,
                                                            isSelected && styles.pillButtonTextActive,
                                                          ]}
                                                        >
                                                          {serie}
                                                        </Text>
                                                      </TouchableOpacity>
                                                    );
                                                  })}
                                                </View>
                                              </ScrollView>
                                            </View>
                                          );
                                        })}
                                      </View>
                                    ) : (
                                      // Simple classes (no series)
                                      <View style={styles.pillGrid}>
                                        {(availableClasses as string[]).map((className) => {
                                          const isSelected = config.classes.includes(className);
                                          return (
                                            <TouchableOpacity
                                              key={className}
                                              style={[
                                                styles.pillButton,
                                                isSelected && styles.pillButtonActive,
                                              ]}
                                              onPress={() => toggleClass(subjectIndex, levelValue, className)}
                                            >
                                              <Text
                                             style={[
                                                  styles.pillButtonText,
                                                  isSelected && styles.pillButtonTextActive,
                                                ]}
                                              >
                                                {className}
                                              </Text>
                                            </TouchableOpacity>
                                          );
                                        })}
                                      </View>
                                    )}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </>
                      )}
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.addButton}
                onPress={addSubjectTeaching}
              >
                <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.addButtonText}>Ajouter une matière</Text>
              </TouchableOpacity>
            </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  
  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Sections
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Input Groups
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },

  // Field Labels
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  // Options
  optionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
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

  // Subjects
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.bgCream,
  },
  subjectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subjectChipTextActive: {
    color: Colors.white,
  },
  systemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  systemChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  systemChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  systemChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  systemChipTextActive: {
    color: Colors.textPrimary,
  },

  // Mode Buttons (for tutors)
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modeButtonTextActive: {
    color: Colors.white,
  },

  // Teaching Cards - New streamlined design
  teachingCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  teachingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teachingCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  teachingCardTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  teachingCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelCountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  levelCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  deleteButton: {
    padding: 4,
  },
  
  // Inline form layout
  inlineForm: {
    gap: 10,
  },
  inlineField: {
    gap: 6,
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Horizontal scroll for long lists
  horizontalScroll: {
    flexGrow: 0,
  },
  
  // Pill buttons for selections
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: 6,
  },
  pillButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pillButtonTextActive: {
    color: Colors.white,
  },
  
  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  
  // Level sections
  levelSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  levelSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  
  // Level config cards
  levelConfigCard: {
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.2)',
  },
  levelConfigTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  
  // Classes with series
  classesScrollView: {
    flexGrow: 0,
    marginBottom: 8,
  },
  classesWithSeriesContainer: {
    gap: 8,
  },
  classesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
  },
  classSeriesBlock: {
    minWidth: 100,
  },
  classButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginRight: 8,
  },
  classButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  classButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  classButtonTextActive: {
    color: Colors.white,
  },
  selectedBadge: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  seriesSection: {
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  seriesSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  seriesScrollView: {
    flexGrow: 0,
  },
  seriesContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 12,
  },
  classSeriesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  serieButton: {
    minWidth: 40,
  },
  levelsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  levelBlock: {
    marginBottom: 8,
  },
  levelButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  levelButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  levelButtonTextActive: {
    color: Colors.white,
  },
  gradesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  gradesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  gradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.bgCream,
  },
  gradeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  gradeChipTextActive: {
    color: Colors.white,
  },
});
