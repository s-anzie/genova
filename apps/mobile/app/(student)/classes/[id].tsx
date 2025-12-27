import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  BookOpen,
  MapPin,
  Globe,
  UserPlus,
  Trash2,
  Calendar,
  Edit,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { ClassResponse } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/PageHeader';

export default function ClassDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [classData, setClassData] = useState<ClassResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClassData = useCallback(async () => {
    if (!id) {
      console.log('No class ID provided');
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.get(`/classes/${id}`);
      setClassData(response.data);
    } catch (error) {
      console.error('Failed to load class:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la classe');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadClassData();
    }
  }, [id, loadClassData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClassData();
  };

  const handleInviteMembers = () => {
    router.push(`/(student)/classes/invite?id=${id}`);
  };

  const handleEditClass = () => {
    router.push(`/(student)/classes/edit?id=${id}`);
  };

  const handleViewSchedule = () => {
    router.push(`/(student)/classes/schedule?id=${id}`);
  };

  const handleRemoveMember = (studentId: string, studentName: string) => {
    Alert.alert(
      'Retirer le membre',
      `Êtes-vous sûr de vouloir retirer ${studentName} de la classe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}/members/${studentId}`);
              Alert.alert('Succès', 'Membre retiré avec succès');
              loadClassData();
            } catch (error: any) {
              console.error('Failed to remove member:', error);
              Alert.alert('Erreur', error.message || 'Impossible de retirer le membre');
            }
          },
        },
      ]
    );
  };

  const handleLeaveClass = () => {
    Alert.alert(
      'Quitter la classe',
      'Êtes-vous sûr de vouloir quitter cette classe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}/members/${user?.id}`);
              Alert.alert('Succès', 'Vous avez quitté la classe', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Failed to leave class:', error);
              Alert.alert('Erreur', error.message || 'Impossible de quitter la classe');
            }
          },
        },
      ]
    );
  };

  const handleDeleteClass = () => {
    Alert.alert(
      'Supprimer la classe',
      'Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}`);
              Alert.alert('Succès', 'Classe supprimée avec succès', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Failed to delete class:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer la classe');
            }
          },
        },
      ]
    );
  };

  if (loading || !classData) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Détails"
          showBackButton={true}
          centerTitle={true}
          showGradient={false}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  const isCreator = classData.createdBy === user?.id;

  // Format education level labels
  const LEVEL_LABELS: Record<string, string> = {
    primary: 'Primaire',
    middle_school: 'Collège',
    high_school: 'Lycée',
    university: 'Université',
  };

  const SYSTEM_LABELS: Record<string, string> = {
    francophone: 'Francophone',
    anglophone: 'Anglophone',
    francophone_general: 'Général (Francophone)',
    francophone_technical: 'Technique (Francophone)',
    licence: 'Licence',
    master: 'Master',
  };

  const educationLevel = classData.educationLevel;
  const levelLabel = LEVEL_LABELS[educationLevel.level] || educationLevel.level;
  const systemLabel = educationLevel.system ? (SYSTEM_LABELS[educationLevel.system] || educationLevel.system) : undefined;

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Détails"
        showBackButton={true}
        centerTitle={true}
        showGradient={false}
        variant='primary'
        rightElement={
          isCreator ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEditClass}>
              <Edit size={22} color={Colors.white} strokeWidth={2} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Class Info Card - Full Width */}
        <View style={styles.infoCard}>
          {/* Hero Section - Compact */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <BookOpen size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.className}>{classData.name}</Text>
              {classData.description && (
                <Text style={styles.classDescription}>{classData.description}</Text>
              )}
            </View>
          </View>

          {/* Education Level - Granular Display */}
          <View style={styles.educationSection}>
            <Text style={styles.sectionLabel}>Niveau d'éducation</Text>
            <View style={styles.educationGrid}>
              <View style={styles.educationItem}>
                <Text style={styles.educationLabel}>Niveau</Text>
                <Text style={styles.educationValue}>{levelLabel}</Text>
              </View>
              {systemLabel && (
                <View style={styles.educationItem}>
                  <Text style={styles.educationLabel}>Système</Text>
                  <Text style={styles.educationValue}>{systemLabel}</Text>
                </View>
              )}
              {educationLevel.specificLevel && (
                <View style={styles.educationItem}>
                  <Text style={styles.educationLabel}>Classe</Text>
                  <Text style={styles.educationValue}>{educationLevel.specificLevel}</Text>
                </View>
              )}
              {educationLevel.stream && (
                <View style={styles.educationItem}>
                  <Text style={styles.educationLabel}>Filière</Text>
                  <Text style={styles.educationValue}>{educationLevel.stream}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Subjects - Multiple Display */}
          <View style={styles.subjectsSection}>
            <Text style={styles.sectionLabel}>Matières</Text>
            <View style={styles.subjectsContainer}>
              {classData.subjects.map((subject, index) => (
                <View key={index} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{subject}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Other Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <View style={styles.infoValueRow}>
                {classData.meetingType === 'ONLINE' ? (
                  <Globe size={16} color={Colors.textSecondary} strokeWidth={2} />
                ) : (
                  <MapPin size={16} color={Colors.textSecondary} strokeWidth={2} />
                )}
                <Text style={styles.infoValue}>
                  {classData.meetingType === 'ONLINE' ? 'En ligne' : 'Présentiel'}
                </Text>
              </View>
            </View>
            {classData.meetingLocation && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Lieu</Text>
                <Text style={styles.infoValue}>{classData.meetingLocation}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.scheduleButton} onPress={handleViewSchedule}>
            <View style={styles.scheduleButtonIcon}>
              <Calendar size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.scheduleButtonContent}>
              <Text style={styles.scheduleButtonTitle}>Emploi du temps</Text>
              <Text style={styles.scheduleButtonSubtitle}>
                Voir les créneaux planifiés
              </Text>
            </View>
            <ChevronRight
              size={20}
              color={Colors.textSecondary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Membres ({classData._count?.members || 0})
            </Text>
            {isCreator && (
              <TouchableOpacity style={styles.inviteButton} onPress={handleInviteMembers}>
                <UserPlus size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.inviteButtonText}>Inviter</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.membersList}>
            {classData.members?.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.student.firstName[0]}{member.student.lastName[0]}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.student.firstName} {member.student.lastName}
                  </Text>
                  <Text style={styles.memberEmail}>{member.student.email}</Text>
                </View>
                {member.studentId === classData.createdBy && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
                {isCreator && member.studentId !== classData.createdBy && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveMember(
                        member.studentId,
                        `${member.student.firstName} ${member.student.lastName}`
                      )
                    }
                  >
                    <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {!isCreator && (
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveClass}>
              <Text style={styles.leaveButtonText}>Quitter la classe</Text>
            </TouchableOpacity>
          )}
          {isCreator && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClass}>
              <Text style={styles.deleteButtonText}>Supprimer la classe</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: 0, // Full width without padding constraint
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroContent: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  educationSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  educationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  educationItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
    borderRadius: 8,
    padding: 10,
  },
  educationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  educationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subjectsSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  infoGrid: {
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    marginBottom: 20,
    marginHorizontal: Spacing.lg,
  },
  scheduleButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleButtonContent: {
    flex: 1,
  },
  scheduleButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  scheduleButtonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  membersList: {
    gap: 10,
  },
  memberCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  adminBadge: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    gap: 12,
    marginTop: 20,
    marginHorizontal: Spacing.lg,
  },
  leaveButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  leaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
