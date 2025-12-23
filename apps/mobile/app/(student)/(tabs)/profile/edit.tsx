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
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors } from '@/constants/colors';
import { API_BASE_URL } from '@/config/api';
import * as ImagePicker from 'expo-image-picker';
import type { UserResponse, StudentProfileResponse } from '@/types/api';

const EDUCATION_LEVELS = [
  { value: 'primary', label: 'École primaire' },
  { value: 'middle_school', label: 'Collège' },
  { value: 'high_school', label: 'Lycée' },
  { value: 'university', label: 'Université' },
  { value: 'graduate', label: 'Études supérieures' },
];

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
      setStudentData({
        educationLevel: profileResponse.data.educationLevel || '',
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
      await apiClient.put(`${API_BASE_URL}/profiles/student`, {
        educationLevel: studentData.educationLevel,
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 40 }} />
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
          <View style={styles.optionsContainer}>
            {EDUCATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.optionButton,
                  studentData.educationLevel === level.value && styles.optionButtonActive,
                ]}
                onPress={() => setStudentData({ ...studentData, educationLevel: level.value })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    studentData.educationLevel === level.value && styles.optionButtonTextActive,
                  ]}
                >
                  {level.label}
                </Text>
                {studentData.educationLevel === level.value && (
                  <Check size={16} color={Colors.white} strokeWidth={3} />
                )}
              </TouchableOpacity>
            ))}
          </View>

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

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
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
  backButton: {
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

  // Footer
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
