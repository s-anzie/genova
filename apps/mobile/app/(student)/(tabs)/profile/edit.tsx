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
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  X,
  Check,
  Camera,
  User as UserIcon,
  Phone,
  Mail,
  GraduationCap,
  School,
  BookOpen,
  Users,
  DollarSign,
  Globe,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/colors';
import { StyledModal } from '@/components/ui/StyledModal';
import { useModal } from '@/hooks/useModal';
import * as ImagePicker from 'expo-image-picker';
import {
  useCountries,
  useEducationSystems,
  useEducationLevels,
  useEducationStreams,
  useLevelSubjects,
  useStreamSubjects,
} from '@/hooks/useEducation';
import { eurToFcfa, fcfaToEur } from '@/utils/currency';

interface ProfileData {
  // User data
  firstName: string;
  lastName: string;
  phone: string;
  
  // Student profile data
  countryCode: string;
  educationSystemId: string;
  educationLevelId: string;
  educationStreamId: string;
  schoolName: string;
  preferredLevelSubjectIds: string[]; // For levels without streams
  preferredStreamSubjectIds: string[]; // For levels with streams
  parentEmail: string;
  parentPhone: string;
  budgetPerHour: string;
}

export default function StudentEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
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
  const { countries } = useCountries();
  const { systems } = useEducationSystems(formData.countryCode);
  const { levels } = useEducationLevels(formData.educationSystemId);
  const { streams } = useEducationStreams(formData.educationLevelId);
  
  const selectedLevel = levels.find(l => l.id === formData.educationLevelId);
  const hasStreams = selectedLevel?.hasStreams || false;
  
  const { subjects: levelSubjects } = useLevelSubjects(
    hasStreams ? undefined : formData.educationLevelId
  );
  const { subjects: streamSubjects } = useStreamSubjects(
    hasStreams ? formData.educationStreamId : undefined
  );
  
  // Use the appropriate subjects and IDs based on whether level has streams
  const availableSubjects = hasStreams ? streamSubjects : levelSubjects;
  const selectedSubjectIds = hasStreams ? formData.preferredStreamSubjectIds : formData.preferredLevelSubjectIds;

  // Debug logs
  useEffect(() => {
    if (availableSubjects.length > 0) {
      console.log('🎯 Available subjects:', {
        hasStreams,
        count: availableSubjects.length,
        subjects: availableSubjects.map(s => ({ id: s.id, name: s.subject.name })),
      });
      console.log('✅ Selected subject IDs:', selectedSubjectIds);
      console.log('🔍 Matching subjects:', availableSubjects.filter(s => selectedSubjectIds.includes(s.id)).map(s => s.subject.name));
    }
  }, [availableSubjects, selectedSubjectIds, hasStreams]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.get(`/profiles/student/${user?.id}`);
      const profile = response.data;
      
      console.log('📋 Profile loaded:', {
        hasLevelSubjects: !!profile.preferredLevelSubjects,
        levelSubjectsCount: profile.preferredLevelSubjects?.length || 0,
        hasStreamSubjects: !!profile.preferredStreamSubjects,
        streamSubjectsCount: profile.preferredStreamSubjects?.length || 0,
      });
      
      // Extract preferred subject IDs separately for level and stream subjects
      const levelSubjectIds = profile.preferredLevelSubjects?.map((ps: any) => {
        console.log('Level subject:', ps.levelSubject?.id, ps.levelSubject?.subject?.name);
        return ps.levelSubject.id;
      }) || [];
      
      const streamSubjectIds = profile.preferredStreamSubjects?.map((ps: any) => {
        console.log('Stream subject:', ps.streamSubject?.id, ps.streamSubject?.subject?.name);
        return ps.streamSubject.id;
      }) || [];
      
      console.log('📝 Extracted IDs:', {
        levelSubjectIds,
        streamSubjectIds,
      });
      
      // Convert budget from EUR to FCFA for display
      const budgetInFcfa = profile.budgetPerHour ? eurToFcfa(Number(profile.budgetPerHour)).toString() : '';
      
      setFormData({
        firstName: profile.user.firstName || '',
        lastName: profile.user.lastName || '',
        phone: profile.user.phone || '',
        countryCode: profile.educationSystem?.country?.code || '',
        educationSystemId: profile.educationSystemId || '',
        educationLevelId: profile.educationLevelId || '',
        educationStreamId: profile.educationStreamId || '',
        schoolName: profile.schoolName || '',
        preferredLevelSubjectIds: levelSubjectIds,
        preferredStreamSubjectIds: streamSubjectIds,
        parentEmail: profile.parentEmail || '',
        parentPhone: profile.parentPhone || '',
        budgetPerHour: budgetInFcfa,
      });
      
      setAvatarUri(profile.user.avatarUrl);
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Impossible de charger le profil');
      showError('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showError('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
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

  const updateField = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update user data
      await apiClient.put('/profiles/me', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      // Prepare subject IDs based on whether level has streams
      const subjectData = hasStreams 
        ? { preferredStreamSubjectIds: formData.preferredStreamSubjectIds }
        : { preferredLevelSubjectIds: formData.preferredLevelSubjectIds };

      console.log('💾 Saving profile with subjects:', {
        hasStreams,
        subjectData,
        levelSubjectIds: formData.preferredLevelSubjectIds,
        streamSubjectIds: formData.preferredStreamSubjectIds,
      });

      // Convert budget from FCFA to EUR for backend
      const budgetInEur = formData.budgetPerHour ? fcfaToEur(parseFloat(formData.budgetPerHour)) : null;

      // Update student profile
      const response = await apiClient.put('/profiles/student', {
        educationSystemId: formData.educationSystemId,
        educationLevelId: formData.educationLevelId,
        educationStreamId: formData.educationStreamId || null,
        schoolName: formData.schoolName,
        ...subjectData,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
        budgetPerHour: budgetInEur,
      });

      console.log('✅ Profile saved successfully:', response);

      showSuccess('Succès', 'Profil mis à jour avec succès', () => router.back());
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Échec de la mise à jour du profil');
      showError('Erreur', errorMessage);
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
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
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
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <UserIcon size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
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
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
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
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="Entrez votre numéro"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
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
          
          {/* Country - Read only */}
          {formData.countryCode && (
            <View style={styles.readOnlyField}>
              <View style={styles.readOnlyIcon}>
                <Globe size={20} color={Colors.textSecondary} strokeWidth={2} />
              </View>
              <View style={styles.readOnlyContent}>
                <Text style={styles.readOnlyLabel}>Pays</Text>
                <Text style={styles.readOnlyValue}>
                  {countries.find(c => c.code === formData.countryCode)?.name || formData.countryCode}
                </Text>
                <Text style={styles.readOnlyHint}>Non modifiable</Text>
              </View>
            </View>
          )}

          {formData.countryCode && (
            <>
              <Text style={styles.fieldLabel}>Système éducatif</Text>
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
            </>
          )}

          {formData.educationSystemId && (
            <>
              <Text style={styles.fieldLabel}>Niveau</Text>
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
            </>
          )}

          {formData.educationLevelId && hasStreams && (
            <>
              <Text style={styles.fieldLabel}>Filière (optionnel)</Text>
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
            </>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <School size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>École</Text>
              <TextInput
                style={styles.input}
                value={formData.schoolName}
                onChangeText={(text) => updateField('schoolName', text)}
                placeholder="Nom de votre école"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Subjects Section */}
        {availableSubjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={22} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Matières préférées</Text>
            </View>
            
            <Text style={styles.fieldLabel}>
              Sélectionnées ({selectedSubjectIds.length})
            </Text>
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
          </View>
        )}

        {/* Parent Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={22} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Contact des parents</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Mail size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email du parent/tuteur</Text>
              <TextInput
                style={styles.input}
                value={formData.parentEmail}
                onChangeText={(text) => updateField('parentEmail', text)}
                placeholder="parent@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Phone size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Téléphone du parent/tuteur</Text>
              <TextInput
                style={styles.input}
                value={formData.parentPhone}
                onChangeText={(text) => updateField('parentPhone', text)}
                placeholder="+221 XX XXX XX XX"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Budget Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={22} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Budget</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <DollarSign size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Budget par heure (FCFA)</Text>
              <TextInput
                style={styles.input}
                value={formData.budgetPerHour}
                onChangeText={(text) => updateField('budgetPerHour', text)}
                placeholder="Ex: 7000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    ...Shadows.medium,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
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
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
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
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.large,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyIcon: {
    marginRight: 12,
  },
  readOnlyContent: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  readOnlyHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: 16,
    marginBottom: 12,
    ...Shadows.small,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
  },
  selectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  selectItem: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Shadows.small,
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
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subjectChipTextActive: {
    color: Colors.white,
  },
});
