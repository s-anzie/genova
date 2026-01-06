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
import { useRouter } from 'expo-router';
import { MapPin, Globe, GraduationCap, School, BookOpen } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { CreateClassData } from '@/types/api';
import { StyledModal } from '@/components/ui/StyledModal';
import { PageHeader } from '@/components/PageHeader';
import { useProfile } from '@/contexts/profile-context';

export default function CreateClassScreen() {
  const router = useRouter();
  const { studentProfile, isLoading: profileLoading } = useProfile();
  
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdClassId, setCreatedClassId] = useState<string | null>(null);
  
  // Parse education details from student profile
  const [educationInfo, setEducationInfo] = useState<{
    educationSystemId?: string;
    educationLevelId?: string;
    educationStreamId?: string;
    countryName?: string;
    systemName?: string;
    levelName?: string;
    streamName?: string;
    schoolName?: string;
  }>({});
  
  // Available subjects from student's preferred subjects
  const [availableSubjects, setAvailableSubjects] = useState<Array<{
    id: string;
    name: string;
    isLevelSubject: boolean;
  }>>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedSubjectIds: [] as string[], // IDs of LevelSubject or StreamSubject
    maxStudents: '',
    meetingType: 'ONLINE' as 'ONLINE' | 'IN_PERSON',
    meetingLocation: '',
  });

  // Load education info and preferred subjects from profile
  useEffect(() => {
    if (studentProfile) {
      console.log('📋 Student profile loaded:', studentProfile);
      
      // Extract education info directly from profile relations
      const info: any = {
        educationSystemId: studentProfile.educationSystemId || undefined,
        educationLevelId: studentProfile.educationLevelId || undefined,
        educationStreamId: studentProfile.educationStreamId || undefined,
        schoolName: studentProfile.schoolName || undefined,
      };
      
      // Get country name from educationSystem relation
      if ((studentProfile as any).educationSystem?.country) {
        info.countryName = (studentProfile as any).educationSystem.country.name;
      }
      
      // Get system name from educationSystem relation
      if ((studentProfile as any).educationSystem) {
        info.systemName = (studentProfile as any).educationSystem.name;
      }
      
      // Get level name from educationLevel relation
      if ((studentProfile as any).educationLevel) {
        info.levelName = (studentProfile as any).educationLevel.name;
      }
      
      // Get stream name from educationStream relation
      if ((studentProfile as any).educationStream) {
        info.streamName = (studentProfile as any).educationStream.name;
      }
      
      console.log('✅ Extracted education info:', info);
      setEducationInfo(info);
      
      // Load preferred subjects from profile relations
      loadPreferredSubjectsFromProfile();
    }
  }, [studentProfile]);

  const loadPreferredSubjectsFromProfile = () => {
    if (!studentProfile) return;
    
    const subjects: Array<{ id: string; name: string; isLevelSubject: boolean }> = [];
    
    // Add level subjects
    if (studentProfile.preferredLevelSubjects && Array.isArray(studentProfile.preferredLevelSubjects)) {
      studentProfile.preferredLevelSubjects.forEach((pls: any) => {
        if (pls.levelSubject && pls.levelSubject.subject) {
          subjects.push({
            id: pls.levelSubject.id,
            name: pls.levelSubject.subject.name,
            isLevelSubject: true,
          });
        }
      });
    }
    
    // Add stream subjects
    if (studentProfile.preferredStreamSubjects && Array.isArray(studentProfile.preferredStreamSubjects)) {
      studentProfile.preferredStreamSubjects.forEach((pss: any) => {
        if (pss.streamSubject && pss.streamSubject.subject) {
          subjects.push({
            id: pss.streamSubject.id,
            name: pss.streamSubject.subject.name,
            isLevelSubject: false,
          });
        }
      });
    }
    
    console.log('📚 Loaded subjects from profile:', subjects);
    setAvailableSubjects(subjects);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Veuillez entrer un nom pour la classe');
      setShowErrorModal(true);
      return;
    }
    
    if (!educationInfo.educationLevelId) {
      setErrorMessage('Votre profil ne contient pas d\'informations sur votre niveau d\'éducation. Veuillez compléter votre profil.');
      setShowErrorModal(true);
      return;
    }
    
    if (formData.selectedSubjectIds.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins une matière');
      setShowErrorModal(true);
      return;
    }
    
    if (formData.meetingType === 'IN_PERSON' && !formData.meetingLocation.trim()) {
      setErrorMessage('Veuillez entrer un lieu de rencontre pour les cours en présentiel');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    setShowLoadingModal(true);
    
    try {
      // Separate levelSubjectIds and streamSubjectIds
      const levelSubjectIds: string[] = [];
      const streamSubjectIds: string[] = [];
      
      formData.selectedSubjectIds.forEach(id => {
        const subject = availableSubjects.find(s => s.id === id);
        if (subject) {
          if (subject.isLevelSubject) {
            levelSubjectIds.push(id);
          } else {
            streamSubjectIds.push(id);
          }
        }
      });
      
      const classData: CreateClassData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        educationSystemId: educationInfo.educationSystemId,
        educationLevelId: educationInfo.educationLevelId,
        educationStreamId: educationInfo.educationStreamId,
        levelSubjectIds: levelSubjectIds.length > 0 ? levelSubjectIds : undefined,
        streamSubjectIds: streamSubjectIds.length > 0 ? streamSubjectIds : undefined,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
        meetingType: formData.meetingType,
        meetingLocation: formData.meetingLocation.trim() || undefined,
      };

      console.log('🔄 Creating class...', classData);
      const response = await apiClient.post('/classes', classData);

      const classId = response.data.id;
      console.log('✅ Class created successfully:', classId);

      setCreatedClassId(classId);
      setShowLoadingModal(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('❌ Failed to create class:', error);
      setShowLoadingModal(false);
      setErrorMessage(error.message || 'Impossible de créer la classe');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Créer une classe"
          variant='primary'
          showBackButton={true}
          centerTitle={true}
          showGradient={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement de votre profil...</Text>
        </View>
      </View>
    );
  }

  if (!studentProfile || !educationInfo.educationLevelId) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Créer une classe"
          variant='primary'
          showBackButton={true}
          centerTitle={true}
          showGradient={false}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Profil incomplet</Text>
          <Text style={styles.errorText}>
            Veuillez compléter votre profil avec vos informations d'éducation avant de créer une classe.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.push('/(student)/(tabs)/profile')}
          >
            <Text style={styles.errorButtonText}>Compléter mon profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Créer une classe"
        variant='primary'
        showBackButton={true}
        centerTitle={true}
        showGradient={false}
      />

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
            {/* Education Info Display */}
            <View style={styles.educationCard}>
              <View style={styles.educationCardHeader}>
                <View style={styles.educationIconContainer}>
                  <GraduationCap size={24} color={Colors.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.educationHeaderText}>
                  <Text style={styles.educationCardTitle}>Informations académiques</Text>
                  <Text style={styles.educationCardSubtitle}>Depuis votre profil</Text>
                </View>
              </View>
              
              <View style={styles.educationInfoGrid}>
                {educationInfo.countryName && (
                  <View style={styles.educationInfoItem}>
                    <View style={styles.educationInfoIcon}>
                      <Globe size={18} color={Colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.educationInfoText}>
                      <Text style={styles.educationInfoLabel}>Pays</Text>
                      <Text style={styles.educationInfoValue}>{educationInfo.countryName}</Text>
                    </View>
                  </View>
                )}
                
                {educationInfo.systemName && (
                  <View style={styles.educationInfoItem}>
                    <View style={styles.educationInfoIcon}>
                      <School size={18} color={Colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.educationInfoText}>
                      <Text style={styles.educationInfoLabel}>Système</Text>
                      <Text style={styles.educationInfoValue}>{educationInfo.systemName}</Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.educationInfoItem}>
                  <View style={styles.educationInfoIcon}>
                    <GraduationCap size={18} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.educationInfoText}>
                    <Text style={styles.educationInfoLabel}>Niveau</Text>
                    <Text style={styles.educationInfoValue}>{educationInfo.levelName || 'Non spécifié'}</Text>
                  </View>
                </View>
                
                {educationInfo.streamName && (
                  <View style={styles.educationInfoItem}>
                    <View style={styles.educationInfoIcon}>
                      <BookOpen size={18} color={Colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.educationInfoText}>
                      <Text style={styles.educationInfoLabel}>Filière</Text>
                      <Text style={styles.educationInfoValue}>{educationInfo.streamName}</Text>
                    </View>
                  </View>
                )}
                
                {educationInfo.schoolName && (
                  <View style={styles.educationInfoItemFull}>
                    <View style={styles.educationInfoIcon}>
                      <School size={18} color={Colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.educationInfoText}>
                      <Text style={styles.educationInfoLabel}>École</Text>
                      <Text style={styles.educationInfoValue}>{educationInfo.schoolName}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

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

            {/* Subjects - From preferred subjects */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Matières * (sélection multiple)</Text>
              {availableSubjects.length > 0 ? (
                <View style={styles.optionsGrid}>
                  {availableSubjects.map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.optionButton,
                        formData.selectedSubjectIds.includes(subject.id) && styles.optionButtonActive,
                      ]}
                      onPress={() => {
                        if (formData.selectedSubjectIds.includes(subject.id)) {
                          setFormData({
                            ...formData,
                            selectedSubjectIds: formData.selectedSubjectIds.filter(id => id !== subject.id),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedSubjectIds: [...formData.selectedSubjectIds, subject.id],
                          });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          formData.selectedSubjectIds.includes(subject.id) && styles.optionButtonTextActive,
                        ]}
                      >
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSubjectsText}>
                  Aucune matière disponible pour votre niveau. Veuillez compléter votre profil.
                </Text>
              )}
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
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Créer la classe</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Loading Modal */}
      <StyledModal
        visible={showLoadingModal}
        type="loading"
        title="Création en cours..."
        message="Veuillez patienter pendant la création de votre classe"
        showCloseButton={false}
      />

      {/* Success Modal */}
      <StyledModal
        visible={showSuccessModal}
        type="success"
        title="Classe créée avec succès!"
        message="Voulez-vous créer l'emploi du temps maintenant?"
        primaryButton={{
          text: "Créer l'emploi du temps",
          onPress: () => {
            setShowSuccessModal(false);
            if (createdClassId) {
              router.push(`/(student)/classes/schedule?id=${createdClassId}`);
            }
          },
        }}
        secondaryButton={{
          text: 'Plus tard',
          onPress: () => {
            setShowSuccessModal(false);
            router.back();
          },
        }}
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
        onClose={() => setShowErrorModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  form: {
    gap: 20,
  },
  educationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.1)',
  },
  educationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  educationIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 115, 119, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  educationHeaderText: {
    flex: 1,
  },
  educationCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  educationCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  educationInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  educationInfoItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  educationInfoItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  educationInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  educationInfoText: {
    flex: 1,
  },
  educationInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  educationInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
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
  noSubjectsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
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
