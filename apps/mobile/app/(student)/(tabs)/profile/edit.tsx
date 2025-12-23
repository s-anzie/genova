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
  Phone, 
  MapPin, 
  Home,
  GraduationCap,
  BookOpen,
  Target,
  DollarSign,
  Check,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors } from '@/constants/colors';
import { API_BASE_URL } from '@/config/api';
import * as ImagePicker from 'expo-image-picker';
import type { UserResponse, StudentProfileResponse } from '@/types/api';

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

export default function StudentEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Student profile data
  const [studentData, setStudentData] = useState({
    educationLevel: '',
    system: '',
    teachingType: '',
    specificClass: '',
    selectedSerie: '', // Une seule série/filière
    schoolName: '',
    preferredSubjects: [] as string[],
    learningGoals: '',
    budgetPerHour: '',
  });

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
      const userResponse = await apiClient.get<{ success: boolean; data: UserResponse }>(
        `${API_BASE_URL}/profiles/user/${user?.id}`
      );
      setUserData({
        firstName: userResponse.data.firstName || '',
        lastName: userResponse.data.lastName || '',
        phone: userResponse.data.phone || '',
        address: userResponse.data.address || '',
        city: userResponse.data.city || '',
        postalCode: userResponse.data.postalCode || '',
        country: userResponse.data.country || '',
      });
      setAvatarUri(userResponse.data.avatarUrl);

      // Load student profile
      const profileResponse = await apiClient.get<{ success: boolean; data: StudentProfileResponse }>(
        `${API_BASE_URL}/profiles/student/${user?.id}`
      );
      
      // Parse education details if available
      const educationDetails: any = profileResponse.data.educationDetails || {};
      
      setStudentData({
        educationLevel: profileResponse.data.educationLevel || '',
        system: educationDetails.system || '',
        teachingType: educationDetails.teachingType || '',
        specificClass: educationDetails.specificClass || '',
        selectedSerie: educationDetails.selectedSerie || '',
        schoolName: profileResponse.data.schoolName || '',
        preferredSubjects: profileResponse.data.preferredSubjects || [],
        learningGoals: profileResponse.data.learningGoals || '',
        budgetPerHour: profileResponse.data.budgetPerHour?.toString() || '',
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
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

  const toggleSubject = (subject: string) => {
    const subjects = studentData.preferredSubjects.includes(subject)
      ? studentData.preferredSubjects.filter((s) => s !== subject)
      : [...studentData.preferredSubjects, subject];
    setStudentData({ ...studentData, preferredSubjects: subjects });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update user data
      await apiClient.put(`${API_BASE_URL}/profiles/me`, {
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
        // TODO: Implement actual file upload to S3
        await apiClient.post(`${API_BASE_URL}/profiles/me/avatar`, { avatarUrl: avatarUri });
      }

      // Update student profile
      // Prepare education details
      const educationDetails = {
        system: studentData.system,
        teachingType: studentData.teachingType,
        specificClass: studentData.specificClass,
        selectedSerie: studentData.selectedSerie,
      };
      
      await apiClient.put(`${API_BASE_URL}/profiles/student`, {
        educationLevel: studentData.educationLevel,
        educationDetails: educationDetails, // Send as object, not string
        schoolName: studentData.schoolName || undefined,
        preferredSubjects: studentData.preferredSubjects,
        learningGoals: studentData.learningGoals || undefined,
        budgetPerHour: studentData.budgetPerHour ? parseFloat(studentData.budgetPerHour) : undefined,
      });

      Alert.alert('Succès', 'Profil mis à jour avec succès');
      router.back();
    } catch (error: any) {
      console.error('Failed to save profile:', error);
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
                <MapPin size={20} color={Colors.primary} strokeWidth={2} />
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

        {/* Education Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={22} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Éducation</Text>
          </View>
          
          <Text style={styles.fieldLabel}>Niveau d'études</Text>
          <View style={styles.pillGrid}>
            {EDUCATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.pillButton,
                  studentData.educationLevel === level.value && styles.pillButtonActive,
                ]}
                onPress={() => {
                  setStudentData({ 
                    ...studentData, 
                    educationLevel: level.value,
                    system: '',
                    teachingType: '',
                    specificClass: '',
                    selectedSerie: '',
                  });
                }}
              >
                <Text
                  style={[
                    styles.pillButtonText,
                    studentData.educationLevel === level.value && styles.pillButtonTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* System selection (if applicable) */}
          {studentData.educationLevel && EDUCATION_LEVELS.find(l => l.value === studentData.educationLevel)?.systems && EDUCATION_LEVELS.find(l => l.value === studentData.educationLevel)!.systems.length > 0 && (
            <View style={styles.inlineField}>
              <Text style={styles.inlineLabel}>Système</Text>
              <View style={styles.pillGrid}>
                {EDUCATION_LEVELS.find(l => l.value === studentData.educationLevel)!.systems.map((system) => (
                  <TouchableOpacity
                    key={system.value}
                    style={[
                      styles.pillButton,
                      studentData.system === system.value && styles.pillButtonActive,
                    ]}
                    onPress={() => setStudentData({ 
                      ...studentData, 
                      system: system.value,
                      teachingType: '',
                      specificClass: '',
                      selectedSerie: '',
                    })}
                  >
                    <Text
                      style={[
                        styles.pillButtonText,
                        studentData.system === system.value && styles.pillButtonTextActive,
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
          {studentData.system && (() => {
            const level = EDUCATION_LEVELS.find(l => l.value === studentData.educationLevel);
            const system = level?.systems.find(s => s.value === studentData.system);
            return system?.teachingTypes && system.teachingTypes.length > 0;
          })() && (
            <View style={styles.inlineField}>
              <Text style={styles.inlineLabel}>Enseignement</Text>
              <View style={styles.pillGrid}>
                {EDUCATION_LEVELS.find(l => l.value === studentData.educationLevel)!.systems.find(s => s.value === studentData.system)!.teachingTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pillButton,
                      studentData.teachingType === type && styles.pillButtonActive,
                    ]}
                    onPress={() => setStudentData({ 
                      ...studentData, 
                      teachingType: type,
                      specificClass: '',
                      selectedSerie: '',
                    })}
                  >
                    <Text
                      style={[
                        styles.pillButtonText,
                        studentData.teachingType === type && styles.pillButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Class selection */}
          {studentData.educationLevel && (studentData.educationLevel === 'higher' || studentData.system) && (() => {
            const levelData = EDUCATION_LEVELS.find(l => l.value === studentData.educationLevel);
            if (!levelData) return null;

            let availableClasses: any = [];
            let hasSeriesSelection = false;

            if (studentData.educationLevel === 'higher') {
              availableClasses = CLASSES.higher.default.default;
            } else if (studentData.system) {
              const systemData = levelData.systems.find(s => s.value === studentData.system);
              const hasTeachingTypes = systemData?.teachingTypes && systemData.teachingTypes.length > 0;
              
              if (hasTeachingTypes && studentData.teachingType) {
                const classData = CLASSES[studentData.educationLevel]?.[studentData.system]?.[studentData.teachingType];
                if (typeof classData === 'object' && !Array.isArray(classData)) {
                  availableClasses = classData;
                  hasSeriesSelection = true;
                } else {
                  availableClasses = classData || [];
                }
              } else if (!hasTeachingTypes) {
                availableClasses = CLASSES[studentData.educationLevel]?.[studentData.system]?.default || [];
              }
            }

            if (!availableClasses || (Array.isArray(availableClasses) && availableClasses.length === 0 && !hasSeriesSelection)) {
              return null;
            }

            return (
              <View style={styles.inlineField}>
                <Text style={styles.inlineLabel}>Classe</Text>
                {hasSeriesSelection ? (
                  // Classes with series
                  <View>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.classesScrollView}
                    >
                      <View style={styles.classesRow}>
                        {Object.keys(availableClasses).map((className) => (
                          <TouchableOpacity
                            key={className}
                            style={[
                              styles.pillButton,
                              studentData.specificClass === className && styles.pillButtonActive,
                            ]}
                            onPress={() => setStudentData({ 
                              ...studentData, 
                              specificClass: className,
                              selectedSerie: '',
                            })}
                          >
                            <Text
                              style={[
                                styles.pillButtonText,
                                studentData.specificClass === className && styles.pillButtonTextActive,
                              ]}
                            >
                              {className}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Series selection */}
                    {studentData.specificClass && availableClasses[studentData.specificClass] && (
                      <View style={styles.seriesSection}>
                        <Text style={styles.seriesSectionTitle}>
                          Série/Filière pour {studentData.specificClass}
                        </Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.seriesScrollView}
                        >
                          <View style={styles.seriesContainer}>
                            {availableClasses[studentData.specificClass].map((serie: string) => {
                              const isSelected = studentData.selectedSerie === serie;
                              return (
                                <TouchableOpacity
                                  key={serie}
                                  style={[
                                    styles.pillButton,
                                    styles.serieButton,
                                    isSelected && styles.pillButtonActive,
                                  ]}
                                  onPress={() => {
                                    setStudentData({ ...studentData, selectedSerie: serie });
                                  }}
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
                    )}
                  </View>
                ) : (
                  // Simple classes (no series)
                  <View style={styles.pillGrid}>
                    {(availableClasses as string[]).map((className) => (
                      <TouchableOpacity
                        key={className}
                        style={[
                          styles.pillButton,
                          studentData.specificClass === className && styles.pillButtonActive,
                        ]}
                        onPress={() => setStudentData({ ...studentData, specificClass: className })}
                      >
                        <Text
                          style={[
                            styles.pillButtonText,
                            studentData.specificClass === className && styles.pillButtonTextActive,
                          ]}
                        >
                          {className}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>École (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={studentData.schoolName}
                onChangeText={(text) => setStudentData({ ...studentData, schoolName: text })}
                placeholder="Nom de votre école"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Learning Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={22} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Matières & Objectifs</Text>
          </View>
          
          <Text style={styles.fieldLabel}>Matières préférées</Text>
          <View style={styles.subjectsGrid}>
            {SUBJECTS.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectChip,
                  studentData.preferredSubjects.includes(subject) && styles.subjectChipActive,
                ]}
                onPress={() => toggleSubject(subject)}
              >
                <Text
                  style={[
                    styles.subjectChipText,
                    studentData.preferredSubjects.includes(subject) && styles.subjectChipTextActive,
                  ]}
                >
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Target size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Objectifs d'apprentissage (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={studentData.learningGoals}
                onChangeText={(text) => setStudentData({ ...studentData, learningGoals: text })}
                placeholder="Que souhaitez-vous accomplir ?"
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <DollarSign size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Budget par heure (€, optionnel)</Text>
              <TextInput
                style={styles.input}
                value={studentData.budgetPerHour}
                onChangeText={(text) => setStudentData({ ...studentData, budgetPerHour: text })}
                placeholder="ex: 25"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>
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

  // Inline form layout
  inlineField: {
    gap: 6,
    marginBottom: 12,
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
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
  
  // Classes with series
  classesScrollView: {
    flexGrow: 0,
    marginBottom: 8,
  },
  classesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
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
  serieButton: {
    minWidth: 40,
  },
});
